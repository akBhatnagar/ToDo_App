# Quick Deployment Guide

## 🚀 Quick Start (Development)

### Option 1: Using the startup script
```bash
cd /Users/akshay/Desktop/Projects/todo-app
./start.sh
```

### Option 2: Manual startup
```bash
# Terminal 1 - Backend
cd /Users/akshay/Desktop/Projects/todo-app/backend
npm start

# Terminal 2 - Frontend
cd /Users/akshay/Desktop/Projects/todo-app/frontend
npm start
```

## 🛑 Stopping the Application
```bash
cd /Users/akshay/Desktop/Projects/todo-app
./stop.sh
```

## 📋 Step-by-Step Deployment

### 1. Initial Setup (Only needed once)
```bash
# Navigate to project
cd /Users/akshay/Desktop/Projects/todo-app

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Start Backend Server
```bash
cd /Users/akshay/Desktop/Projects/todo-app/backend
npm start
```
✅ Backend will be available at: http://localhost:5656

### 3. Start Frontend Server
```bash
cd /Users/akshay/Desktop/Projects/todo-app/frontend
npm start
```
✅ Frontend will be available at: http://localhost:5555

### 4. Access the Application
- Open your browser and go to: http://localhost:5555
- The app will automatically open in your default browser

## 🧪 Testing the Application

### Backend API Test
```bash
curl http://localhost:5656/api/health
```
Expected response: `{"status":"OK","timestamp":"..."}`

### Frontend Test
- Navigate to http://localhost:5555
- You should see the Todo App interface
- Try creating a group and adding a todo

## 🔧 Development Workflow

1. **Make backend changes**: Edit files in `/backend`, server will restart automatically
2. **Make frontend changes**: Edit files in `/frontend/src`, changes will hot-reload
3. **Database**: SQLite database file is created automatically at `/backend/todo.db`

## 📦 Production Build

### Backend Production
```bash
cd /Users/akshay/Desktop/Projects/todo-app/backend
NODE_ENV=production npm start
```

### Frontend Production Build
```bash
cd /Users/akshay/Desktop/Projects/todo-app/frontend
npm run build
```
Builds the app for production to the `build` folder.

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill processes on ports 5555 and 5656
lsof -ti:5555 | xargs kill -9
lsof -ti:5656 | xargs kill -9
```

### Reset Database
```bash
rm /Users/akshay/Desktop/Projects/todo-app/backend/todo.db
# Restart backend to recreate database
```

### Clear npm cache
```bash
npm cache clean --force
```

## 🌐 Production Deployment

### Deploy Backend
1. Upload backend files to your server
2. Install dependencies: `npm install --production`
3. Set PORT environment variable
4. Start with: `npm start`

### Deploy Frontend
1. Build the app: `npm run build`
2. Serve the `build` folder with nginx/Apache
3. Update API_BASE_URL in `src/services/api.js`

## 📝 Environment Variables

### Backend (.env file)
```
PORT=5656
NODE_ENV=production
```

### Frontend (environment variables)
```
PORT=5555
REACT_APP_API_URL=http://localhost:5656/api
```

## 🎯 Features to Test

1. **Dark/Light Mode**: Toggle theme button in header
2. **Groups**: Create, edit, delete groups in sidebar
3. **Todos**: Add, complete, pin, hide, delete todos
4. **Filter**: Toggle "Show Hidden" checkbox
5. **Responsive**: Test on mobile device/browser

## 🆘 Common Issues

| Issue | Solution |
|-------|----------|
|| "Cannot connect to backend" | Ensure backend is running on port 5656 |
| "Database error" | Delete todo.db and restart backend |
| "npm install fails" | Clear npm cache and try again |
| "Port in use" | Kill existing processes or use different ports |

## 📞 Support

If you encounter any issues:
1. Check the console for error messages
2. Verify both backend and frontend are running
3. Check network tab in browser dev tools
4. Review the main README.md for detailed information
