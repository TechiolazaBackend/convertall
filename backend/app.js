import cors from 'cors';
import express from 'express';

import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import convertRoutes from './routes/convertRoutes.js';
import speechRoutes from './routes/speechRoutes.js';
import youtubeRoutes from './routes/youtubeRoutes.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/convert', convertRoutes);
app.use('/api/speech', speechRoutes);
app.use('/api/youtube', youtubeRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
