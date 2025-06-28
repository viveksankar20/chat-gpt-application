# ChatGPT Clone with GROQ AI

A modern ChatGPT-like interface built with Next.js 14, TypeScript, MongoDB, Tailwind CSS, and GROQ AI API, integrated with LangChain. Features include multiple chat sessions, persistent storage, message editing/deletion, and support for multiple AI models.

## Features

- 🤖 **GROQ AI Integration** - Powered by GROQ's fast AI models
- 💬 **Multiple Chat Sessions** - Create and manage multiple conversations
- 🔐 **User Authentication** - Secure login/logout with NextAuth.js
- 🎨 **Modern UI** - Beautiful interface with shadcn/ui components
- 🌙 **Dark/Light Mode** - Full theme support with system detection
- ✏️ **Message Management** - Edit and delete messages
- 📱 **Responsive Design** - Works on desktop and mobile
- 🧪 **GROQ Tester** - Test different models and parameters
- 🔒 **Protected Routes** - Secure access to chat features

## Authentication Setup

This project includes a complete authentication system with:

- User registration and login
- Password hashing with bcryptjs
- JWT-based sessions
- Protected routes
- User-specific chat isolation

### Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret_key_here
NEXTAUTH_URL=http://localhost:3000

# GROQ API
OPENAI_API_KEY=your_openai_api_key_here
```

### Generate NextAuth Secret

You can generate a secure secret for NextAuth using:

```bash
openssl rand -base64 32
```

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chat-gpt-application
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env.local`
   - Fill in your MongoDB URI, GROQ API key, and NextAuth secret

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   - Navigate to `http://localhost:3000`
   - Sign up for a new account or sign in
   - Start chatting with GROQ AI!

## Usage

### Authentication
- **Sign Up**: Create a new account with email and password
- **Sign In**: Log in with your credentials
- **Sign Out**: Use the user menu in the navigation bar

### Chat Features
- **New Chat**: Start a new conversation
- **Model Selection**: Choose from different GROQ models
- **Message Editing**: Click the edit icon on any message
- **Message Deletion**: Use the delete button with confirmation
- **Code Copying**: Click the copy button on code blocks

### GROQ Tester
- **Model Testing**: Test different GROQ models
- **Parameter Tuning**: Adjust temperature and max tokens
- **Prompt Modes**: Choose from different system prompts
- **Response Analysis**: View detailed response statistics

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Authentication**: NextAuth.js, bcryptjs
- **Database**: MongoDB with Mongoose
- **AI Integration**: GROQ API, LangChain
- **Markdown**: React Markdown with syntax highlighting

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   └── groq-tester/       # GROQ testing interface
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── chat/             # Chat-related components
│   └── providers/        # Context providers
├── lib/                  # Utility libraries
├── models/               # MongoDB models
├── types/                # TypeScript type definitions
└── middleware.ts         # NextAuth middleware
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
