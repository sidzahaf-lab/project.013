// server.js
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

// Load environment variables FIRST
dotenv.config();

// Then import the database connection
import { sequelize } from './app/models/index.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
try {
  const masterPlanDocRoutes = (await import('./app/routes/masterPlanDocs.js')).default;
  app.use('/api/masterplandocs', masterPlanDocRoutes);
  console.log('Master Plan Docs routes loaded successfully');
} catch (error) {
  console.error('Failed to load routes:', error);
  process.exit(1);
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Server is running!',
    timestamp: new Date().toISOString()
  });
});

// Database test route
app.get('/api/test-db', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ message: 'Database connection successful' });
  } catch (error) {
    res.status(500).json({ 
      error: 'Database connection failed', 
      details: error.message,
      config: {
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT
      }
    });
  }
});

const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    console.log('Attempting to connect to database...');
    console.log('Database config:', {
      database: process.env.DB_NAME,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT
    });
    
    await sequelize.authenticate();
    console.log('Database connection established.');
    
    await sequelize.sync({ force: false });
    console.log('Database synchronized.');

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
      console.log(`DB test: http://localhost:${PORT}/api/test-db`);
    });
  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
};

startServer();