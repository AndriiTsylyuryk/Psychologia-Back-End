import express from 'express';
import pino from 'pino-http';
import cors from 'cors';
import dotenv from 'dotenv';
import { env } from './utils/env.js';
import router from './routers/index.js';
import { notFoundHandler } from './middlewares/notFoundHandler.js';
import { errorHandler } from './middlewares/errorHandler.js';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';

dotenv.config();

const PORT = Number(env('PORT', '3000'));

export const startServer = () => {
  const app = express();

  app.use(express.json());

  app.use(cors());

  app.use(cookieParser());

  app.use(
    pino({
      transport: {
        target: 'pino-pretty',
      },
    }),
  );

  app.get('/', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1]; // Отримуємо токен з заголовка

    if (token) {
      try {
        const decoded = jwt.verify(token, env('JWT_SECRET')); // Верифікуємо токен
        const userEmail = decoded.email; // Отримуємо емейл з декодованого токена

        res.json({
          message: 'Hello world!',
          email: userEmail, // Повертаємо емейл користувача
        });
      } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
      }
    } else {
      res.status(401).json({ message: 'No token provided' });
    }
  });

  app.use(router);

  app.use('*', notFoundHandler);

  app.use(errorHandler);

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};
