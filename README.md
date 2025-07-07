# Todo List App

A full-stack todo list application built with React, Node.js, and SQLite. Features include dark/light mode toggle, group management, pinning items, and hide functionality.

## Features

- ✅ **Todo Management**: Create, edit, complete, and delete todos
- 📁 **Group Organization**: Create and manage todo groups with custom colors
- 📌 **Pin Items**: Pin important todos to keep them at the top
- 👁️ **Hide/Show**: Hide completed or unnecessary todos with toggle visibility
- 🌙 **Dark/Light Mode**: Toggle between dark and light themes
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 💾 **SQLite Database**: Local database storage

## Technology Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **SQLite3** - Database
- **CORS** - Cross-origin resource sharing

### Frontend
- **React** - UI library
- **Axios** - HTTP client
- **CSS3** - Styling with CSS variables for theming

## Project Structure

```
todo-app/
├── backend/
│   ├── index.js          # Express server
│   ├── database.js       # SQLite database setup
│   ├── package.json      # Backend dependencies
│   └── todo.db          # SQLite database file (created automatically)
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── GroupList.js    # Group management component
│   │   │   ├── TodoList.js     # Todo display component
│   │   │   └── AddTodo.js      # Todo creation component
│   │   ├── context/
│   │   │   └── ThemeContext.js # Dark/light mode context
│   │   ├── services/
│   │   │   └── api.js          # API service layer
│   │   ├── styles/
│   │   │   └── App.css         # Main stylesheet
│   │   ├── App.js              # Main React component
│   │   └── index.js            # React entry point
│   └── package.json            # Frontend dependencies
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)

### Step 1: Clone/Navigate to the Project
```bash
cd /Users/akshay/Desktop/Projects/todo-app
```

### Step 2: Install Backend Dependencies
```bash
cd backend
npm install
```

### Step 3: Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

## Running the Application

### Step 1: Start the Backend Server
```bash
cd /Users/akshay/Desktop/Projects/todo-app/backend
npm start
```
The backend server will run on `http://localhost:5000`

### Step 2: Start the Frontend Development Server
Open a new terminal window/tab:
```bash
cd /Users/akshay/Desktop/Projects/todo-app/frontend
npm start
```
The frontend will run on `http://localhost:3000` and automatically open in your browser.

## API Endpoints

### Groups
- `GET /api/groups` - Get all groups
- `POST /api/groups` - Create a new group
- `PUT /api/groups/:id` - Update a group
- `DELETE /api/groups/:id` - Delete a group

### Todos
- `GET /api/todos` - Get all todos (with optional filters)
- `POST /api/todos` - Create a new todo
- `PUT /api/todos/:id` - Update a todo
- `DELETE /api/todos/:id` - Delete a todo

### Query Parameters for GET /api/todos
- `group_id` - Filter by group ID
- `show_hidden` - Include hidden todos (true/false)

## Database Schema

### Groups Table
```sql
CREATE TABLE groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#007bff',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Todos Table
```sql
CREATE TABLE todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT 0,
  pinned BOOLEAN DEFAULT 0,
  hidden BOOLEAN DEFAULT 0,
  group_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE SET NULL
);
```

## Usage Guide

### Creating Groups
1. In the sidebar, click the "+ Add" button next to "Groups"
2. Enter a group name and select a color
3. Click "Add" to create the group

### Managing Todos
1. Select a group from the sidebar (or "All Tasks" to see everything)
2. Use the form at the top to add new todos
3. Each todo card has buttons for:
   - **Complete/Undo**: Mark as completed
   - **Pin/Unpin**: Pin to top of list
   - **Hide/Unhide**: Hide from main view
   - **Delete**: Remove permanently

### Theme Toggle
- Click the theme toggle button in the header to switch between light and dark modes

### Show Hidden Items
- Check the "Show Hidden" checkbox to view hidden todos

## Development

### Backend Development
The backend uses Express.js with SQLite. The database is automatically created on first run.

Key files:
- `index.js`: Main server file with API routes
- `database.js`: Database initialization and schema

### Frontend Development
The frontend is a React application using functional components and hooks.

Key concepts:
- **Context API**: Used for theme management
- **CSS Variables**: Enable dynamic theming
- **Component Structure**: Modular components for maintainability

### Adding New Features
1. **Backend**: Add new routes in `index.js` and update database schema if needed
2. **Frontend**: Create new components in `src/components/` and update API calls in `src/services/api.js`

## Production Deployment

### Backend Deployment
1. Set environment variables:
   ```bash
   export PORT=5000
   export NODE_ENV=production
   ```
2. Install dependencies: `npm install --production`
3. Start the server: `npm start`

### Frontend Deployment
1. Build the production version:
   ```bash
   cd frontend
   npm run build
   ```
2. Serve the `build` folder using a web server like nginx or Apache
3. Update the API base URL in `src/services/api.js` to point to your production backend

### Environment Configuration
For production, update the `API_BASE_URL` in `frontend/src/services/api.js`:
```javascript
const API_BASE_URL = 'https://your-backend-domain.com/api';
```

## Troubleshooting

### Common Issues

1. **Backend won't start**
   - Check if port 5000 is available
   - Ensure SQLite3 is properly installed

2. **Frontend can't connect to backend**
   - Verify backend is running on port 5000
   - Check CORS configuration
   - Ensure API_BASE_URL is correct

3. **Database errors**
   - Delete `todo.db` file and restart backend to recreate database
   - Check file permissions in the backend directory

### Error Messages
- **"Group name already exists"**: Choose a different group name
- **"Cannot delete group with existing todos"**: Move or delete todos first
- **"Failed to fetch"**: Check if backend server is running

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.
