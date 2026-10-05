import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { openApiDocument } from './openapi.js';

export const docsRouter = Router();

docsRouter.get('/openapi.json', (_req, res) => {
  res.json(openApiDocument);
});
docsRouter.use(
  '/',
  swaggerUi.serve,
  swaggerUi.setup(openApiDocument, { customSiteTitle: 'UkRide API docs' }),
);
