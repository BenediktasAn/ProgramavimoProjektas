ASKKTU — University Chatbot
A chatbot that answers questions about university rules and regulations, built as part of the ASKKTU project.
What it does:
Students can ask questions about scholarships, dormitories, academic integrity, grading policies, and other university regulations. The chatbot retrieves relevant information from official university documents and provides accurate, sourced answers.

Tech stack

Python 3.10+
FastAPI — web framework for the chat API
OpenAI API — LLM for generating responses
RAG (Retrieval-Augmented Generation) — planned for grounding answers in real university documents

Project structure
chatbot/
├── main.py            # FastAPI app with /api/chat endpoint
├── chatbot.py         # Chatbot logic (LLM calls, system prompt)
├── requirements.txt   # Python dependencies
└── documents/         # University documents (to be added)
Setup
1. Create and activate a virtual environment
bashpython -m venv venv
source venv/bin/activate        # Linux/Mac
venv\Scripts\Activate.ps1       # Windows PowerShell
2. Install dependencies
bashpip install -r chatbot/requirements.txt
3. Configure environment variables
Create a .env file in the project root:
OPENAI_API_KEY=your-api-key-here
4. Run the server
bashuvicorn chatbot.main:app --reload --port 8000
5. Test
Open http://localhost:8000/docs in your browser to test the chat endpoint interactively.
API
POST /api/chat
Send a message and receive a chatbot response.
Request:
json{
  "message": "What GPA do I need for a scholarship?",
  "conversation_history": []
}
Response:
json{
  "response": "..."
}
GET /health
Returns server status.