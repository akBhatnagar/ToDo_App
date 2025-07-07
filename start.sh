#!/bin/bash

# Todo App Startup Script
echo "🚀 Starting Todo App..."

# Start backend
echo "📡 Starting backend server..."
cd backend
npm start &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Wait a moment for backend to start
sleep 3

# Check if backend is running
if curl -s http://localhost:5656/api/health > /dev/null; then
    echo "✅ Backend is running on http://localhost:5656"
else
    echo "❌ Backend failed to start"
    exit 1
fi

# Start frontend
echo "🎨 Starting frontend development server..."
cd ../frontend
npm start &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"

echo ""
echo "🎉 Todo App is starting up!"
echo "📡 Backend: http://localhost:5656"
echo "🎨 Frontend: http://localhost:5555"
echo ""
echo "To stop the application, run:"
echo "kill $BACKEND_PID $FRONTEND_PID"

# Keep script running
wait
