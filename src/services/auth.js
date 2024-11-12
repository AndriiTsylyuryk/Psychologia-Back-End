import createHttpError from 'http-errors';
import { UsersCollection } from '../db/models/user.js';
import bcrypt from 'bcrypt';
import { SessionsCollection } from '../db/models/session.js';
import { randomBytes } from 'crypto';
import { FIFTEEN_MINUTES, ONE_DAY, SMTP } from '../constants/index.js';
import { env } from '../utils/env.js';
import { sendEmail } from '../utils/sendMail.js';
import jwt from 'jsonwebtoken';
import {
  getFullNameFromGoogleTokenPayload,
  validateCode,
} from '../utils/googleOAuth2.js';

export const registerUser = async (payload) => {
  const user = await UsersCollection.findOne({ email: payload.email });

  if (user) throw createHttpError(409, 'Email in use');

  const encryptedPassword = await bcrypt.hash(payload.password, 10);

  const newUser = await UsersCollection.create({
    ...payload,
    password: encryptedPassword,
  });

  const accessToken = jwt.sign(
    { userId: newUser._id, email: newUser.email },
    env('JWT_SECRET'),
    { expiresIn: '15m' },
  );

  const refreshToken = jwt.sign(
    { userId: newUser._id, email: newUser.email },
    env('JWT_SECRET'),
    { expiresIn: '1d' },
  );

  await SessionsCollection.create({
    userId: newUser._id,
    email: newUser.email,
    accessToken,
    refreshToken,
    accessTokenValidUntil: new Date(Date.now() + FIFTEEN_MINUTES),
    refreshTokenValidUntil: new Date(Date.now() + ONE_DAY),
  });

  return {
    accessToken,
    refreshToken,
  };
};

export const loginUser = async (payload) => {
  const user = await UsersCollection.findOne({ email: payload.email });

  if (!user) throw createHttpError(404, 'User not found');

  const isEqual = await bcrypt.compare(payload.password, user.password);
  if (!isEqual) throw createHttpError(401, 'Wrong password');

  await SessionsCollection.deleteOne({ userId: user._id });

  const accessToken = jwt.sign(
    { userId: user._id, email: user.email },
    env('JWT_SECRET'),
    { expiresIn: '15m' },
  );
  const refreshToken = jwt.sign(
    { userId: user._id, email: user.email },
    env('JWT_SECRET'),
    { expiresIn: '1d' },
  );

  return await SessionsCollection.create({
    userId: user._id,
    email: user.email,
    accessToken,
    refreshToken,
    accessTokenValidUntil: new Date(Date.now() + FIFTEEN_MINUTES),
    refreshTokenValidUntil: new Date(Date.now() + ONE_DAY),
  });
};

export const logoutUser = async (sessionId) => {
  await SessionsCollection.deleteOne({ _id: sessionId });
};

const createTokens = (user) => {
  const accessToken = jwt.sign(
    { userId: user._id, email: user.email },
    env('JWT_SECRET'),
    { expiresIn: '15m' },
  );
  const refreshToken = jwt.sign(
    { userId: user._id, email: user.email },
    env('JWT_SECRET'),
    { expiresIn: '1d' },
  );
  return { accessToken, refreshToken };
};

const createSession = (user) => ({
  ...createTokens(user),
  
  accessTokenValidUntil: new Date(Date.now() + FIFTEEN_MINUTES),
  refreshTokenValidUntil: new Date(Date.now() + ONE_DAY),
});

export const refreshUsersSession = async ({ refreshToken, sessionId }) => {
  try {
    const decoded = jwt.verify(refreshToken, env('JWT_SECRET'));
    const user = await UsersCollection.findById(decoded.userId);

    if (!user) {
      throw createHttpError(404, 'User not found');
    }
    const { accessToken, refreshToken: newRefreshToken } = createTokens(user);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      sessionId,
    };
  } catch (error) {
    throw createHttpError(401, 'Invalid refresh token');
  }
};

export const requestResetToken = async (email) => {
  const user = await UsersCollection.findOne({ email });
  if (!user) {
    throw createHttpError(404, 'User not found');
  }

  const resetToken = jwt.sign(
    {
      sub: user._id,
      email,
    },
    env('JWT_SECRET'),
    {
      expiresIn: '15m',
    },
  );

  await sendEmail({
    from: env(SMTP.SMTP_FROM),
    to: email,
    subject: 'Скид паролю',
    html: `<p>Натисніть <a href="${resetToken}">сюди</a> щоб скинути пароль!</p>`,
  });
};

export const resetPassword = async (payload) => {
  let entries;

  try {
    entries = jwt.verify(payload.token, env('JWT_SECRET'));
  } catch (err) {
    if (err instanceof Error) throw createHttpError(401, err.message);
    throw err;
  }

  const user = await UsersCollection.findOne({
    email: entries.email,
    _id: entries.sub,
  });

  if (!user) {
    throw createHttpError(404, 'User not found');
  }

  const encryptedPassword = await bcrypt.hash(payload.password, 10);

  await UsersCollection.updateOne(
    { _id: user._id },
    { password: encryptedPassword },
  );
};

export const loginOrSignupWithGoogle = async (code) => {
  const loginTicket = await validateCode(code);
  const payload = loginTicket.getPayload();

  if (!payload) throw createHttpError(401);

  let user = await UsersCollection.findOne({ email: payload.email });

  if (!user) {
    const password = await bcrypt.hash(randomBytes(10), 10);
    user = await UsersCollection.create({
      email: payload.email,
      name: getFullNameFromGoogleTokenPayload(payload),
      password,
    });
  }
  await SessionsCollection.deleteOne({ userId: user._id });

  const newSession = createSession(user);

  return await SessionsCollection.create({
    userId: user._id,
    email: user.email,
    ...newSession,
  });
};
