require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const { testConnection } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    process.env.CLIENT_URL
].filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'Student Management API is running',
        timestamp: new Date().toISOString(),
    });
});

// --------------------------------------------------------------
// Student routes
// --------------------------------------------------------------
const studentRoutes = require('./routes/studentRoutes');
app.use('/api/students', studentRoutes);

// --------------------------------------------------------------
// 404 handler - runs when no route above matched
// --------------------------------------------------------------
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
});
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);
(async () => {
    const dbConnected = await testConnection();

    if (!dbConnected) {
        console.error(
            'Server not started: could not connect to the database. ' +
            'Check your .env DATABASE_URL / DB_* values and that PostgreSQL is running.'
        );
        process.exit(1);
    }

    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
})();

module.exports = app;