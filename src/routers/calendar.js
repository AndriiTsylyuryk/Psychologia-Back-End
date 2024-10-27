import { Router } from "express";
import { OAuth2Client } from 'google-auth-library';
import { readFile } from 'fs/promises';
import path from "path";
import { env } from "../utils/env.js";
import { google } from "googleapis";



const router = Router();

const credentials = env('GOOGLE_CALENDAR_API_KEY');
const calendarId = env("GOOGLE_CALENDAR_ID");
const subjectEmail = env('SUBJECT_EMAIL');

const auth = new google.auth.JWT(
    env('CLIENT_EMAIL'),
    null,
    env('CALENDAR_PRIVATE_KEY'),
    ["https://www.googleapis.com/auth/calendar.events"],
    subjectEmail,
  );

  
const calendar = google.calendar({ version: "v3", auth });

router.post("/event", async (req, res) => {
   const {start, end, title} = req.body;
   const event = {
    summary: title,
    start: { dateTime: start, timeZone: "Europe/Kyiv" },
    end: { dateTime: end, timeZone: "Europe/Kyiv" },
    status: "tentative", 
  };

  try {
     await calendar.events.insert({
        auth,
        calendarId,
        requestBody: event,
        conferenceDataVersion: 1, 
        sendNotifications: true,
    });
    res.status(200).send("Подія успішно створена!");
  } catch (error) {
    console.error("Помилка при створенні події:", error);
    res.status(500).send("Не вдалося створити подію.");
  }
});

export default router;