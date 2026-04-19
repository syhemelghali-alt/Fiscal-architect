import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const CLIENT_PASSWORD = 'client_password_123'; // In a real app, store these in a DB

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // Mock database for documents
  const documents = [
    { id: 1, date: '14 Oct. 2023', time: '14:32', timestamp: 1697286720000, name: 'Orange Business', subtitle: 'Facture #FR-2023-991', type: 'Télécom', account: '626', accountStatus: 'auto', amountValue: 142.50, amount: '142,50 €', status: 'Validé' },
    { id: 2, date: '12 Oct. 2023', time: '09:15', timestamp: 1697094900000, name: 'EDF - Siège Social', subtitle: 'Abonnement Octobre', type: 'Énergie', account: '606', accountStatus: 'suggested', amountValue: 856.22, amount: '856,22 €', status: 'À vérifier' },
    { id: 3, date: '11 Oct. 2023', time: '17:45', timestamp: 1697039100000, name: 'Client X - Cabinet Conseil', subtitle: 'Prestation Audit T3', type: 'Ventes', account: '706', accountStatus: 'auto', amountValue: 4200.00, amount: '4 200,00 €', status: 'Validé' },
    { id: 4, date: '10 Oct. 2023', time: '11:20', timestamp: 1696929600000, name: "L'Atelier des Gourmets", subtitle: "Déjeuner d'affaires", type: 'Frais', account: '625', accountStatus: 'suggested', amountValue: 124.80, amount: '124,80 €', status: 'À vérifier' }
  ];

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Non authentifié' });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: 'Session expirée' });
      req.user = user;
      next();
    });
  };

  // API Routes
  app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (username === 'admin' && (password === ADMIN_PASSWORD || password === 'admin123')) {
      const token = jwt.sign({ username: 'admin', role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
      res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'strict' });
      return res.json({ role: 'admin' });
    } else if (username === 'client' && (password === CLIENT_PASSWORD || password === 'client123')) {
      const token = jwt.sign({ username: 'client', role: 'client' }, JWT_SECRET, { expiresIn: '8h' });
      res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'strict' });
      return res.json({ role: 'client' });
    }

    res.status(401).json({ error: 'Identifiants invalides' });
  });

  app.post('/api/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true });
  });

  app.get('/api/me', authenticateToken, (req: any, res) => {
    res.json({ username: req.user.username, role: req.user.role });
  });

  app.get('/api/documents', authenticateToken, (req, res) => {
    res.json(documents);
  });

  // Vite preview setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server started on http://0.0.0.0:${PORT}`);
  });
}

startServer();
