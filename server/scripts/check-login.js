require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

async function main() {
    console.log('DB_HOST:', process.env.DB_HOST || '(missing)');
    console.log('DB_NAME:', process.env.DB_NAME || '(missing)');
    console.log('DB_USER:', process.env.DB_USER || '(missing)');
    console.log('DB_PASSWORD set:', Boolean(process.env.DB_PASSWORD && process.env.DB_PASSWORD !== 'your_password_here'));
    console.log('JWT_SECRET set:', Boolean(process.env.JWT_SECRET));

    try {
        const result = await pool.query(
            `SELECT email, password_hash FROM users WHERE email = $1`,
            ['manager@dailygrind.com']
        );
        if (result.rowCount === 0) {
            console.log('USER: manager@dailygrind.com NOT FOUND — re-run database/lcims_schema.sql');
            return;
        }
        const hash = result.rows[0].password_hash;
        const ok = await bcrypt.compare('password123', hash);
        console.log('USER: found');
        console.log('password123 matches DB hash:', ok);
        if (!ok) {
            console.log('FIX: run database/fix_passwords.sql or re-apply lcims_schema.sql');
        }
    } catch (err) {
        console.log('DB ERROR:', err.message);
    } finally {
        await pool.end();
    }
}

main();
