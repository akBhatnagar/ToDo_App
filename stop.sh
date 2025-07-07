#!/bin/bash

# Todo App Stop Script
echo "🛑 Stopping Todo App..."

# Stop all Node.js processes related to our app
echo "📡 Stopping backend server..."
pkill -f "node index.js"

echo "🎨 Stopping frontend development server..."
pkill -f "react-scripts start"

echo "✅ Todo App stopped successfully!"
