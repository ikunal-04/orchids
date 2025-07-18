# 🤖 Orchids Assignment

A sophisticated Smart Agent that automates database-related feature development and integration within Next.js + TypeScript applications. Inspired by Orchids.app's vision, this CLI tool processes natural language queries and intelligently modifies project files to set up database schemas, operations, and integrate new functionalities directly into the frontend.

The agent understands the context of a Next.js Spotify clone frontend and seamlessly adds relevant backend and database features.

## 🚀 Features

- **Natural Language Processing**: Convert plain English requests into database operations
- **Intelligent File Modification**: Automatically update schemas, migrations, and frontend code
- **Real-time Development**: Instant feedback and file generation
- **TypeScript Support**: Full type safety throughout the development process

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | Next.js 14 (React 18) |
| **Language** | TypeScript |
| **Runtime** | Node.js 20.x+ |
| **Package Manager** | Bun (recommended) |
| **Database ORM** | Drizzle ORM |
| **Database** | Neon (PostgreSQL-compatible) |
| **AI Model** | Google Gemini 2.5 Pro |
| **CLI Framework** | Commander.js |

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 20.x or higher
  ```bash
  nvm install 20
  nvm use 20
  ```
- **Git**: For cloning the repository
- **Bun**: Recommended package manager (install via [bun.sh](https://bun.sh))

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/ikunal-04/orchids.git
cd orchids
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Environment Configuration

Create a `.env` file in the project root:

```env
# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Neon Database Connection String
DATABASE_URL=your_neon_database_url_here
```

#### Obtaining API Keys

- **GEMINI_API_KEY**: Get your API key from [Google AI Studio](https://aistudio.google.com/)
- **DATABASE_URL**: Obtain your PostgreSQL connection string from your [Neon dashboard](https://console.neon.tech/)


> **Note**: Ensure your `drizzle.config.ts` is properly configured to point to your schema files and database connection.

### 4. Start the Application

```bash
# Start the Next.js development server
bun dev
```

The application will be available at `http://localhost:3000`

## 🚀 Using the Database Agent

The Database Agent is a CLI tool that processes natural language queries to automate database operations.

### Example Queries

```bash
# Store recently played songs
npx tsx src/agent/cli.ts run "Can you store the Made for you and Popular albums in a table"

# Store 'Made for you' and 'Popular albums'
npx tsx agent/cli.ts "Can you store the 'Made for you' and 'Popular albums' in a table"
```

### What Happens

1. The CLI displays its thought process
2. Files are automatically modified based on your query
3. Database schemas and operations are generated
4. Frontend integration code is updated

> **Important**: After running the agent, restart your Next.js development server (`bun dev`) to see changes reflected in the frontend or just refresh the page.

## 📁 Project Structure

```
├── agent/                 # Database Agent CLI implementation
│   ├── cli.ts            # Main CLI entry point
│   └── index.ts          # Agent logic
├── src/
│   ├── app/              # Next.js app directory
│   ├── components/       # React components
│   ├── db/              # Database configuration
│   │   ├── index.ts     # Database connection
│   │   └── schema.ts    # Drizzle schema definitions
│   ├── hooks/           # Custom React hooks
│   └── lib/             # Utility functions
├── drizzle/             # Drizzle migration files
├── public/              # Static assets
├── drizzle.config.ts    # Drizzle configuration
└── package.json         # Project dependencies
```
