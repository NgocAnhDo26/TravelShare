import app from './app';
import config from './config/config';
import './config/db.config';
import cron from 'node-cron';
import { updateTrendingScores } from './jobs/trending';
import { safeInitializeSearchIndexes } from './config/searchIndexes';

// Initialize search indexes on startup
safeInitializeSearchIndexes();

// --- Background Job Scheduling ---
// Schedule the trending score update to run every 30 minutes.
// The cron syntax '*/30 * * * *' means:
// *: every minute, second, day of month, month, day of week
// */30: at every 30th unit
cron.schedule('*/30 * * * *', () => {
  console.log('-------------------------------------');
  console.log('Triggering scheduled trending score update...');
  updateTrendingScores();
  console.log('-------------------------------------');
});

app.listen(config.port, () => {
  console.log(`Server running at http://localhost:${config.port}`);
  console.log('Trending score update job scheduled to run every 30 minutes.');
});
