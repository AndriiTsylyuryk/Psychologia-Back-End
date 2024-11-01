import { Router } from 'express';
import { env } from '../utils/env.js';
import { google } from 'googleapis';
import { authenticateUser } from '../middlewares/authUser.js';

const router = Router();

const credentials = env('GOOGLE_CALENDAR_API_KEY');
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

router.post('/event', authenticateUser, async (req, res) => {
  const { start, end, title } = req.body;
  const email = req.user.email;
  const event = {
    summary: title,
    start: { dateTime: start, timeZone: 'Europe/Kyiv' },
    end: { dateTime: end, timeZone: 'Europe/Kyiv' },
    status: 'tentative',
    email,
  };

  try {
    await calendar.events.insert({
      auth,
      calendarId,
      requestBody: event,
      conferenceDataVersion: 1,
      sendNotifications: true,
    });
    res.status(200).send('Event created');
  } catch (error) {
    console.error(error);
    res.status(500).send('Bad request');
  }
});

export default router;
