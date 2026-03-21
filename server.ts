import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './api/auth';
import userRoutes from './api/users';
import walletRoutes from './api/wallet';
import scoutRoutes from './api/scouts';
import marketRoutes from './api/market';
import orderRoutes from './api/orders';
import deliveryRoutes from './api/delivery';
import trackingRoutes from './api/tracking';
import donationRoutes from './api/donations';
import adminRoutes from './api/admin';
import notificationRoutes from './api/notifications';
import ratingRoutes from './api/ratings';

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
    }
  });

  const PORT = 3000;

  // Middleware
  app.use(cors());
  app.use(express.json());

  // API Routes
  const apiRouter = express.Router();
  
  apiRouter.use('/auth', authRoutes);
  apiRouter.use('/users', userRoutes);
  apiRouter.use('/wallet', walletRoutes);
  apiRouter.use('/scouts', scoutRoutes);
  apiRouter.use('/market', marketRoutes);
  apiRouter.use('/orders', orderRoutes);
  apiRouter.use('/delivery', deliveryRoutes);
  apiRouter.use('/tracking', trackingRoutes);
  apiRouter.use('/donations', donationRoutes);
  apiRouter.use('/admin', adminRoutes);
  apiRouter.use('/notifications', notificationRoutes);
  apiRouter.use('/ratings', ratingRoutes);

  app.use('/api/v1', apiRouter);

  // WebSocket Logic
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join_delivery', (deliveryId) => {
      socket.join(`delivery_${deliveryId}`);
      console.log(`User joined delivery room: delivery_${deliveryId}`);
    });

    socket.on('update_location', (data) => {
      const { deliveryId, location } = data;
      io.to(`delivery_${deliveryId}`).emit('rider_location_update', { deliveryId, location });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  // Make io accessible in routes
  app.set('io', io);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Zemen Digital City API running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
