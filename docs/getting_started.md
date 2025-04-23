# Getting Started with Gold360

This guide will help you set up the Gold360 project for development on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v18 or higher)
- npm (v7 or higher)
- PostgreSQL (v14 or higher)
- Git

## Setup Steps

1. **Clone the repository**

```bash
git clone <repository-url>
cd gold360
```

2. **Run the setup script**

This script will install dependencies and set up environment files:

```bash
# Make the script executable
chmod +x scripts/setup.sh

# Run the script
./scripts/setup.sh
```

3. **Configure environment variables**

Edit the generated `.env` files in both the `frontend` and `backend` directories:

- `backend/.env`: Configure your database connection, JWT secret, and other backend settings
- `frontend/.env`: Configure the API URL and other frontend settings

4. **Initialize the database**

Create a PostgreSQL database for the project:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create the database
CREATE DATABASE gold360;

# Exit PostgreSQL
\q
```

5. **Start the development servers**

```bash
# Start both frontend and backend servers
npm run dev

# To start them separately:
# Frontend only
npm run dev:frontend

# Backend only
npm run dev:backend
```

## Addressing TypeScript Errors

The project currently has some TypeScript errors that need to be fixed before it can be fully functional:

1. Install missing TypeScript types (if not already done by the setup script):

```bash
cd frontend
npm install --save-dev @types/react @types/react-dom @types/node

cd ../backend
npm install --save-dev @types/node @types/express @types/sequelize @types/bcryptjs @types/jsonwebtoken
```

2. Fix TSX component errors by ensuring React is imported and JSX types are available

3. Fix backend model errors related to Sequelize model definitions

## Key URLs

Once the server is running, you can access:

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/api
- API Health Check: http://localhost:4000/health

## Project Structure Overview

- `frontend/`: Next.js application
  - `src/app/`: Next.js App Router
  - `src/components/`: Reusable UI components
  - `src/hooks/`: Custom React hooks
  - `src/contexts/`: React context providers

- `backend/`: Express API server
  - `src/controllers/`: API route handlers
  - `src/models/`: Database models
  - `src/routes/`: API route definitions
  - `src/middlewares/`: Express middlewares
  - `src/config/`: Configuration files

## Recommended Development Tools

- VS Code with the following extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - PostgreSQL

## Getting Help

If you encounter any issues during setup or development, please check the project documentation or reach out to the technical lead. 