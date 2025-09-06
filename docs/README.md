# Online Examination System

A comprehensive web-based examination platform built with React 18 + Vite frontend and Node.js + Express backend. Features role-based authentication, timer-based exams, AI-powered grading, and detailed analytics.

## Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin, Instructor, Student)
- Protected routes and API endpoints
- Secure password handling (ready for bcrypt integration)

### 👨‍🎓 Student Features
- Dashboard with upcoming and completed exams
- Timer-based exam interface with auto-submit
- Question navigator with status tracking
- Real-time answer saving
- Detailed results and performance analytics
- Mark questions for review

### 👨‍🏫 Instructor Features
- Exam creation and management
- Multiple question types (MCQ, True/False, Short Answer)
- Question builder with rich options
- Student assignment and progress tracking
- AI-powered grading for short answers
- Comprehensive analytics dashboard

### 👨‍💼 Admin Features
- User management and role assignment
- System-wide analytics and reporting
- Exam oversight and monitoring
- User activity tracking

### 🤖 AI-Powered Grading
- Intelligent short answer evaluation
- OpenAI GPT-5 integration with fallback to mock grading
- Customizable sample answers for training
- Detailed feedback generation
- Configurable grading criteria

## Tech Stack

### Frontend
- **React 18** with Vite for fast development
- **Redux Toolkit** for state management
- **React Router v6+** for navigation
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Axios** with authentication interceptors
- **Lucide React** for icons

### Backend
- **Node.js + Express** REST API
- **JWT** for authentication
- **In-memory storage** (easily replaceable with database)
- **OpenAI API** integration for AI grading
- **ES Modules** for modern JavaScript

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- OpenAI API key (optional, for AI grading)

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd online-examination-system
npm install
