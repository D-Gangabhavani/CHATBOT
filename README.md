<<<<<<< HEAD
# AI Chatbot Web Application

## Project Overview

This project is a full-stack AI chatbot web application developed using FastAPI, SQLite, HTML, CSS, and JavaScript. The application allows users to create multiple chat conversations, interact with Google's Gemini AI model, and store chat history permanently in a SQLite database.

The frontend provides a modern and responsive chat interface with features such as conversation management, dark/light theme switching, and chat history navigation. The backend handles API requests, database operations, conversation management, and communication with the Gemini AI model.

## Key Features

* AI-powered chatbot using Google Gemini API
* Multiple conversation support
* Persistent chat history using SQLite
* Create and delete chat sessions
* Conversation sidebar navigation
* Dark and Light theme support
* FastAPI-based REST API backend
* Responsive user interface

## Technologies Used

### Frontend

* HTML
* CSS
* JavaScript

### Backend

* Fast API
* Python
* Google Gemini API

### Database

* SQLite

## Project Structure


KHUB_Chatbot/
│
├── backend/
│   ├── chatbot.sqlite
│   ├── database.py
│   └── main.py
│
├── frontend/
│   ├── app.js
│   ├── index.html
│   └── style.css
│
├── venv/
├── .env
├── .gitignore
└── README.md

## Database Design

The application uses SQLite as the database management system. The database file is named `chatbot.sqlite`.

It has three tables as shown below

### 1. Conversations Table

Stores information about each chat session.

| Column Name | Description |
|------------|-------------|
| id | Unique conversation ID |
| title | Conversation title |
| created_at | Conversation creation timestamp |

### 2. Messages Table

Stores all user and AI messages.

| Column Name | Description |
|------------|-------------|
| id | Unique message ID |
| conversation_id | Associated conversation ID |
| sender | User or AI |
| content | Message text |
| timestamp | Message timestamp |

### 3. sqlite_sequence Table

This is an internal SQLite system table automatically created when AUTOINCREMENT is used.

| Column Name | Description |
|------------|-------------|
| name | Table name |
| seq | Last generated ID value |

Purpose:
- Stores the last generated ID for each table.
- Helps SQLite generate the next unique ID automatically.


## Application Workflow

The chatbot follows the workflow below:

1. The user enters a message through the frontend interface.
2. The frontend sends the message to the FastAPI backend using REST APIs.
3. The backend stores the user message in the SQLite database.
4. The backend retrieves previous conversation history for context.
5. The conversation history is sent to the Google Gemini API.
6. Gemini generates a response based on the conversation context.
7. The backend stores the AI response in the database.
8. The response is returned to the frontend and displayed to the user.

### Workflow Diagram

User
  ↓
Frontend (HTML, CSS, JavaScript)
  ↓
FastAPI Backend
  ↓
SQLite Database
  ↓
Google Gemini API
  ↓
AI Response
  ↓
Frontend Display

## API Endpoints

| Method | Endpoint | Purpose |
|----------|----------|----------|
| POST | /api/chat/new | Create a new conversation |
| GET | /api/chat/conversations | Get all conversations |
| DELETE | /api/chat/conversation/{id} | Delete a conversation |
| POST | /api/chat/message | Send a message to AI |
| GET | /api/chat/messages/{id} | Get messages of a conversation |


## Project Configuration

### 1. Create Environment File

Create a `.env` file in the project root directory and add your Gemini API key.


GEMINI_API_KEY=your_api_key_here

### 2. Backend Configuration

The backend code is implemented in:

- `database.py` – Database creation and management
- `main.py` – FastAPI server, API endpoints, and Gemini integration

### 3. Frontend Configuration

The frontend interface is implemented using:

- `index.html` – User Interface Structure
- `style.css` – Application Styling
- `app.js` – Frontend Logic and API Communication

After configuring all files and saving the project, run the application using the steps below.

## Installation and Setup

### 1. Create a Virtual Environment

python -m venv venv

### 2. Activate the Virtual Environment

venv\Scripts\activate

### 3. Install Required Dependencies

pip install fastapi uvicorn python-dotenv google-generativeai

### 4. Configure Environment Variables

Create a `.env` file and add:

GEMINI_API_KEY=your_api_key_here

### 5. Run the Application

python -m uvicorn backend.main:app --reload

### 6. Open in Browser

http://127.0.0.1:8000

## Future Enhancements

- User authentication and login system
- Chat export functionality
- File upload support
- Voice-based chatbot interaction
- Multiple AI model integration
- Cloud database support
- Conversation search functionality
- User profile management

## Conclusion

This project demonstrates the development of a full-stack AI chatbot application using FastAPI, SQLite, HTML, CSS, and JavaScript. The chatbot supports conversation management, persistent chat history, and AI-powered responses through the Google Gemini API. The application follows a clean frontend-backend architecture and provides an interactive user experience.
=======
# CHATBOT
>>>>>>> 72307a1ad8318c76672efb0a503aa0ca5061c5b4
