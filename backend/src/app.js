/**
 * @fileoverview Express app setup - middleware, routes, error handlers.
 * Tách riêng khỏi server.js để dễ test và tái sử dụng.
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const giaoVienRoutes = require('./routes/giaoVien.routes');
const sinhVienRoutes = require('./routes/sinhVien.routes');
const publicRoutes = require('./routes/public.routes');
const hoSoRoutes = require('./routes/hoSo.routes');
const { notFoundHandler, globalErrorHandler } = require('./middleware/errorHandler');

const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);

// ─── BODY PARSING ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── STATIC FILES ─────────────────────────────────────────────────────────────
app.use('/uploads', express.static('uploads'));

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Server đang hoạt động', timestamp: new Date().toISOString() });
});

// ─── ROUTES ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/ho-so', hoSoRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/giao-vien', giaoVienRoutes);
app.use('/api/sinh-vien', sinhVienRoutes);
app.use('/api/public', publicRoutes);

// ─── ERROR HANDLING ───────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(globalErrorHandler);

module.exports = app;
