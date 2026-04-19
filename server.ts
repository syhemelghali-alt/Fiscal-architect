import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only_change_this_on_render';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// En réealité, ceci devrait être dans une base de données. 
// Pour l'instant, nous utilisons un objet simple.
const users = [
  { username: 'admin', password: ADMIN_PASSWORD, role: 'admin' },
  { username: 'client1', password: 'password123', role: 'client' },
  { username: 'client2', password: 'password456', role: 'client' },
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // Mock database for documents - Each doc can now have an "owner"
  const documents = [
    { 
      id: 1, 
      owner: 'client1', 
      date: '14 Oct. 2023', 
      time: '14:32', 
      timestamp: 1697286720000, 
      name: 'Orange Business', 
      vendor: 'Orange Business',
      description: 'Facture Téléphonie Fixe Octobre',
      subtitle: 'Facture #FR-2023-991', 
      type: 'Télécom', 
      account: '626', 
      accountStatus: 'auto', 
      amountValue: 142.50, 
      amount: '142,50 €', 
      amountHT: 118.75,
      amountTVA: 23.75,
      amountTTC: 142.50,
      accountNumber: '626000',
      accountingJournal: 'ACH',
      analyticalCode: 'FR-TEL',
      status: 'Validé',
      paymentStatus: 'Payé'
    },
    { 
      id: 2, 
      owner: 'client1', 
      date: '12 Oct. 2023', 
      time: '09:15', 
      timestamp: 1697094900000, 
      name: 'EDF - Siège Social', 
      vendor: 'EDF',
      description: 'Abonnement Électricité Siège',
      subtitle: 'Abonnement Octobre', 
      type: 'Énergie', 
      account: '606', 
      accountStatus: 'suggested', 
      amountValue: 856.22, 
      amount: '856,22 €', 
      amountHT: 713.52,
      amountTVA: 142.70,
      amountTTC: 856.22,
      accountNumber: '606100',
      accountingJournal: 'ACH',
      analyticalCode: 'HQ-ENE',
      status: 'À vérifier',
      paymentStatus: 'À payer'
    },
    { 
      id: 3, 
      owner: 'client2', 
      date: '11 Oct. 2023', 
      time: '17:45', 
      timestamp: 1697039100000, 
      name: 'Client X - Cabinet Conseil', 
      vendor: 'Client X',
      description: 'Audit financier trimestriel',
      subtitle: 'Prestation Audit T3', 
      type: 'Ventes', 
      account: '706', 
      accountStatus: 'auto', 
      amountValue: 4200.00, 
      amount: '4 200,00 €', 
      amountHT: 3500.00,
      amountTVA: 700.00,
      amountTTC: 4200.00,
      accountNumber: '706000',
      accountingJournal: 'VEN',
      analyticalCode: 'SRV-CONS',
      status: 'Validé',
      paymentStatus: 'Payé'
    },
    { 
      id: 4, 
      owner: 'client2', 
      date: '10 Oct. 2023', 
      time: '11:20', 
      timestamp: 1696929600000, 
      name: "L'Atelier des Gourmets", 
      vendor: "L'Atelier des Gourmets",
      description: 'Déjeuner client - Négociation contrat',
      subtitle: "Déjeuner d'affaires", 
      type: 'Frais', 
      account: '625', 
      accountStatus: 'suggested', 
      amountValue: 124.80, 
      amount: '124,80 €', 
      amountHT: 104.00,
      amountTVA: 20.80,
      amountTTC: 124.80,
      accountNumber: '625700',
      accountingJournal: 'ACH',
      analyticalCode: 'MKG-REST',
      status: 'À vérifier',
      paymentStatus: 'À payer'
    }
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
    
    console.log(`Tentative de connexion : ${username}`);

    const isProduction = process.env.NODE_ENV === 'production';

    // Pour l'admin, on vérifie soit la variable d'env, soit le défaut 'admin123'
    if (username && username.toLowerCase() === 'admin') {
      if (password === ADMIN_PASSWORD || password === 'admin123') {
        const token = jwt.sign({ username: 'admin', role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
        res.cookie('token', token, { 
          httpOnly: true, 
          secure: isProduction, 
          sameSite: 'lax' 
        });
        console.log('Connexion Admin réussie');
        return res.json({ role: 'admin', username: 'admin' });
      }
    }

    // Recherche pour les autres clients (insensible à la casse pour le username)
    const user = users.find(u => u.username.toLowerCase() === (username || '').toLowerCase());

    if (user && password === user.password) {
      const token = jwt.sign({ username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
      res.cookie('token', token, { 
        httpOnly: true, 
        secure: isProduction,
        sameSite: 'lax' 
      });
      console.log(`Connexion Client réussie : ${user.username}`);
      return res.json({ role: user.role, username: user.username });
    }

    console.log('Échec de connexion : identifiants invalides');
    res.status(401).json({ error: 'Identifiants ou Mot de Passe incorrect' });
  });

  app.post('/api/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true });
  });

  app.get('/api/me', authenticateToken, (req: any, res) => {
    res.json({ username: req.user.username, role: req.user.role });
  });

  app.get('/api/documents', authenticateToken, (req: any, res) => {
    if (req.user.role === 'admin') {
      // L'admin voit tout
      res.json(documents);
    } else {
      // Le client ne voit que ses propres documents
      const clientDocs = documents.filter(doc => doc.owner === req.user.username);
      res.json(clientDocs);
    }
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
