import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  mongoUriDev: string;
  mongoUriProd: string;
}

const config: Config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUriDev: process.env.MONGO_URI_DEV || '',
  mongoUriProd: process.env.MONGO_URI_PROD || '',
};

export default config;
