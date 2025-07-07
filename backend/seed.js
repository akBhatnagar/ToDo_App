const Database = require('./database');

// Sample data
const sampleGroups = [
  { name: 'Work', color: '#007bff' },
  { name: 'Personal', color: '#28a745' },
  { name: 'Shopping', color: '#dc3545' },
  { name: 'Health', color: '#ffc107' },
  { name: 'Learning', color: '#17a2b8' },
  { name: 'Projects', color: '#6f42c1' },
  { name: 'Travel', color: '#fd7e14' }
];

const sampleTodos = [
  // Work todos
  { title: 'Prepare quarterly report', description: 'Compile Q4 data and create presentation for management', group: 'Work' },
  { title: 'Team meeting at 3 PM', description: 'Discuss project timeline and resource allocation', group: 'Work' },
  { title: 'Code review for new feature', description: 'Review pull requests from the development team', group: 'Work' },
  { title: 'Update project documentation', description: 'Add new API endpoints to the documentation', group: 'Work' },
  
  // Personal todos
  { title: 'Call mom on Sunday', description: 'Weekly check-in call with family', group: 'Personal' },
  { title: 'Organize photo albums', description: 'Sort through vacation photos and create albums', group: 'Personal' },
  { title: 'Plan weekend activities', description: 'Research local events and make plans', group: 'Personal' },
  { title: 'Backup computer files', description: 'Create backup of important documents and photos', group: 'Personal' },
  
  // Shopping todos
  { title: 'Buy groceries', description: 'Milk, bread, eggs, fruits, and vegetables', group: 'Shopping' },
  { title: 'Pick up dry cleaning', description: 'Collect suits and dresses from the cleaners', group: 'Shopping' },
  { title: 'Order new laptop charger', description: 'Current charger is showing signs of wear', group: 'Shopping' },
  { title: 'Buy birthday gift for Sarah', description: 'Her birthday is next week, need to find something nice', group: 'Shopping' },
  
  // Health todos
  { title: 'Schedule dentist appointment', description: 'Due for regular cleaning and checkup', group: 'Health' },
  { title: 'Morning jog in the park', description: '30-minute run to maintain fitness routine', group: 'Health' },
  { title: 'Meal prep for the week', description: 'Prepare healthy meals for Monday through Friday', group: 'Health' },
  { title: 'Take vitamins', description: 'Daily vitamin D and B12 supplements', group: 'Health' },
  
  // Learning todos
  { title: 'Complete React course chapter 5', description: 'Learn about hooks and state management', group: 'Learning' },
  { title: 'Read 20 pages of "Clean Code"', description: 'Continue reading software development best practices', group: 'Learning' },
  { title: 'Practice Spanish for 30 minutes', description: 'Use Duolingo app for daily language practice', group: 'Learning' },
  { title: 'Watch TypeScript tutorial', description: 'Learn advanced TypeScript concepts on YouTube', group: 'Learning' },
  
  // Projects todos
  { title: 'Fix website responsive design', description: 'Improve mobile layout and navigation', group: 'Projects' },
  { title: 'Deploy app to production', description: 'Set up CI/CD pipeline and deploy latest version', group: 'Projects' },
  { title: 'Write unit tests', description: 'Add test coverage for new components and functions', group: 'Projects' },
  { title: 'Database optimization', description: 'Optimize queries and add proper indexing', group: 'Projects' },
  
  // Travel todos
  { title: 'Book flight tickets', description: 'Find good deals for summer vacation to Europe', group: 'Travel' },
  { title: 'Research hotels in Paris', description: 'Compare prices and locations for 5-day stay', group: 'Travel' },
  { title: 'Apply for travel insurance', description: 'Get comprehensive coverage for international trip', group: 'Travel' },
  { title: 'Create packing checklist', description: 'List all items needed for 2-week vacation', group: 'Travel' },
  { title: 'Learn basic French phrases', description: 'Essential phrases for traveling in France', group: 'Travel' },
  { title: 'Check passport expiration', description: 'Ensure passport is valid for at least 6 months', group: 'Travel' },
  { title: 'Exchange currency', description: 'Get some Euros for initial expenses upon arrival', group: 'Travel' }
];

function getRandomBoolean(probability = 0.5) {
  return Math.random() < probability;
}

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

async function seedDatabase() {
  const db = new Database();
  
  console.log('🌱 Starting database seeding...');
  
  try {
    // First, clear existing data
    console.log('🧹 Clearing existing data...');
    await new Promise((resolve, reject) => {
      db.db.run('DELETE FROM todos', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    await new Promise((resolve, reject) => {
      db.db.run('DELETE FROM groups WHERE name != "General"', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // Insert sample groups
    console.log('👥 Creating sample groups...');
    const groupIds = {};
    
    for (const group of sampleGroups) {
      await new Promise((resolve, reject) => {
        db.db.run(
          'INSERT INTO groups (name, color) VALUES (?, ?)',
          [group.name, group.color],
          function(err) {
            if (err) reject(err);
            else {
              groupIds[group.name] = this.lastID;
              console.log(`  ✅ Created group: ${group.name}`);
              resolve();
            }
          }
        );
      });
    }
    
    // Insert sample todos
    console.log('📝 Creating sample todos...');
    let todoCount = 0;
    
    for (const todo of sampleTodos) {
      const groupId = groupIds[todo.group];
      const completed = getRandomBoolean(0.3); // 30% chance of being completed
      const pinned = getRandomBoolean(0.15); // 15% chance of being pinned
      const hidden = getRandomBoolean(0.1); // 10% chance of being hidden
      
      await new Promise((resolve, reject) => {
        db.db.run(
          'INSERT INTO todos (title, description, group_id, completed, pinned, hidden) VALUES (?, ?, ?, ?, ?, ?)',
          [todo.title, todo.description, groupId, completed ? 1 : 0, pinned ? 1 : 0, hidden ? 1 : 0],
          function(err) {
            if (err) reject(err);
            else {
              todoCount++;
              const status = [];
              if (completed) status.push('completed');
              if (pinned) status.push('pinned');
              if (hidden) status.push('hidden');
              const statusText = status.length > 0 ? ` (${status.join(', ')})` : '';
              console.log(`  ✅ Created todo: ${todo.title}${statusText}`);
              resolve();
            }
          }
        );
      });
    }
    
    console.log(`\n🎉 Database seeding completed successfully!`);
    console.log(`📊 Summary:`);
    console.log(`   - ${sampleGroups.length} groups created`);
    console.log(`   - ${todoCount} todos created`);
    console.log(`   - Random completion, pinning, and hiding applied`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    db.close();
  }
}

// Run the seeding function
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
