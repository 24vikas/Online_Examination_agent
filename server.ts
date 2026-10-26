import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import helmet from 'helmet';
import { handleApiRequest } from './server/apiRouter.ts';
import { logger } from './server/securityMiddleware.ts';

dotenv.config();

// Process Crash Guardrails: Never swallow fatal uncaught errors; log and exit non-zero so Cloud Run restarts instance
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, '[Fatal Uncaught Exception]: Process terminating');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, '[Fatal Unhandled Rejection]: Process terminating');
  process.exit(1);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.DEFAULT_APP_PORT || process.env.PORT || 3000);

// Security Headers via Helmet (with iframe compatibility for AI Studio preview environment)
app.use(
  helmet({
    contentSecurityPolicy: false, // Permitted for embedded AI Studio preview iframe
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    frameguard: false,
  })
);

// Body parser with explicit limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request ID and audit logging
app.use((req, res, next) => {
  const reqId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  req.requestId = reqId;
  res.setHeader('X-Request-Id', reqId);
  next();
});

// Cloud Run and container readiness/liveness health check probes (strictly unauthenticated)
app.get(['/healthz', '/health', '/api/health'], (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'Online Course Examination System Agent (KLE Tech)',
  });
});

// Environment-driven CORS Allow-List
const configuredOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  const isAllowed =
    !origin ||
    configuredOrigins.length === 0 ||
    configuredOrigins.includes(origin) ||
    origin.includes('run.app') ||
    origin.includes('localhost') ||
    origin.includes('127.0.0.1') ||
    origin.includes('aistudio.google.com');

  if (isAllowed && origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Test-Role, X-Test-Uid');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// API routes handled via apiRouter
app.use(async (req, res, next) => {
  const url = req.url || '';
  if (url.startsWith('/api/')) {
    try {
      const handled = await handleApiRequest(req, res);
      if (handled) return;
    } catch (err: any) {
      logger.error({ err, url }, '[API Router Fatal Handler Error]');
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Internal server error in API router',
          requestId: req.requestId,
        });
      }
      return;
    }
  }
  next();
});

// Serve static frontend assets from dist in production
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

// Fallback for single-page application routing
app.get('*', (req, res) => {
  const indexPath = path.resolve(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath, (err) => {
      if (err && !res.headersSent) {
        res.status(200).send('<!doctype html><html><head><title>Online Course Examination System</title></head><body><div id="root"></div></body></html>');
      }
    });
  } else {
    res.status(200).send('<!doctype html><html><head><title>Online Course Examination System</title></head><body><div id="root"></div></body></html>');
  }
});

// Global Express error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error({ err, path: req.path }, '[Express Global Error]');
  if (!res.headersSent) {
    res.status(500).json({
      error: 'Internal server error',
      requestId: req.requestId,
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server listening on http://0.0.0.0:${PORT}`);
  // Safe background seed after port binding
  import('./server/coeDocumentService.ts').then(({ seedInitialCoeDocuments }) => {
    seedInitialCoeDocuments().catch((err) => logger.warn({ err }, 'Seed initial documents notice'));
  });
});
