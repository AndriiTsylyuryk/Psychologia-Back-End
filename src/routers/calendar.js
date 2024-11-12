import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { readFile } from 'fs/promises';
import path from 'path';
import { env } from '../utils/env.js';
import { google } from 'googleapis';

import jwt from 'jsonwebtoken';
import { sendEmail } from '../utils/sendMail.js';
import { SMTP } from '../constants/index.js';

const router = Router();

// const credentials = env('GOOGLE_CALENDAR_API_KEY');
const calendarId = env('GOOGLE_CALENDAR_ID');
const subjectEmail = env('SUBJECT_EMAIL');

const auth = new google.auth.JWT(
  env('CLIENT_EMAIL'),
  null,
  env('CALENDAR_PRIVATE_KEY').replace(/\\n/g, '\n'),
  ['https://www.googleapis.com/auth/calendar.events'],
  subjectEmail,
);

const calendar = google.calendar({ version: 'v3', auth });

router.post('/event', async (req, res) => {
  const { start, end, title } = req.body;
  const token = req.headers.authorization?.split(' ')[1];
  let email1;

  try {
    const decoded = jwt.verify(token, env('JWT_SECRET'));
    email1 = decoded.email;
  } catch (error) {
    return res.status(401).send('Недійсний токен');
  }
  const event = {
    summary: title,
    start: { dateTime: start, timeZone: 'Europe/Kyiv' },
    end: { dateTime: end, timeZone: 'Europe/Kyiv' },
    status: 'tentative',
    description: email1,
  };

  try {
    await calendar.events.insert({
      auth,
      calendarId,
      requestBody: event,
      conferenceDataVersion: 1,
      sendNotifications: true,
    });
    sendEmail({
      form: env(SMTP.SMTP_FROM),
      to: email1,
      subject: 'Реєстрація на зустріч з Психологом',
      html: 'Вітаю ви успішно зареєструвалися на зустріч',
    });
    res.status(200).send('Подія успішно створена!');
  } catch (error) {
    console.error(
      'Помилка при створенні події:',
      error.response ? error.response.data : error,
    );
    res.status(500).send('Не вдалося створити подію.');
  }
});

export default router;
