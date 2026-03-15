const Database = require('./database');

const sampleGroups = [
  { name: 'Work', color: '#3b82f6' },
  { name: 'Personal', color: '#22c55e' },
  { name: 'Shopping', color: '#ef4444' },
  { name: 'Health', color: '#f59e0b' },
  { name: 'Learning', color: '#8b5cf6' },
  { name: 'Projects', color: '#6366f1' },
  { name: 'Travel', color: '#f97316' },
];

const sampleTodos = [
  { title: 'Prepare quarterly report', description: 'Compile Q4 data and create presentation for management', group: 'Work' },
  { title: 'Team meeting at 3 PM', description: 'Discuss project timeline and resource allocation', group: 'Work' },
  { title: 'Code review for new feature', description: 'Review pull requests from the development team', group: 'Work' },
  { title: 'Update project documentation', description: 'Add new API endpoints to the documentation', group: 'Work' },
  { title: 'Call mom on Sunday', description: 'Weekly check-in call with family', group: 'Personal' },
  { title: 'Organize photo albums', description: 'Sort through vacation photos and create albums', group: 'Personal' },
  { title: 'Plan weekend activities', description: 'Research local events and make plans', group: 'Personal' },
  { title: 'Backup computer files', description: 'Create backup of important documents and photos', group: 'Personal' },
  { title: 'Buy groceries', description: 'Milk, bread, eggs, fruits, and vegetables', group: 'Shopping' },
  { title: 'Pick up dry cleaning', description: 'Collect suits and dresses from the cleaners', group: 'Shopping' },
  { title: 'Order new laptop charger', description: 'Current charger is showing signs of wear', group: 'Shopping' },
  { title: 'Buy birthday gift for Sarah', description: 'Her birthday is next week, need to find something nice', group: 'Shopping' },
  { title: 'Schedule dentist appointment', description: 'Due for regular cleaning and checkup', group: 'Health' },
  { title: 'Morning jog in the park', description: '30-minute run to maintain fitness routine', group: 'Health' },
  { title: 'Meal prep for the week', description: 'Prepare healthy meals for Monday through Friday', group: 'Health' },
  { title: 'Take vitamins', description: 'Daily vitamin D and B12 supplements', group: 'Health' },
  { title: 'Complete React course chapter 5', description: 'Learn about hooks and state management', group: 'Learning' },
  { title: 'Read 20 pages of "Clean Code"', description: 'Continue reading software development best practices', group: 'Learning' },
  { title: 'Practice Spanish for 30 minutes', description: 'Use Duolingo app for daily language practice', group: 'Learning' },
  { title: 'Watch TypeScript tutorial', description: 'Learn advanced TypeScript concepts on YouTube', group: 'Learning' },
  { title: 'Fix website responsive design', description: 'Improve mobile layout and navigation', group: 'Projects' },
  { title: 'Deploy app to production', description: 'Set up CI/CD pipeline and deploy latest version', group: 'Projects' },
  { title: 'Write unit tests', description: 'Add test coverage for new components and functions', group: 'Projects' },
  { title: 'Database optimization', description: 'Optimize queries and add proper indexing', group: 'Projects' },
  { title: 'Book flight tickets', description: 'Find good deals for summer vacation to Europe', group: 'Travel' },
  { title: 'Research hotels in Paris', description: 'Compare prices and locations for 5-day stay', group: 'Travel' },
  { title: 'Apply for travel insurance', description: 'Get comprehensive coverage for international trip', group: 'Travel' },
  { title: 'Create packing checklist', description: 'List all items needed for 2-week vacation', group: 'Travel' },
];

function randomBool(probability = 0.5) {
  return Math.random() < probability;
}

async function seedDatabase() {
  const db = new Database();

  try {
    await db.init();
    console.log('Clearing existing data...');

    await db.run('DELETE FROM todos');
    await db.run('DELETE FROM groups WHERE name != "General"');

    console.log('Creating groups...');
    const groupIds = {};

    for (const group of sampleGroups) {
      const result = await db.run(
        'INSERT INTO groups (name, color) VALUES (?, ?)',
        [group.name, group.color]
      );
      groupIds[group.name] = result.lastID;
      console.log(`  + ${group.name}`);
    }

    console.log('Creating todos...');
    let count = 0;

    for (const todo of sampleTodos) {
      const groupId = groupIds[todo.group];
      await db.run(
        'INSERT INTO todos (title, description, group_id, completed, pinned, hidden) VALUES (?, ?, ?, ?, ?, ?)',
        [
          todo.title,
          todo.description,
          groupId,
          randomBool(0.3) ? 1 : 0,
          randomBool(0.15) ? 1 : 0,
          randomBool(0.1) ? 1 : 0,
        ]
      );
      count++;
    }

    console.log(`\nDone: ${sampleGroups.length} groups, ${count} todos created.`);
  } catch (err) {
    console.error('Seed failed:', err);
  } finally {
    await db.close();
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
