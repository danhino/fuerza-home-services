import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { socketService } from './services/socket.service';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import jobRoutes from './routes/job.routes';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

app.use(cors());
app.use(express.json({ limit: '100mb' }));

// ✅ quick sanity check endpoint
app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    port: process.env.PORT,
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
  });
});

import adminRoutes from './routes/admin.routes';
import triageRoutes from './routes/triage.routes';
import paymentRoutes from './routes/payment.routes';

// ... (existing code)

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/triage', triageRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/', (req, res) => {
  res.send('Fuerza Home Services API is running');
});

socketService.init(io);

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
