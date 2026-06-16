import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';
import swaggerUi from 'swagger-ui-express';

import { errorMiddleware } from './middlewares/error';

// Import des routers (injection de dépendances gérée dans chaque routes.ts)
import authRoutes          from './features/auth/routes';
import utilisateursRoutes  from './features/utilisateurs/routes';
import comptesRoutes       from './features/comptes/routes';
import mouvementsRoutes    from './features/mouvements/routes';
import virementsRoutes     from './features/virements/routes';
import categoriesRoutes    from './features/categories/routes';
import sousCategoriesRoutes from './features/sous-categories/routes';
import tiersRoutes         from './features/tiers/routes';

const app = express();

// Sécurité
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", 'data:'],
            },
        },
    })
);

app.use(
    cors({
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

app.use(express.json());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: { code: 429, message: 'Trop de requêtes émanant de cette IP.' },
});
app.use(limiter);

// Swagger UI accessible sur http://localhost:3000/docs
const swaggerDocument = yaml.load(
    fs.readFileSync(path.join(__dirname, '..', 'fichier_swagger.yaml'), 'utf8')
) as object;

app.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, {
        customSiteTitle: 'MoneyMakers API Docs',
    })
);

app.get('/api/v1', (_req, res) => {
    res.status(200).json({
        name: 'MoneyMakers API',
        version: '1.0.0',
        status: 'ok',
        docs: '/docs',
    });
});

// Montage des routes métier
app.use('/api/v1/auth',            authRoutes);
app.use('/api/v1/utilisateurs',    utilisateursRoutes);
app.use('/api/v1/comptes',         comptesRoutes);
app.use('/api/v1/mouvements',      mouvementsRoutes);
app.use('/api/v1/virements',       virementsRoutes);
app.use('/api/v1/categories',      categoriesRoutes);
app.use('/api/v1/sous-categories', sousCategoriesRoutes);
app.use('/api/v1/tiers',           tiersRoutes);

// Middleware global de gestion des erreurs
app.use(errorMiddleware);

export default app;