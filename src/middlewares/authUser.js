import jwt from 'jsonwebtoken';
import { env } from '../utils/env';

// Приклад секретного ключа, який використовується для підпису токенів
const JWT_SECRET = env('JWT_SECRET'); // Зберігайте секрет у змінних середовища

export const authenticateUser = (req, res, next) => {
  // Отримання токена з заголовків або cookie
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Auth required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ message: 'Wrong token' });
  }
};
