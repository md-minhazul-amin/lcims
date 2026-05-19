require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT, 10),
    database: process.env.DB_NAME,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

pool.connect()
    .then((client) => {
        console.log(
            `Connected to PostgreSQL "${process.env.DB_NAME}" at ` +
            `${process.env.DB_HOST}:${process.env.DB_PORT} as "${process.env.DB_USER}"`
        );
        client.release();
    })
    .catch((err) => {
        console.error(
            'PostgreSQL connection error:',
            err.message || err.code || err
        );
    });

pool.on('error', (err) => {
    console.error('[db] Unexpected error on idle client:', err.message);
});

module.exports = pool;
