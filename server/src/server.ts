import app from './app';
import config from './config/config';
import './config/db.config';

app.listen(config.port, () => {
  console.log(
    `Server running at ${config.nodeEnv === 'development' ? `http://localhost:${config.port}/` : ''}`,
  );
});
