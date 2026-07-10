import os
import sys
import webbrowser
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv
import google.generativeai as genai

# Load database helper functions
from .database import get_db_connection

# Load environment variables from .env file
load_dotenv()

# Configure Gemini API
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY is missing from the environment variables.")
genai.configure(api_key=api_key)

# Setup path targets cleanly
current_dir = os.path.dirname(os.path.abspath(__file__))
frontend_dir = os.path.normpath(os.path.join(current_dir, "..", "frontend"))

@asynccontextmanager
async def lifespan(app: FastAPI):
    # This fires up your default web browser automatically when the server is fully ready
    if os.environ.get("UVICORN_MAIN_LOOP") != "true":
        os.environ["UVICORN_MAIN_LOOP"] = "true"
        webbrowser.open("http://127.0.0.1:8000")
    yield

app = FastAPI(lifespan=lifespan)

# Allow Frontend to communicate with Backend (CORS setup)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic data models for Request Validation
class MessageRequest(BaseModel):
    conversation_id: int
    message: str

class NewChatRequest(BaseModel):
    title: str

# --- API ROUTES ---

@app.post("/api/chat/new")
def create_conversation(request: NewChatRequest):
    """Creates a new chat session."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO conversations (title) VALUES (?)", (request.title,))
        conn.commit()
        new_id = cursor.lastrowid
        conn.close()
        return {"conversation_id": new_id, "title": request.title}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/chat/conversations")
def get_conversations():
    """Fetches all past conversations for the sidebar list."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM conversations ORDER BY created_at DESC")
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/chat/conversation/{conversation_id}")
def delete_conversation(conversation_id: int):
    """Deletes a specific chat session and its complete messages."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM conversations WHERE id = ?", (conversation_id,))
        conn.commit()
        conn.close()
        return {"status": "success", "message": f"Conversation {conversation_id} deleted."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat/message")
def chat_with_ai(request: MessageRequest):
    """Handles conversation context retrieval, calls Gemini API, and saves history."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # 1. Save the User's prompt to SQLite database
        cursor.execute(
            "INSERT INTO messages (conversation_id, sender, content) VALUES (?, ?, ?)",
            (request.conversation_id, "user", request.message)
        )
        conn.commit()

        # 2. Retrieve past messages context to feed Gemini (Maintains Session Context)
        cursor.execute(
            "SELECT sender, content FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC",
            (request.conversation_id,)
        )
        history_rows = cursor.fetchall()

        # Formulate structured chat history structure for Gemini model
        formatted_contents = []
        for row in history_rows:
            role = "user" if row["sender"] == "user" else "model"
            formatted_contents.append({
                "role": role,
                "parts": [row["content"]]
            })

        # 3. Request generation processing via Gemini Engine
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(formatted_contents)
        ai_response_text = response.text

        # 4. Save the generated AI Response block into SQLite database
        cursor.execute(
            "INSERT INTO messages (conversation_id, sender, content) VALUES (?, ?, ?)",
            (request.conversation_id, "ai", ai_response_text)
        )
        conn.commit()
        conn.close()

        return {"response": ai_response_text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/chat/messages/{conversation_id}")
def get_chat_messages(conversation_id: int):
    """Loads all logs within a single target active channel room."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC",
            (conversation_id,)
        )
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- SERVE FRONTEND INDEX HTML ---
@app.get("/")
def read_root():
    """Serves index.html properly on the root routing endpoint."""
    index_path = os.path.join(frontend_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    raise HTTPException(status_code=404, detail="index.html file missing from frontend folder.")

# --- SERVE STATIC FILES (CSS & JS) ---
if os.path.exists(frontend_dir):
    app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")