import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import env from './config/env.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middlewares/errorMiddleware.js';
import { apiLimiter } from './middlewares/rateLimitMiddleware.js';

const app = express();

if (env.NODE_ENV !== 'test') {
    app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}
app.use(express.json());
app.use(cookieParser());

app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));

app.get('/', (req, res) => {
    res.send('API is running...');
});

app.use('/api', apiLimiter, routes);

app.use(notFound);
app.use(errorHandler);

export default app;
