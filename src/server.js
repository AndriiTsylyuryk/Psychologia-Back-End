import express from 'express';
import pino from 'pino-http';
import cors from 'cors';
import dotenv from 'dotenv';
import { env } from './utils/env.js';
import router from './routers/index.js';
import { notFoundHandler } from './middlewares/notFoundHandler.js';
import { errorHandler } from './middlewares/errorHandler.js';
import cookieParser from 'cookie-parser';
import session from 'express-session';



dotenv.config();

const PORT = Number(env('PORT', '3000'));

export const startServer = () => {
  const app = express();

  app.use(express.json());

  app.use(
    cors({ origin: 'https://psychologia-eight.vercel.app', credentials: true }),
  );

  app.use(cookieParser());

  app.use(
    pino({
      transport: {
        target: 'pino-pretty',
      },
    }),
  );

  app.get('/', async (req, res) => {
    if (req.cookies.sessionId && req.cookies.refreshToken) {
      const session = await refreshUsersSession({
        sessionId: req.cookies.sessionId,
        refreshToken: req.cookies.refreshToken,
      });
      setupSession(res, session);
      return res.json({
        status: 200,
        message: 'Successfully refreshed a session!',
        data: {
          accessToken: session.accessToken,
        },
      });
    }

    res.json({
      message: 'Hello world!',
    });
  });

  app.use(router);

  app.use('*', notFoundHandler);

  app.use(errorHandler);

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};
