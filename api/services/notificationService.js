/* eslint-disable indent */
const admin = require('firebase-admin');
const cron = require('node-cron');
const { GoogleGenAI } = require('@google/genai');

// Initialize Firebase Admin with service account
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Initialize AI client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const model = 'gemini-2.0-flash';

// Environment-driven notification language (e.g., 'en', 'ar')
const notificationLanguage = process.env.NOTIFICATION_LANGUAGE || 'en';

// Generate notification content using AI
async function generateNotification(type, date) {
  const prompt = `Generate an engaging notification in Islamic context: ${type} reminder for date ${date}. Respond in JSON format with "title" and "body" in ${notificationLanguage}.`;
  const config = {
    responseMimeType: 'application/json',
    systemInstruction: [
      {
        text: `You are a helpful Islamic assistant generating notification content in ${notificationLanguage} and strictly within Islamic context. Output only valid JSON with keys "title" and "body".`
      }
    ]
  };
  const contents = [{ role: 'user', parts: [{ text: prompt }] }];

  const response = await ai.models.generateContent({ model, config, contents });
  // normalize content to string
  const rawContent = response.candidates?.[0].content;
  const text =
    typeof rawContent === 'string'
      ? rawContent.trim()
      : rawContent?.text
      ? rawContent.text.trim()
      : JSON.stringify(rawContent).trim();
  try {
    return JSON.parse(text);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to parse AI response:', text, err);
    throw err;
  }
}

// Determine if a given date is a fasting day using AI
async function isFastingDay(date) {
  const prompt = `For the date ${date} in Islamic context, respond in JSON with {"fasting": true} if it is an obligatory or recommended fasting day (e.g., Ramadan, Muharram, Arafah, etc.), otherwise {"fasting": false}. Output only valid JSON.`;
  const config = {
    responseMimeType: 'application/json',
    systemInstruction: [
      {
        text: 'You are an Islamic calendar assistant outputting only valid JSON with a boolean "fasting" field.'
      }
    ]
  };
  const contents = [{ role: 'user', parts: [{ text: prompt }] }];

  const response = await ai.models.generateContent({ model, config, contents });
  // normalize content to string
  const rawContent = response.candidates?.[0].content;
  const text =
    typeof rawContent === 'string'
      ? rawContent.trim()
      : rawContent?.text
      ? rawContent.text.trim()
      : JSON.stringify(rawContent).trim();
  try {
    return JSON.parse(text);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to parse fasting-day AI response:', text, err);
    throw err;
  }
}

// Send notification via Firebase Cloud Messaging
async function sendNotification(notification) {
  const message = {
    notification: {
      title: notification.title,
      body: notification.body
    },
    topic: notification.topic
  };
  await admin.messaging().send(message);
}

// Schedule tasks
async function scheduleGeneralNotifications() {
  const date = new Date().toLocaleDateString('en-GB');
  const content = await generateNotification(
    'daily general muslim reminder',
    date
  );
  content.topic = 'daily-general';
  await sendNotification(content);
}

async function scheduleFastingNotifications() {
  const tomorrow = new Date(Date.now() + 86400000).toLocaleDateString('en-GB');
  // check if fasting is recommended/obligatory tomorrow
  const { fasting } = await isFastingDay(tomorrow);
  if (!fasting) {
    return; // no fasting tomorrow, skip notification
  }
  const content = await generateNotification('fasting', tomorrow);
  content.topic = 'fasting-reminder';
  await sendNotification(content);
}

// Start cron jobs
function start() {
  // Every day at 08:00 server time
  cron.schedule('0 8 * * *', () => {
    scheduleGeneralNotifications().catch((err) => {
      // eslint-disable-next-line no-console
      console.error(err);
    });
  });
  // Every day at 20:00 server time
  cron.schedule('0 20 * * *', () => {
    scheduleFastingNotifications().catch((err) => {
      // eslint-disable-next-line no-console
      console.error(err);
    });
  });
}

module.exports = { start };
