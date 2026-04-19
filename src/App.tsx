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
  UserCircle,
  Download,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type UserRole = 'admin' | 'client' | null;
type ActivePage = 'documents' | 'plan' | 'export' | 'dashboard';

interface Document {
  id: number;
  date: string;
  time: string;
  timestamp: number;
  name: string;
  subtitle: string;
  vendor: string;
  description: string;
  type: string;
  account: string;
  accountStatus: string;
  amountValue: number;
  amount: string;
  amountHT: number;
  amountTVA: number;
  amountTTC: number;
  accountNumber: string;
  accountingJournal: string;
  analyticalCode: string;
  status: string;
  paymentStatus: string;
}

const docIcons = {
  Télécom: FileText,
  Énergie: Zap,
  Ventes: User,
  Frais: Utensils,
};

export default function App() {
  const [role, setRole] = useState<UserRole>(null);
  const [activePage, setActivePage] = useState<ActivePage>('documents');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Document; direction: 'asc' | 'desc' }>({ key: 'timestamp', direction: 'desc' });
  const [searchQuery, setSearchQuery] = useState('');
  const [exportColumns, setExportColumns] = useState<Record<string, boolean>>({
    date: true,
    vendor: true,
    description: true,
    amountHT: true,
    amountTVA: true,
    amountTTC: true,
    accountingJournal: true,
    accountNumber: true,
    analyticalCode: true,
    paymentStatus: true,
    status: true
  });

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

  const exportToCSV = () => {
    const columnDefinitions = [
      { id: 'date', label: 'Date du document' },
      { id: 'vendor', label: 'Fournisseur' },
      { id: 'description', label: 'Libellé' },
      { id: 'amountHT', label: 'Montant HT' },
      { id: 'amountTVA', label: 'TVA' },
      { id: 'amountTTC', label: 'TTC' },
      { id: 'accountingJournal', label: 'Journal comptable' },
      { id: 'accountNumber', label: 'Numéro compte comptable' },
      { id: 'analyticalCode', label: 'Code analytique' },
      { id: 'paymentStatus', label: 'État Paiement' },
      { id: 'status', label: 'Statut' }
    ];

    const activeCols = columnDefinitions.filter(col => exportColumns[col.id]);
    const headers = activeCols.map(col => col.label);
    
    const rows = sortedDocuments.map(doc => activeCols.map(col => {
      const val = doc[col.id as keyof Document];
      if (typeof val === 'number') return val.toString().replace('.', ',');
      return val;
    }));

    const csvContent = [headers, ...rows].map(e => e.join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `export_comptable_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                placeholder="Identifiant (ex: admin)"
              />
              <p className="mt-1 text-[10px] text-white/30 italic">L'identifiant est "admin" pour vous.</p>
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
          
          <nav className="hidden items-center gap-4 md:flex">
            <button 
              onClick={() => setActivePage('dashboard')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${activePage === 'dashboard' ? 'bg-white/10 text-white border border-glass-border font-bold' : 'text-white/60 hover:text-white'}`}
            >
              <LayoutDashboard size={18} />
              Tableau
            </button>
            <button 
              onClick={() => setActivePage('documents')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${activePage === 'documents' ? 'bg-white/10 text-white border border-glass-border font-bold' : 'text-white/60 hover:text-white'}`}
            >
              <FileText size={18} />
              Documents
            </button>
            <button 
              onClick={() => setActivePage('plan')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${activePage === 'plan' ? 'bg-white/10 text-white border border-glass-border font-bold' : 'text-white/60 hover:text-white'}`}
            >
              <Calendar size={18} />
              Plan
            </button>
            <button 
              onClick={() => setActivePage('export')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${activePage === 'export' ? 'bg-white/10 text-white border border-glass-border font-bold' : 'text-white/60 hover:text-white'}`}
            >
              <Share size={18} />
              Export
            </button>
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
        <AnimatePresence mode="wait">
          {activePage === 'documents' && (
            <motion.div key="docs" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
              {/* Documents Header */}
              <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div>
                  <span className="mb-2 block text-sm font-medium uppercase tracking-widest text-white/50">
                    Gestion Administrative 
                    {role === 'admin' && <span className="ml-2 text-emerald-400 font-bold">• Mode Édition</span>}
                  </span>
                  <h2 className="text-4xl font-extrabold tracking-tight text-white line-clamp-1">
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

              {/* Filters & Table Layout (Original) */}
              <div className="mb-8 flex flex-col items-center gap-4 rounded-2xl bg-white/5 border border-glass-border p-4 lg:flex-row backdrop-blur-sm">
                <div className="relative w-full lg:max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                  <input 
                    type="text" 
                    placeholder="Rechercher..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border-none bg-white/5 py-3 pl-12 pr-4 text-white placeholder:text-white/40 focus:ring-2 focus:ring-accent transition-all"
                  />
                </div>
                <div className="flex w-full items-center gap-2 overflow-x-auto pb-1 lg:w-auto no-scrollbar">
                  <button className="whitespace-nowrap rounded-full bg-accent px-5 py-2 text-sm font-medium text-white">Tous</button>
                  <button className="whitespace-nowrap rounded-full bg-white/5 border border-glass-border px-5 py-2 text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white">Factures</button>
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
                      <option value="timestamp-desc" className="bg-[#0A0A0B]">Date (Réc.)</option>
                      <option value="timestamp-asc" className="bg-[#0A0A0B]">Date (Anc.)</option>
                      <option value="amountValue-desc" className="bg-[#0A0A0B]">Montant ↑</option>
                      <option value="amountValue-asc" className="bg-[#0A0A0B]">Montant ↓</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                <div className="overflow-hidden glass-card lg:col-span-12 xl:col-span-9">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="bg-white/5 border-b border-glass-border">
                          <th onClick={() => requestSort('timestamp')} className="cursor-pointer px-6 py-5 text-[11px] font-bold uppercase tracking-wider text-white/40 hover:text-white/80">Date</th>
                          <th onClick={() => requestSort('name')} className="cursor-pointer px-6 py-5 text-[11px] font-bold uppercase tracking-wider text-white/40 hover:text-white/80">Nom</th>
                          <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-wider text-white/40">Type</th>
                          <th onClick={() => requestSort('amountValue')} className="cursor-pointer px-6 py-5 text-right text-[11px] font-bold uppercase tracking-wider text-white/40 hover:text-white/80">Montant</th>
                          <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-wider text-white/40">Paiement</th>
                          <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-wider text-white/40">Statut</th>
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
                                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 border border-glass-border"><Icon className="text-accent" size={18} /></div>
                                  <div className="flex flex-col">
                                    <span className="font-bold text-white text-sm">{doc.vendor || doc.name}</span>
                                    <span className="text-[10px] text-white/40">{doc.description || doc.subtitle}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-6 text-xs font-medium text-white/60">{doc.type}</td>
                              <td className="px-6 py-6 text-right font-bold tabular-nums text-white/90">{doc.amount}</td>
                              <td className="px-6 py-6 font-bold">
                                <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md border ${doc.paymentStatus === 'Payé' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                                  {doc.paymentStatus}
                                </span>
                              </td>
                              <td className="px-6 py-6 font-bold">
                                <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md border ${doc.status === 'Validé' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                                  {doc.status}
                                </span>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-6 xl:col-span-3">
                  <div className="glass-card p-6">
                    <h3 className="text-sm font-bold mb-4 text-white">Résumé</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-white/40">Total ({sortedDocuments.length})</span>
                        <span className="font-bold text-white">
                          {sortedDocuments.reduce((acc, curr) => acc + curr.amountValue, 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </span>
                      </div>
                      <div className="h-[1px] bg-white/10 w-full"></div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-white/40">Validés</span>
                        <span className="font-bold text-emerald-400">
                           {sortedDocuments.filter(d => d.status === 'Validé').length}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="glass-card p-6 text-center border-accent/20 bg-accent/5">
                    <Share className="mx-auto mb-3 text-accent" size={32} />
                    <p className="text-xs font-bold text-white mb-1">Besoin d'un rapport ?</p>
                    <p className="text-[10px] text-white/40 mb-4">Exportez instantanément vos données comptables.</p>
                    <button onClick={() => setActivePage('export')} className="w-full rounded-xl bg-accent py-2.5 text-xs font-bold text-white hover:opacity-90">Aller à l'Export</button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activePage === 'plan' && (
            <motion.div key="plan" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="max-w-4xl mx-auto py-12">
              <div className="text-center mb-12">
                <div className="mx-auto w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mb-4">
                  <Calendar size={32} className="text-accent" />
                </div>
                <h2 className="text-3xl font-extrabold text-white mb-2">Planning & Calendrier Fiscal</h2>
                <p className="text-white/40">Gérez vos échéances administratives et fiscales sans stress.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass-card p-8">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Layers size={20} className="text-accent" />
                    Prochaines Échéances
                  </h3>
                  <div className="space-y-6">
                    {[
                      { date: '15 Mai', title: 'Déclaration TVA Avril', priority: 'High' },
                      { date: '21 Mai', title: "Paiement Cotisations URSSAF", priority: 'High' },
                      { date: '05 Juin', title: 'Clôture Mensuelle Mai', priority: 'Medium' }
                    ].map((step, i) => (
                      <div key={i} className="flex gap-4 items-center">
                        <div className="shrink-0 flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-glass-border">
                          <span className="text-[10px] font-bold text-accent uppercase">{step.date.split(' ')[1]}</span>
                          <span className="text-sm font-bold text-white leading-tight">{step.date.split(' ')[0]}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-white">{step.title}</p>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${step.priority === 'High' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>
                            {step.priority === 'High' ? 'Priorité Haute' : 'Standard'}
                          </span>
                        </div>
                        <ArrowRight size={16} className="text-white/20" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-card p-8 bg-white/5">
                   <h3 className="text-lg font-bold mb-4">Notes Planning</h3>
                   <div className="h-48 rounded-xl border border-dashed border-white/10 flex items-center justify-center p-6 text-center">
                     <p className="text-sm text-white/20 italic">Aucune note particulière pour ce mois. Votre agenda est à jour.</p>
                   </div>
                   <button className="mt-6 w-full py-3 rounded-xl bg-white/5 border border-glass-border text-xs font-bold hover:bg-white/10 transition-all">Ajouter un rappel</button>
                </div>
              </div>
            </motion.div>
          )}

          {activePage === 'export' && (
            <motion.div key="export" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-4xl mx-auto py-12">
              <div className="glass-card p-12">
                <div className="flex flex-col md:flex-row gap-12">
                  <div className="flex-1 text-center md:text-left">
                    <div className="w-20 h-20 bg-accent rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-accent/40 mx-auto md:mx-0">
                      <Download size={40} className="text-white" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-white mb-4">Export de Données</h2>
                    <p className="text-white/40 mb-10 max-w-sm">Paramétrez votre export pour une intégration parfaite dans votre logiciel de comptabilité.</p>
                    
                    <button 
                      onClick={exportToCSV}
                      className="w-full flex items-center justify-center gap-4 p-5 rounded-2xl bg-accent text-white hover:opacity-90 transition-all shadow-xl shadow-accent/20 font-bold"
                    >
                      <Download size={24} />
                      Télécharger l'export CSV
                    </button>
                    
                    <p className="mt-6 text-[10px] text-white/30 italic">
                      L'export contient {sortedDocuments.length} documents basés sur vos filtres actuels.
                    </p>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-wider flex items-center gap-2">
                       <Filter size={16} className="text-accent" />
                       Colonnes à inclure
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { id: 'date', label: 'Date document' },
                        { id: 'vendor', label: 'Fournisseur' },
                        { id: 'description', label: 'Libellé' },
                        { id: 'amountHT', label: 'Montant HT' },
                        { id: 'amountTVA', label: 'TVA' },
                        { id: 'amountTTC', label: 'Montant TTC' },
                        { id: 'accountingJournal', label: 'Journal comptable' },
                        { id: 'accountNumber', label: 'Compte comptable' },
                        { id: 'analyticalCode', label: 'Code analytique' },
                        { id: 'paymentStatus', label: 'État Paiement' },
                        { id: 'status', label: 'Statut validation' }
                      ].map((col) => (
                        <label key={col.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-glass-border hover:bg-white/10 transition-all cursor-pointer group">
                          <div className="relative flex items-center">
                            <input 
                              type="checkbox" 
                              checked={exportColumns[col.id]}
                              onChange={() => setExportColumns(prev => ({ ...prev, [col.id]: !prev[col.id] }))}
                              className="peer h-5 w-5 appearance-none rounded-md border border-white/20 bg-transparent checked:border-accent checked:bg-accent focus:outline-none focus:ring-2 focus:ring-accent/50"
                            />
                            <CheckCircle2 className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 left-[3px] top-[3.5px] pointer-events-none transition-opacity" />
                          </div>
                          <span className={`text-xs font-medium transition-colors ${exportColumns[col.id] ? 'text-white' : 'text-white/40'}`}>
                            {col.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activePage === 'dashboard' && (
            <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-32 opacity-20">
              <LayoutDashboard size={80} className="mb-4" />
              <p className="text-xl font-bold italic uppercase tracking-widest">Dashboard en construction</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-0 left-0 z-40 flex w-full items-center justify-around border-t border-glass-border bg-glass-bg pb-6 pt-3 backdrop-blur-xl md:hidden">
        <button onClick={() => setActivePage('dashboard')} className={`flex flex-col items-center gap-1 transition-all ${activePage === 'dashboard' ? 'text-white' : 'text-white/40'}`}><LayoutDashboard size={22} /><span className="text-[10px] uppercase">Tableau</span></button>
        <button onClick={() => setActivePage('documents')} className={`flex flex-col items-center gap-1 transition-all ${activePage === 'documents' ? 'text-white' : 'text-white/40'}`}><FileText size={22} /><span className="text-[10px] uppercase">Docs</span></button>
        <button onClick={() => setActivePage('plan')} className={`flex flex-col items-center gap-1 transition-all ${activePage === 'plan' ? 'text-white' : 'text-white/40'}`}><Calendar size={22} /><span className="text-[10px] uppercase">Plan</span></button>
        <button onClick={() => setActivePage('export')} className={`flex flex-col items-center gap-1 transition-all ${activePage === 'export' ? 'text-white' : 'text-white/40'}`}><Share size={22} /><span className="text-[10px] uppercase">Export</span></button>
      </nav>
    </div>
  );
}
