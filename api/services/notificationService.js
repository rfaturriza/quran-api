/* eslint-disable indent */
const admin = require('firebase-admin');
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
  let prompt = `Generate an engaging push notification in Islamic context: ${type} you can use any of motivational quotes or mahfuzhat. don't use quotes from Quran or Hadith.`;
  if (type === 'fasting') {
    prompt = `Generate a fasting reminder notification for the date ${date} in Islamic context, mention also the name of fasting in notification.`;
  }
  const config = {
    responseMimeType: 'application/json',
    systemInstruction: [
      {
        text: `You are a helpful Islamic assistant generating notification content in ${notificationLanguage} and strictly within Islamic context. Output only valid JSON with keys "title" and "body" in single object not array.`
      }
    ]
  };
  const contents = [{ role: 'user', parts: [{ text: prompt }] }];

  const response = await ai.models.generateContent({ model, config, contents });
  // normalize content to string
  const rawContent =
    response.candidates?.[0].content.parts?.[0]?.text ||
    response.candidates?.[0].content ||
    response.candidates?.[0].content.text;
  if (!rawContent) {
    throw new Error('AI response is empty or invalid');
  }
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
  const prompt = `${date} in Islamic context,
  according to Islamic calendar and these type of fasting:
  - Obligatory fasting (e.g., Ramadan)
  - Sunnah fasting (e.g., Mondays, Thursdays, 13th, 14th, 15th of lunar month)
  - Fasting of Arafah:** Performed on the 9th of Dhu al-Hijjah, highly recommended for those who are not performing the Hajj pilgrimage.
  - Fasting of Ayyamul Bidh (The White Days):** Performed on the 13th, 14th, and 15th of each Hijri month.
  - Fasting of Ashura:** Performed on the 10th of Muharram.
  - Six-Day Fast in the Month of Shawwal:** Performed after the Ramadan fast, starting from the 2nd of Shawwal until the end of the month.
  - Fasting in Dhu al-Hijjah:** Fasting during the month of Dhu al-Hijjah, other than the Fast of Arafah.
  - Monday and Thursday Fasting:** A fast performed every Monday and Thursday.
  - Fast of David (Dawud):** A pattern of fasting one day and breaking the fast the next.
  - Fasting of Tasu'a:** A fast performed on the 9th of Muharram, the day before Ashura.
  - Sunnah Fasting in the Month of Sha'ban:** Fasting performed during the month of Sha'ban, the month before Ramadan.
  - Qadha Fasting (Make-up Fast):** A fast performed to replace a missed obligatory fast due to a legitimate reason, such as illness or menstruation.
  - Fasting of Tarwiyah:** A fast performed on the 8th of Dhu al-Hijjah, the day before Arafah.

  is this day have any fasting recommendation or obligation?
  If yes, respond with {
    "fasting": true,
    "type": "Obligatory" or "Sunnah" or "Arafah" or "Ayyamul Bidh" or "Asyura" or "Syawal" or "Dzulhijjah" or "Senin Kamis" or "Daud" or "Tasu'a" or "Sunnah Bulan Syaban" or "Qadha" or "Tarwiyah".
  },
  otherwise {
    "fasting": false,
  }.
  Output only valid JSON.`;
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
  const rawContent =
    response.candidates?.[0].content.parts?.[0]?.text ||
    response.candidates?.[0].content ||
    response.candidates?.[0].content.text;
  if (!rawContent) {
    throw new Error('AI response is empty or invalid');
  }
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
  try {
    await admin.messaging().send(message);
    // eslint-disable-next-line no-console
    console.log('Notification sent successfully:', notification);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error sending notification:', error);
    throw error;
  }
}

// Notification functions
async function scheduleGeneralNotifications() {
  const date = new Date().toLocaleDateString('in-ID'); // Get today's date in 'dd/mm/yyyy' format
  const content = await generateNotification(
    'daily general muslim reminder',
    date
  );
  content.topic = 'daily-general';
  await sendNotification(content).catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Failed to send notification:', err);
  });
}

async function scheduleFastingNotifications() {
  // format "Thursday, 26 October 2023"
  const tomorrow = new Date(Date.now() + 86400000).toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  // eslint-disable-next-line no-console
  console.log('Checking fasting for tomorrow:', tomorrow);
  // check if fasting is recommended/obligatory tomorrow
  const { fasting } = await isFastingDay(tomorrow);
  if (!fasting) {
    // eslint-disable-next-line no-console
    console.log('No fasting tomorrow, skipping notification');
    return; // no fasting tomorrow, skip notification
  }
  const content = await generateNotification('fasting', tomorrow);
  content.topic = 'fasting-reminder';
  await sendNotification(content).catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Failed to send notification:', err);
  });
}

// Export functions for manual triggering
module.exports = {
  sendNotification,
  scheduleGeneralNotifications,
  scheduleFastingNotifications
};
