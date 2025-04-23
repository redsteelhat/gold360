#!/bin/bash

# Gold360 Project Setup Script
echo "=== Gold360 Project Setup ==="

# Install dependencies
echo "Installing dependencies..."
npm install
cd frontend && npm install
cd ../backend && npm install
cd ..

# Install TypeScript types
echo "Installing TypeScript types..."
cd frontend && npm install --save-dev @types/react @types/react-dom @types/node
cd ../backend && npm install --save-dev @types/node @types/express @types/sequelize @types/bcryptjs @types/jsonwebtoken
cd ..

# Create environment files
echo "Setting up environment files..."
if [ ! -f "./backend/.env" ]; then
    cp ./backend/.env.example ./backend/.env
fi

if [ ! -f "./frontend/.env" ]; then
    cp ./frontend/.env.example ./frontend/.env
fi

echo "=== Setup Complete ==="
echo "To start the development servers, run: npm run dev"
 