import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { socketService } from './services/socket.service';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import jobRoutes from './routes/job.routes';
import { startExpiryJob } from './jobs/expireJobs';

process.on('unhandledRejection', (reason) => 
  console.error('[UnhandledRejection]', reason));
process.on('uncaughtException', (err) => {
  console.error('[UncaughtException]', err);
  process.exit(1);
});

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

app.use(cors());

// Global JSON parser — MUST skip the Stripe webhook path. Stripe signature
// verification needs the raw body; if express.json() parses it first, the
// route-level express.raw() sees the body as already parsed and skips,
// breaking verification.
const jsonParser = express.json({ limit: '100mb' });
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payments/webhook') return next();
  return jsonParser(req, res, next);
});

// ✅ quick sanity check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: process.env.npm_package_version ?? '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

import adminRoutes from './routes/admin.routes';
import triageRoutes from './routes/triage.routes';
import paymentRoutes from './routes/payment.routes';
import changeOrderRoutes from './routes/changeOrder.routes';
import technicianRoutes from './routes/technician.routes';
import reviewRoutes from './routes/review.routes';

// ... (existing code)

// Review routes must come before /api/technicians — the technician router
// applies authenticate to all its routes, but GET /technicians/:id/reviews is public.
app.use('/api', reviewRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/triage', triageRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/change-orders', changeOrderRoutes);
app.use('/api/technicians', technicianRoutes);

app.get('/', (req, res) => {
  res.send('Fuerza Home Services API is running');
});

socketService.init(io);

// Expire stale REQUESTED jobs every 5 minutes
startExpiryJob();

// ── Global error handler — MUST be after all routes ──────────────────────────
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[GlobalError]', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
