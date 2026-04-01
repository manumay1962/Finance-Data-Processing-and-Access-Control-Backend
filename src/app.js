const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const recordRoutes = require('./routes/record.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

const app = express();
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/swagger.json');

// Security Middleware 
app.use(helmet());
app.use(cors());

//  Rate Limiting 
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 200,                 
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
});
app.use(limiter);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));


app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Finance Dashboard API is running.',
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the Finance Dashboard API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      auth: 'POST /api/auth/login, POST /api/auth/register, GET /api/auth/me',
      users: 'GET /api/users (admin only)',
      records: 'GET /api/records, POST /api/records',
      dashboard: 'GET /api/dashboard/summary, GET /api/dashboard/trends',
    },
    docs: 'See README.md for full API documentation',
  });
});


app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/dashboard', dashboardRoutes);


app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});


app.use(errorHandler);

module.exports = app;
