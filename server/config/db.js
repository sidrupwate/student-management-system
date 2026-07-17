
const { Pool } = require('pg');
require('dotenv').config();
const isProduction = process.env.NODE_ENV === 'production';

const poolConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: isProduction ? { rejectUnauthorized: false } : false,
    }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME || 'student_management',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
    };

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client', err);
});
pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client', err);
});
async function testConnection() {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        client.release();
        console.log('PostgreSQL connected. Server time:', result.rows[0].now);
        return true;
    } catch (err) {
        console.error('Failed to connect to PostgreSQL:', err.message);
        return false;
    }
}

module.exports = { pool, testConnection };