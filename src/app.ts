import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorMiddleware } from './middlewares/error';
import mouvementsRoutes from './features/mouvements/routes';

const app = express();

app.use(helmet());
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: { code: 429, message: "Trop de requêtes émanant de cette IP." }
});
app.use(limiter);

// ------------------------------------------------------------
// ENREGISTREMENT DES ROUTES CI-DESSOUS
app.use('/api/v1/mouvements', mouvementsRoutes);

// ------------------------------------------------------------

app.use(errorMiddleware);

export default app;