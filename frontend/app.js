const API_URL = "http://127.0.0.1:8000/api";
let currentConversationId = null;

// DOM Layout References Mapping
const appContainer = document.getElementById("app-container");
const menuToggleOpen = document.getElementById("menu-toggle-open");
const menuToggleClose = document.getElementById("menu-toggle-close");
const conversationsList = document.getElementById("conversations-list");
const messagesContainer = document.getElementById("messages-container");
const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");
const newChatBtn = document.getElementById("new-chat-btn");
const heroScreen = document.getElementById("hero-screen");
const themeToggleBtn = document.getElementById("theme-toggle-btn");

// Premium Custom Pop-up Modal Elements Mapping
const customModal = document.getElementById("custom-confirm-modal");
const modalMsgText = document.getElementById("modal-msg-text");
const modalCancelBtn = document.getElementById("modal-cancel-btn");
const modalConfirmBtn = document.getElementById("modal-confirm-btn");
let pendingDeletionConfig = null;

// --- SIDEBAR DYNAMIC STATE CONTROLS ---
if (menuToggleOpen) menuToggleOpen.addEventListener("click", () => appContainer.classList.remove("sidebar-collapsed"));
if (menuToggleClose) menuToggleClose.addEventListener("click", () => appContainer.classList.add("sidebar-collapsed"));

// --- LIGHT/DARK THEME TOGGLE LOGIC ---
if (localStorage.getItem("theme") === "dark") {
    document.body.setAttribute("data-theme", "dark");
    if (themeToggleBtn) themeToggleBtn.innerHTML = `<span class="material-symbols-rounded">light_mode</span>`;
}

if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
        const currentTheme = document.body.getAttribute("data-theme");
        if (currentTheme === "dark") {
            document.body.removeAttribute("data-theme");
            localStorage.setItem("theme", "light");
            themeToggleBtn.innerHTML = `<span class="material-symbols-rounded">dark_mode</span>`;
        } else {
            document.body.setAttribute("data-theme", "dark");
            localStorage.setItem("theme", "dark");
            themeToggleBtn.innerHTML = `<span class="material-symbols-rounded">light_mode</span>`;
        }
    });
}

// Fetch conversations
async function loadConversations() {
    try {
        const res = await fetch(`${API_URL}/chat/conversations`);
        const conversations = await res.json();
        
        conversationsList.innerHTML = "";
        conversations.forEach(chat => {
            const chatItem = document.createElement("div");
            chatItem.classList.add("chat-item");
            if (chat.id === currentConversationId) chatItem.classList.add("active");
            
            const titleSpan = document.createElement("span");
            titleSpan.classList.add("chat-title-text");
            titleSpan.innerText = chat.title;
            titleSpan.addEventListener("click", () => selectConversation(chat.id));
            chatItem.appendChild(titleSpan);

            const deleteBtn = document.createElement("button");
            deleteBtn.classList.add("delete-chat-btn");
            deleteBtn.innerHTML = `<span class="material-symbols-outlined" style="font-size: 18px;">delete</span>`;
            
            // Custom popup modal activates instead of standard browser alert
            deleteBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                modalMsgText.innerText = `Are you sure you want to delete the chat "${chat.title}"?`;
                customModal.style.display = "flex";
                
                pendingDeletionConfig = async () => {
                    try {
                        const deleteRes = await fetch(`${API_URL}/chat/conversation/${chat.id}`, {
                            method: "DELETE"
                        });
                        const data = await deleteRes.json();
                        if (data.status === "success") {
                            if (currentConversationId === chat.id) {
                                startFreshSession();
                            } else {
                                loadConversations();
                            }
                        }
                    } catch (err) {
                        console.error("Deletion stream error:", err);
                    }
                };
            });

            chatItem.appendChild(deleteBtn);
            conversationsList.appendChild(chatItem);
        });
    } catch (err) {
        console.error("History fetch down pipeline logs failure:", err);
    }
}

// Custom Modal Button Event Listeners
if (modalCancelBtn) {
    modalCancelBtn.addEventListener("click", () => {
        customModal.style.display = "none";
        pendingDeletionConfig = null;
    });
}
if (modalConfirmBtn) {
    modalConfirmBtn.addEventListener("click", async () => {
        customModal.style.display = "none";
        if (pendingDeletionConfig) {
            await pendingDeletionConfig();
            pendingDeletionConfig = null;
        }
    });
}

// Select targeted workspace conversation log streams
async function selectConversation(id) {
    currentConversationId = id;
    if (heroScreen) heroScreen.style.display = "none";

    loadConversations();

    try {
        const res = await fetch(`${API_URL}/chat/messages/${id}`);
        const messages = await res.json();
        
        messagesContainer.innerHTML = "";
        messages.forEach(msg => {
            appendMessage(msg.sender, msg.content);
        });
        scrollToBottom();
    } catch (err) {
        console.error("Conversation loader logs failure stream mapping:", err);
    }
}

// New Session initializer
function startFreshSession() {
    currentConversationId = null;
    messagesContainer.innerHTML = `
        <div class="hero-screen" id="hero-screen">
            <h1>What’s on your mind? Let’s build something great.</h1>
        </div>`;
    loadConversations();
}
if (newChatBtn) newChatBtn.addEventListener("click", startFreshSession);

// Data submit actions
chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = userInput.value.trim();
    if (!text) return;

    const currentHero = document.getElementById("hero-screen");
    if (currentHero) currentHero.style.display = "none";

    // Smart persona filtering for title generation
    if (!currentConversationId) {
        let generatedTitle = "New Chat";
        let cleanText = text.trim();
        let lowerText = cleanText.toLowerCase();

        // System/persona phrases list to remove from layout titles
        const cleanFilters = [
            "think like a machine learning engineer and answer my question",
            "think like an machine learning engineer and answer my question",
            "think like a machine learning engineer",
            "think like an machine learning engineer",
            "answer my question what is the difference between",
            "answer my question what is the difference",
            "what is the difference between",
            "difference between",
            "what is the difference",
            "what is",
            "tell me about",
            "do you know",
            "explain about",
            "explain",
            "please"
        ];

        for (let filter of cleanFilters) {
            if (lowerText.startsWith(filter)) {
                cleanText = cleanText.substring(filter.length).trim();
                lowerText = cleanText.toLowerCase();
            }
        }

        // Strip leading symbols or symbols left behind
        cleanText = cleanText.replace(/^[?.,:\-\s]+/i, '').trim();

        if (cleanText) {
            // Capitalize the first letter of the remaining clean topic string
            let finalSubject = cleanText.charAt(0).toUpperCase() + cleanText.slice(1);
            generatedTitle = finalSubject;
        } else {
            // Safe fallback logic if string operation wipes the content
            const simpleWords = text.replace(/[?,.!]/g, "").trim().split(/\s+/);
            generatedTitle = simpleWords.slice(0, 3).join(" ");
        }

        if (generatedTitle.length > 24) {
            generatedTitle = generatedTitle.substring(0, 24) + "...";
        }

        try {
            const res = await fetch(`${API_URL}/chat/new`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: generatedTitle })
            });
            const newChat = await res.json();
            currentConversationId = newChat.conversation_id;
        } catch (err) {
            console.error("Automatic room validation pipeline block failure:", err);
            return;
        }
    }

    appendMessage("user", text);
    userInput.value = "";
    scrollToBottom();

    const loadingMessage = appendMessage("ai", `<span class="searching-text">Searching...</span>`);

    try {
        const res = await fetch(`${API_URL}/chat/message`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                conversation_id: currentConversationId,
                message: text
            })
        });
        const data = await res.json();
        
        let finalResponse = "No response received";
        if (typeof data === "string") {
            finalResponse = data;
        } else if (data.response) {
            finalResponse = data.response;
        } else if (data.reply) {
            finalResponse = data.reply;
        } else if (data.message) {
            finalResponse = data.message;
        } else {
            finalResponse = JSON.stringify(data);
        }
        
        loadingMessage.innerHTML = parseMarkdown(finalResponse);
        loadConversations(); 
        scrollToBottom();
    } catch (err) {
        loadingMessage.innerText = "Error pulling response from database.";
        console.error(err);
    }
});

function parseMarkdown(text) {
    if (!text) return "";
    let formatted = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
        .replace(/^\s*\*\s(.*)$/gm, '• $1')             
        .replace(/\n/g, '<br>');                        
    return formatted;
}

function appendMessage(sender, content) {
    const row = document.createElement("div");
    row.classList.add("message-row", sender);

    const bubble = document.createElement("div");
    bubble.classList.add("message-bubble");
    
    if (sender === "user") {
        bubble.innerText = content;
    } else {
        if(content.includes('searching-text')) {
            bubble.innerHTML = content;
        } else {
            bubble.innerHTML = parseMarkdown(content);
        }
    }

    row.appendChild(bubble);
    messagesContainer.appendChild(row);
    return bubble;
}

// Utility viewport frame control
function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

loadConversations();