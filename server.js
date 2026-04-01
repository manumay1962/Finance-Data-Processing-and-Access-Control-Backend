require('dotenv').config();

const app = require('./src/app');
const { initializeDatabase } = require('./src/config/database');

const PORT = process.env.PORT || 3000;

// Initialize database schema
initializeDatabase();

// Start server
app.listen(PORT, () => {
  console.log(` Finance Dashboard API running on http://localhost:${PORT}`);
  console.log(` Health check: http://localhost:${PORT}/api/health`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
});
