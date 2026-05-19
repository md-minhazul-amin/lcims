require('dotenv').config();

const express = require('express');
const cors = require('cors');

require('./db');

const authRoutes      = require('./routes/auth');
const inventoryRoutes = require('./routes/inventory');
const suppliersRoutes = require('./routes/suppliers');
const reportsRoutes   = require('./routes/reports');
const aiRoutes        = require('./routes/ai');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'LCIMS API running', version: '1.0.0' });
});

app.use('/api/auth',      authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/reports',   reportsRoutes);
app.use('/api/ai',        aiRoutes);

app.use((req, res) => {
    res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});

app.use((err, req, res, _next) => {
    console.error('[error]', err.stack || err.message || err);
    const status = err.status || 500;
    res.status(status).json({
        error: err.message || 'Internal Server Error',
    });
});

const PORT = parseInt(process.env.PORT, 10) || 5000;
app.listen(PORT, () => {
    console.log(`LCIMS Server running on port ${PORT} (http://localhost:${PORT})`);
});

module.exports = app;
