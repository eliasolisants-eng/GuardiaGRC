import { useState, useEffect, useCallback } from 'react';
import Layout, { View } from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Assets from '@/pages/Assets';
import LGPD from '@/pages/LGPD';
import Credentials from '@/pages/Credentials';
import Audits from '@/pages/Audits';
import { supabase } from '@/lib/supabase';
import {
  GrcAsset, LgpdItem, Credential, AuditLog,
} from '@/types';
import { calculateRiskScore, getAlertCount } from '@/lib/risk';
import { exportAuditReport } from '@/lib/export';

function App() {
  const [view, setView] = useState<View>('dashboard');
  const [assets, setAssets] = useState<GrcAsset[]>([]);
  const [lgpdItems, setLgpdItems] = useState<LgpdItem[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  const loadAll = useCallback(async () => {
    const [{ data: a }, { data: l }, { data: c }, { data: au }] = await Promise.all([
      supabase.from('grc_assets').select('*'),
      supabase.from('grc_lgpd_items').select('*'),
      supabase.from('grc_credentials').select('*'),
      supabase.from('grc_audit_logs').select('*'),
    ]);
    if (a) setAssets(a as GrcAsset[]);
    if (l) setLgpdItems(l as LgpdItem[]);
    if (c) setCredentials(c as Credential[]);
    if (au) setAuditLogs(au as AuditLog[]);
    setDataLoaded(true);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const risk = calculateRiskScore(assets, lgpdItems, credentials, auditLogs);
  const alertCount = getAlertCount(credentials, auditLogs, lgpdItems);

  const handleExport = () => {
    exportAuditReport(risk, assets, lgpdItems, credentials, auditLogs);
  };

  if (!dataLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 bg-ink-50 dark:bg-surface-0">
        <div className="relative orb-loader" />
        <p className="text-sm font-display font-medium text-ink-400 dark:text-slate-500 animate-fade-in">Carregando GuardiaGRC...</p>
      </div>
    );
  }

  return (
    <Layout current={view} onNavigate={setView} alertCount={alertCount} onExport={handleExport}>
      {view === 'dashboard' && <Dashboard onNavigate={setView} />}
      {view === 'assets' && <Assets />}
      {view === 'lgpd' && <LGPD />}
      {view === 'credentials' && <Credentials />}
      {view === 'audits' && <Audits />}
    </Layout>
  );
}

export default App;
