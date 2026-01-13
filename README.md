# AI Mock Interview Platform

![Docker](https://img.shields.io/docker/v/aarish312/mock-interview-platform?label=Docker%20Hub&color=2496ED)
![Build](https://github.com/aarish-io/ai_mock_interview/workflows/Build%20and%20Push%20Docker%20Image/badge.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![License](https://img.shields.io/badge/license-MIT-green)

A comprehensive Mock Interview Platform powered by AI to help users practice and improve their interview skills.

## 🐳 Docker Setup

### Quick Start

The easiest way to run this project is using Docker Compose:

```bash
# Clone the repo
git clone https://github.com/aarish-io/ai_mock_interview.git
cd ai_mock_interview

# Copy environment file and add your keys
cp .env.example .env.local

# Run with Docker Compose
docker compose up
```

Visit [http://localhost:3000](http://localhost:3000)

### Build Locally

```bash
# Build the Docker image
docker build -t mock-interview-platform .

# Run the container
docker run -p 3000:3000 --env-file .env.local mock-interview-platform
```

### Using Pre-built Image

```bash
# Pull from Docker Hub
docker pull aarish312/mock-interview-platform:latest

# Run it
docker run -p 3000:3000 --env-file .env.local aarish312/mock-interview-platform:latest
```

## 🚀 Getting Started (Development)

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🔑 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API Key | Yes |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | Yes |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Project ID | Yes |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket | Yes |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID | Yes |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase App ID | Yes |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google Gemini AI Key | Yes |
| `RETELL_API_KEY` | Retell AI Key | Yes |

## 📚 Documentation

For more detailed information about the system architecture, please read [ARCHITECTURE.md](ARCHITECTURE.md).

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS, Shadcn UI
- **Backend**: Next.js Server Actions, API Routes
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication
- **AI**: Google Gemini Pro (Generation), Retell AI (Voice)
- **Container**: Docker
- **CI/CD**: GitHub Actions

## 📄 License

MIT
