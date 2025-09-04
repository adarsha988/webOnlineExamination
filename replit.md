# Online Examination System

## Overview

This is a comprehensive web-based examination platform that enables educational institutions to conduct online exams with role-based access control. The system supports three user roles - Admin, Instructor, and Student - each with specific capabilities for managing and taking exams. The platform features timer-based exam sessions, AI-powered grading for short answers, real-time answer saving, and detailed analytics for performance tracking.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with Vite for fast development and hot module replacement
- **State Management**: Redux Toolkit for centralized state management with separate slices for authentication, exams, and attempts
- **Routing**: Wouter for lightweight client-side routing with role-based protected routes
- **UI Components**: Radix UI components with Tailwind CSS for styling, providing a modern and accessible interface
- **Data Fetching**: TanStack Query for server state management with custom query client configuration
- **Styling**: Tailwind CSS with CSS variables for theming and shadcn/ui design system

### Backend Architecture
- **Runtime**: Node.js with Express.js framework for RESTful API endpoints
- **Authentication**: JWT-based authentication with role-based authorization middleware
- **Data Storage**: In-memory storage implementation with interface for easy database migration (currently uses Map-based storage, ready for PostgreSQL with Drizzle ORM)
- **API Design**: RESTful endpoints with proper HTTP status codes and error handling
- **Middleware**: CORS configuration, request logging, and authentication interceptors

### Authentication & Authorization
- **JWT Tokens**: Stateless authentication with 24-hour expiration
- **Role-Based Access**: Three roles (admin, instructor, student) with specific permissions
- **Protected Routes**: Frontend route guards and backend middleware for access control
- **Password Security**: Ready for bcrypt integration (currently uses plain text for demo)

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect configuration
- **Schema Design**: Type-safe database schema with proper relationships between users, exams, questions, and attempts
- **Storage Interface**: Abstract storage interface allowing easy transition from in-memory to database storage
- **Migration Ready**: Drizzle migration configuration for database schema evolution

### AI Integration
- **Grading Service**: AI-powered short answer evaluation with mock implementation and OpenAI integration ready
- **Fallback System**: Mock grading service for development and demonstration purposes
- **Sample Answers**: Support for training AI grading with sample correct answers

### Real-time Features
- **Timer Management**: Client-side countdown timers with auto-submit functionality
- **Answer Persistence**: Real-time saving of answers during exam sessions
- **Progress Tracking**: Question navigation with completion status indicators

## External Dependencies

### Core Framework Dependencies
- **React 18**: Modern React with concurrent features and improved performance
- **Vite**: Fast build tool and development server with HMR support
- **Express.js**: Minimal web framework for Node.js backend

### UI and Styling
- **Radix UI**: Headless UI components for accessibility and customization
- **Tailwind CSS**: Utility-first CSS framework for rapid styling
- **Lucide React**: Icon library for consistent iconography
- **Framer Motion**: Animation library for smooth transitions

### State Management and Data
- **Redux Toolkit**: Modern Redux with simplified API and built-in best practices
- **TanStack Query**: Powerful data fetching and caching library
- **Drizzle ORM**: Type-safe ORM for PostgreSQL with migration support
- **Zod**: TypeScript-first schema validation library

### Authentication and Security
- **JSON Web Tokens (jsonwebtoken)**: Stateless authentication tokens
- **bcrypt**: Password hashing (ready for integration)

### Database and Storage
- **Neon Database**: Serverless PostgreSQL database platform
- **PostgreSQL**: Primary database for production deployment

### Development and Build Tools
- **TypeScript**: Type safety and better developer experience
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind CSS integration

### Testing and Quality
- **React Hook Form**: Performant forms with easy validation
- **Class Variance Authority**: Utility for creating variant-based component APIs

The system is designed with modularity and scalability in mind, allowing for easy extension of features and migration from development to production environments.