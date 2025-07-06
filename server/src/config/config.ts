import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  mongoUriDev: string;
  mongoUriProd: string;
  supabaseUrl: string;
  supabaseServiceKey: string;
}

const config: Config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUriDev: process.env.MONGO_URI_DEV || '',
  mongoUriProd: process.env.MONGO_URI_PROD || '',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || '',
};

export default config;
