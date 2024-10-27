import { Router } from "express";
import { OAuth2Client } from 'google-auth-library';
import { readFile } from 'fs/promises';
import path from "path";
import { env } from "../utils/env.js";
const { google } = require("googleapis"); 



const router = Router();

const PATH_JSON = path.join(process.cwd(), 'google-oauth.json');
const oauthConfig = JSON.parse(await readFile(PATH_JSON));

const googleOAuthClient = new OAuth2Client({
    clientId: env('GOOGLE_AUTH_CLIENT_ID'),
    clientSecret: env('GOOGLE_AUTH_CLIENT_SECRET'),
    redirectUri: oauthConfig.web.redirect_uris[0],
  });


const calendar = google.calendar({ version: "v3", auth: googleOAuthClient });

router.post("/event", async (req, res) => {
   const {start, end, title} = req.body;
   const event = {
    summary: title,
    start: { dateTime: start, timeZone: "Europe/Kyiv" },
    end: { dateTime: end, timeZone: "Europe/Kyiv" },
    status: "tentative", 
  };
  try {
     calendar.events.insert({
      calendarId: "navigator.tsylyuryk@gmail.com", 
      resource: event,
    });
    res.status(200).send("Подія успішно створена!");
  } catch (error) {
    console.error("Помилка при створенні події:", error);
    res.status(500).send("Не вдалося створити подію.");
  }
});

export default router;