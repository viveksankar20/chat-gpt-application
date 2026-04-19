# Nexus AI

A full-stack, production-ready AI Chat application built with **Next.js 14**, **React**, **MongoDB**, and **Tailwind CSS**. This project closely mimics the ChatGPT interface while offering advanced multi-model capabilities, orchestrator failover logic, and a dedicated "Compare Mode" to test different Large Language Models simultaneously.

---

## 🌟 Key Features

### 1. **Multi-Model Support & Orchestration**
Instead of relying on a single AI provider, the app uses an advanced backend `Orchestrator Service`.
*   **Provider Registry:** Supports integrating multiple providers like Groq, Gemini, OpenRouter, and TogetherAI.
*   **Failover Mechanism:** If a model (e.g., Gemini) fails or API keys are missing, the orchestrator automatically reroutes the request to the next available priority model (e.g., Groq's Llama 3.3).
*   **Intent Detection:** Analyzes user prompts to route them to the most suitable model (e.g., coding vs. general chatting).

### 2. **Compare Mode**
*   **Parallel Execution:** Send a single prompt to 3 different AI models simultaneously.
*   **Performance Ranking:** Models are ranked based on their response time (ms) with a visual `#1` trophy badge.
*   **Full Markdown:** Compare cards fully support Markdown rendering, syntax highlighting, and offer individual "Copy response" buttons.
*   **Feedback System:** Like/Dislike buttons for each generated response to collect user preference analytics.

### 3. **Rich Chat Interface**
*   **Markdown & Code Blocks:** Powered by `react-markdown`, `remark-gfm`, and `rehype-highlight`. Code blocks preserve indentation, include language labels, and feature an integrated "Copy code" button.
*   **Smart Input Area:** `Shift + Enter` allows multi-line text, while `Enter` sends the message. Features a live character counter that warns users approaching token limits (3,000+ chars).
*   **Message Management:** Edit or Delete individual messages. Failed network requests show an inline "Click to Retry" banner.

### 4. **Sidebar & Chat Management**
*   **CRUD Operations:** Seamlessly Create, Rename, and Delete conversation threads.
*   **State Syncing:** Renaming a chat highlights the text perfectly seamlessly without unselecting the input. Deleting a chat seamlessly redirects you to an available existing chat or opens a fresh one.
*   **Mobile Responsiveness:** A fully responsive sidebar powered by a `shadcn/ui` Sheet, toggled via a hamburger menu. The sidebar automatically collapses upon selecting a chat on mobile devices.

### 5. **Authentication & Database**
*   **NextAuth.js Integration:** Secure email/password authentication (powered by `bcryptjs` for hashing).
*   **Data Persistence:** Chats, messages, and user accounts are securely stored in **MongoDB** via `mongoose`.
*   **Session Guards:** All API mutation endpoints evaluate the backend session, ensuring users can only read, edit, or delete their distinct chat histories.

---

## 🛠️ Technology Stack

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 14 (App Router) | Core React framework for SSR and routing. |
| **Language** | TypeScript | Strong typing for fewer runtime errors. |
| **Styling** | Tailwind CSS & `shadcn/ui` | Modular, responsive styling, and pre-built accessible UI components. |
| **Database** | MongoDB & Mongoose | NoSQL database for flexible chat history storage. |
| **Authentication** | NextAuth.js | Session management and secure user logins. |
| **State Management**| Zustand | Lightweight global state for the mobile sidebar (`isOpen`). |
| **Markdown** | `react-markdown`, `rehype-highlight` | Rendering server responses gracefully into HTML components and syntax-highlighted code blocks. |
| **Toast Analytics** | `react-toastify` | Elegant error handling and success popups. |

---

## 📁 System Architecture

The application is heavily modularized to maintain clean separation of concerns.

### Backend Infrastructure (`/backend/services`)
1.  **`orchestrator.service.ts`**: The brain of the API. Determines which model to use. If `modelReq.invoke()` fails, it catches the error and executes `failover()`.
2.  **`models.config.ts`**: A centralized configuration file giving every model (e.g., `llama-3.3-70b-versatile`, `gemini-1.5-flash`) a priority score, capability tags, and memory limits.
3.  **`providerRegistry.ts`**: Maps provider strings (e.g., `'groq'`) to their respective instantiated service classes (`groq.service.ts`, `gemini.service.ts`).
4.  **`intent.service.ts`**: NLP logic to determine if the prompt is asking for code, creative writing, or factual analysis.

### Frontend Components (`/components/chat`)
1.  **`chat-client.tsx`**: The master Client Component coordinating `messages`, `activeChat`, Mode switching (Chat vs Compare), and `sendMessage` network requests.
2.  **`chat-sidebar.tsx`**: Renders the history list. Manages in-line renaming and deletions.
3.  **`message-item.tsx`**: The highly polished chat bubble rendering the AI and User payloads. Contains the custom Markdown schema map.
4.  **`CompareView.tsx`**: A dashboard grid mapping `Promise.allSettled()` results into tiered ranking cards.

---

## 🚀 Getting Started

### 1. Environment Variables
Create a `.env` file in the root directory:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.xyz.mongodb.net/chatgpt
NEXTAUTH_SECRET=your_super_secret_key_here
NEXTAUTH_URL=http://localhost:3000

# API Keys
OPENAI_API_KEY=your_groq_api_key_here  # Used for mapping Groq calls
GEMINI_API_KEY=your_gemini_api_key_here # Optional
```

### 2. Installation
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Navigate to `http://localhost:3000`. You will be prompted to create an account or sign in.

---

## 🐛 Recent Fixes & Quality Improvements
This repository went through a rigorous QA audit. Distinct issues patched recently include:
*   **Orchestrator Failover Leak:** Fixed an issue where the Gemini API was returning a "mock text" string instead of failing, blocking failover logic. Unconfigured APIs now throw explicit runtime errors allowing the Orchestrator to route logic properly to Groq.
*   **Code Block Formatting:** Prevented `rehype-highlight` from stripping carriage returns, ensuring Python/JS logic breaks lines correctly in wrapped `<pre>` tags.
*   **Mobile Sidebar Interruption:** The mobile Hamburger menu previously stayed open while switching paths. The state is now correctly unmounted `toggle()` upon selection.
*   **Compare Mode Skeleton:** Loading states were rewritten to safely query CSS variables (`bg-muted`), seamlessly respecting standard Light/Dark user preferences.
