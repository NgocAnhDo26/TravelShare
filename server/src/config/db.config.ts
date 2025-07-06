import mongoose from 'mongoose';
import config from './config';

const mongoUri =
  config.nodeEnv === 'development' ? config.mongoUriDev : config.mongoUriProd;

if (!mongoUri) {
  throw new Error('MONGO_URI environment variable is not defined');
}

mongoose.connect(mongoUri);
