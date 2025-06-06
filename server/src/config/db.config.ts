import mongoose from 'mongoose';
import config from './config';

if (!config.mongoUri) {
  throw new Error('MONGO_URI environment variable is not defined');
}

mongoose.connect(config.mongoUri);
