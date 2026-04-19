/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Bell, 
  UploadCloud, 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Zap, 
  User, 
  Utensils, 
  FileEdit, 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  AlertTriangle,
  LayoutDashboard,
  GanttChart,
  Share,
  CheckCircle2,
  HelpCircle,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Lock,
  LogOut,
  ShieldCheck,
  UserCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type UserRole = 'admin' | 'client' | null;

interface Document {
  id: number;
  date: string;
  time: string;
  timestamp: number;
  name: string;
  subtitle: string;
  type: string;
  account: string;
  accountStatus: string;
  amountValue: number;
  amount: string;
  status: string;
}

const docIcons = {
  Télécom: FileText,
  Énergie: Zap,
  Ventes: User,
  Frais: Utensils,
};

export default function App() {
  const [role, setRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Document; direction: 'asc' | 'desc' }>({ key: 'timestamp', direction: 'desc' });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/me');
      if (res.ok) {
        const data = await res.json();
        setRole(data.role);
        fetchDocuments();
      }
    } catch (e) {
      console.error('Auth check failed');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        setDocuments(await res.json());
      }
    } catch (e) {
      console.error('Failed to fetch documents');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        const data = await res.json();
        setRole(data.role);
        fetchDocuments();
      } else {
        setError('Identifiants incorrects');
      }
    } catch (e) {
      setError('Erreur de connexion au serveur');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    setRole(null);
    setDocuments([]);
  };

  const sortedDocuments = useMemo(() => {
    let items = [...documents];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(doc => 
        doc.name.toLowerCase().includes(q) || 
        doc.subtitle.toLowerCase().includes(q) || 
        doc.type.toLowerCase().includes(q) ||
        doc.amount.toLowerCase().includes(q)
      );
    }
    items.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return items;
  }, [documents, sortConfig, searchQuery]);

  const requestSort = (key: keyof Document) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof Document) => {
    if (sortConfig.key !== key) return <ArrowUpDown size={12} className="opacity-40" />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={12} className="text-accent" /> : <ChevronDown size={12} className="text-accent" />;
  };

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#0A0A0B] text-white">Chargement...</div>;
  }

  if (!role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0B] px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card w-full max-w-md p-8 shadow-2xl"
        >
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent shadow-lg shadow-accent/20">
              <Lock size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Accès Sécurisé</h1>
            <p className="text-white/40 text-sm">Veuillez vous connecter pour accéder aux documents.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/50">Utilisateur</label>
              <input 
                type="text" 
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-glass-border bg-white/5 p-3 text-white placeholder:text-white/20 focus:ring-2 focus:ring-accent"
                placeholder="admin ou client"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/50">Mot de passe</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-glass-border bg-white/5 p-3 text-white placeholder:text-white/20 focus:ring-2 focus:ring-accent"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-center text-xs font-bold text-rose-400">
                {error}
              </motion.div>
            )}

            <button 
              type="submit" 
              disabled={isLoggingIn}
              className="w-full rounded-xl bg-accent py-4 font-bold text-white shadow-xl shadow-accent/20 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
            >
              {isLoggingIn ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-glass-border text-center">
            <p className="text-[10px] text-white/20 uppercase tracking-widest font-medium">Fiscal Architect v2.0 • Hébergement Sécurisé</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-glass-bg backdrop-blur-[12px] border-b border-glass-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 overflow-hidden rounded-lg bg-accent flex items-center justify-center">
              <ShieldCheck size={24} className="text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tighter text-white">Fiscal Architect</h1>
          </div>
          
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#" className="flex items-center gap-2 px-3 py-1 font-medium text-white/60 transition-colors hover:text-white">
              <LayoutDashboard size={18} />
              Tableau
            </a>
            <a href="#" className="px-3 py-1 font-bold text-white bg-white/10 rounded-lg border border-glass-border">Documents</a>
            <a href="#" className="px-3 py-1 font-medium text-white/60 transition-colors hover:text-white">Plan</a>
            <a href="#" className="px-3 py-1 font-medium text-white/60 transition-colors hover:text-white">Export</a>
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-glass-border">
              <UserCircle size={18} className="text-white/40" />
              <span className="text-xs font-bold text-white/60 uppercase tracking-wider">{role === 'admin' ? 'Administrateur' : 'Client'}</span>
            </div>
            <button onClick={handleLogout} className="rounded-full p-2 text-rose-400 transition-colors hover:bg-rose-500/10" title="Déconnexion">
              <LogOut size={22} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 pb-32 pt-8">
        {/* Header Section */}
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="mb-2 block text-sm font-medium uppercase tracking-widest text-white/50">
              Gestion Administrative 
              {role === 'admin' && <span className="ml-2 text-emerald-400 font-bold">• Mode Édition</span>}
            </span>
            <h2 className="text-4xl font-extrabold tracking-tight text-white">
              Journal des Documents
            </h2>
          </div>
          
          {role === 'admin' && (
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 rounded-xl bg-white/5 border border-glass-border px-5 py-2.5 font-semibold text-white/80 transition-all hover:bg-white/10">
                <UploadCloud size={20} />
                <span>Importer</span>
              </button>
              <button className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:opacity-90 active:scale-95">
                <Plus size={20} />
                <span>Nouveau Document</span>
              </button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-col items-center gap-4 rounded-2xl bg-white/5 border border-glass-border p-4 lg:flex-row backdrop-blur-sm">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
            <input 
              type="text" 
              placeholder="Rechercher un fournisseur, un montant..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border-none bg-white/5 py-3 pl-12 pr-4 text-white placeholder:text-white/40 focus:ring-2 focus:ring-accent transition-all"
            />
          </div>
          
          <div className="flex w-full items-center gap-2 overflow-x-auto pb-1 lg:w-auto no-scrollbar">
            <button className="whitespace-nowrap rounded-full bg-accent px-5 py-2 text-sm font-medium text-white">Tous</button>
            <button className="whitespace-nowrap rounded-full bg-white/5 border border-glass-border px-5 py-2 text-sm font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white">Factures</button>
            <div className="mx-2 h-6 w-[1px] bg-white/10"></div>
            
            <div className="relative flex items-center gap-2 rounded-full bg-white/5 border border-glass-border px-4 py-2 text-sm font-medium text-white/60">
              <ArrowUpDown size={16} />
              <select 
                className="bg-transparent border-none focus:ring-0 text-white cursor-pointer pr-4 text-xs font-bold uppercase tracking-wider"
                value={`${sortConfig.key}-${sortConfig.direction}`}
                onChange={(e) => {
                  const [key, direction] = e.target.value.split('-');
                  setSortConfig({ key: key as keyof Document, direction: direction as 'asc' | 'desc' });
                }}
              >
                <option value="timestamp-desc" className="bg-[#0A0A0B]">Date (Récent)</option>
                <option value="timestamp-asc" className="bg-[#0A0A0B]">Date (Ancien)</option>
                <option value="name-asc" className="bg-[#0A0A0B]">Nom A-Z</option>
                <option value="amountValue-desc" className="bg-[#0A0A0B]">Montant (Haut)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Table Container */}
          <div className="overflow-hidden glass-card lg:col-span-12 xl:col-span-9">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-white/5 border-b border-glass-border">
                    <th onClick={() => requestSort('timestamp')} className="cursor-pointer px-6 py-5 text-[11px] font-bold uppercase tracking-wider text-white/40 hover:text-white/80">
                      <div className="flex items-center gap-2"><span>Date</span> {getSortIcon('timestamp')}</div>
                    </th>
                    <th onClick={() => requestSort('name')} className="cursor-pointer px-6 py-5 text-[11px] font-bold uppercase tracking-wider text-white/40 hover:text-white/80">
                      <div className="flex items-center gap-2"><span>Nom</span> {getSortIcon('name')}</div>
                    </th>
                    <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-wider text-white/40">Type</th>
                    <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-wider text-white/40">Compte</th>
                    <th onClick={() => requestSort('amountValue')} className="cursor-pointer px-6 py-5 text-right text-[11px] font-bold uppercase tracking-wider text-white/40 hover:text-white/80">
                      <div className="flex items-center justify-end gap-2"><span>Montant</span> {getSortIcon('amountValue')}</div>
                    </th>
                    <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-wider text-white/40">Statut</th>
                    {role === 'admin' && <th className="px-6 py-5 text-center text-[11px] font-bold uppercase tracking-wider text-white/40">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y-0">
                  {sortedDocuments.map((doc) => {
                    const Icon = docIcons[doc.type as keyof typeof docIcons] || FileText;
                    return (
                      <motion.tr key={doc.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="group transition-colors hover:bg-white/5">
                        <td className="px-6 py-6 font-semibold tabular-nums text-white/90">{doc.date}</td>
                        <td className="px-6 py-6">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 border border-glass-border"><Icon className="text-accent" size={20} /></div>
                            <div className="flex flex-col">
                              <span className="font-bold text-white">{doc.name}</span>
                              <span className="text-xs text-white/40">{doc.subtitle}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6 text-sm font-medium text-white/60">{doc.type}</td>
                        <td className="px-6 py-6 font-bold text-white/80">{doc.account}</td>
                        <td className="px-6 py-6 text-right font-bold tabular-nums text-white/90">{doc.amount}</td>
                        <td className="px-6 py-6">
                           <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${doc.status === 'Validé' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${doc.status === 'Validé' ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                              {doc.status}
                           </span>
                        </td>
                        {role === 'admin' && (
                          <td className="px-6 py-6 text-center">
                            <button className="rounded-lg p-2 text-white/40 hover:bg-white/10 hover:text-white"><FileEdit size={20} /></button>
                          </td>
                        )}
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 xl:col-span-3">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-6 shadow-xl relative overflow-hidden">
               <h3 className="text-lg font-bold mb-1 text-white">Analyse OCR</h3>
               <p className="mb-6 text-xs text-white/50">Précision de l'extraction ce mois</p>
               <div className="mb-4 flex items-baseline gap-2">
                 <span className="text-4xl font-extrabold text-white">98.4%</span>
                 <span className="text-xs font-bold text-emerald-400">+2.1%</span>
               </div>
               <div className="mb-6 h-1.5 w-full rounded-full bg-white/5 border border-glass-border">
                 <div className="h-full w-[98.4%] rounded-full bg-accent"></div>
               </div>
               <button className="w-full rounded-xl bg-white/5 border border-glass-border py-3 text-xs font-bold hover:bg-white/10">Voir le rapport</button>
            </motion.div>

            <div className="glass-card p-6">
               <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-white/90">
                 <AlertTriangle size={18} className="text-amber-400" />
                 Alertes
               </h3>
               <div className="space-y-4">
                 <div className="flex items-start gap-3 rounded-xl bg-white/5 border border-glass-border p-3">
                   <div className="mt-1 h-2 w-2 rounded-full bg-rose-500"></div>
                   <p className="text-xs font-bold text-white/90 leading-tight">2 anomalies détectées</p>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Nav */}
      <nav className="fixed bottom-0 left-0 z-40 flex w-full items-center justify-around border-t border-glass-border bg-glass-bg pb-6 pt-3 backdrop-blur-xl md:hidden">
        <a href="#" className="flex flex-col items-center gap-1 text-white/40"><LayoutDashboard size={22} /><span className="text-[10px] uppercase">Tableau</span></a>
        <a href="#" className="flex flex-col items-center gap-1 text-white"><FileText size={22} /><span className="text-[10px] uppercase">Docs</span></a>
        <a href="#" className="flex flex-col items-center gap-1 text-white/40"><Share size={22} /><span className="text-[10px] uppercase">Export</span></a>
      </nav>
    </div>
  );
}
