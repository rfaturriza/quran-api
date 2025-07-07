const { Router } = require('express');

const { caching, verifyNotificationSecret } = require('./middlewares');
const SurahHandler = require('./handlers/surah');
const JuzHandler = require('./handlers/juz');
const PageHandler = require('./handlers/page');
const GenAiHandler = require('./handlers/gen_ai');
const NotificationHandler = require('./handlers/notification');

const router = Router();

router.use((req, res, next) => {
  res.setHeader(
    'Cache-Control',
    'public, max-age=0, s-maxage=86400, stale-while-revalidate'
  );
  next();
});

router.get('/', (req, res) =>
  res.status(200).send({
    surah: {
      listSurah: '/surah',
      spesificSurah: {
        pattern: '/surah/{surah}',
        example: '/surah/18'
      },
      spesificAyahInSurah: {
        pattern: '/surah/{surah}/{ayah}',
        example: '/surah/18/60'
      },
      spesificJuz: {
        pattern: '/juz/{juz}',
        example: '/juz/30'
      },
      spesificPage: {
        pattern: '/page/{page}',
        example: '/page/1',
        description:
          'Get all verses of a specific Madani Mushaf page(1 to 604).'
      }
    },
    maintaner:
      'Sutan Gading Fadhillah Nasution <contact@gading.dev>, Rizky Faturriza <rfaturriza.dev@gmail.com>',
    source: 'https://github.com/gadingnst/quran-api'
  })
);

router.get('/surah', caching, SurahHandler.getAllSurah);
router.get('/surah/:surah', caching, SurahHandler.getSurah);
router.get('/surah/:surah/:ayah', caching, SurahHandler.getAyahFromSurah);
router.get('/juz/:juz', caching, JuzHandler.getJuz);
router.get('/page/:page', caching, PageHandler.getPage);
router.get('/ask-ustadz-ai', GenAiHandler.getResponse);

// Trigger general notification (for Vercel cron)
router.get(
  '/notification/general',
  verifyNotificationSecret,
  NotificationHandler.general
);

// Trigger fasting notification (for Vercel cron)
router.get(
  '/notification/fasting',
  verifyNotificationSecret,
  NotificationHandler.fasting
);

// fallback router
router.all('*', (req, res) =>
  res.status(404).send({
    code: 404,
    status: 'Not Found.',
    message: `Resource "${req.url}" is not found.`
  })
);

module.exports = router;
