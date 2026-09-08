import { GrcAsset, LgpdItem, Credential, AuditLog, RiskScoreBreakdown } from '@/types';
import { getCredentialStatus } from '@/lib/risk';
import { formatDate, daysUntil } from '@/lib/utils';

export function exportAuditReport(
  risk: RiskScoreBreakdown,
  assets: GrcAsset[],
  lgpdItems: LgpdItem[],
  credentials: Credential[],
  auditLogs: AuditLog[]
) {
  const win = window.open('', '_blank');
  if (!win) return;

  const date = new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' });
  const scoreColor = risk.score >= 80 ? '#16a34a' : risk.score >= 50 ? '#d97706' : '#dc2626';
  const scoreLabel = risk.score >= 80 ? 'Baixo Risco' : risk.score >= 50 ? 'Risco Médio' : 'Risco Crítico';

  const assetRows = assets.map((a) => `
    <tr>
      <td>${a.name}</td><td>${a.type}</td><td>${a.criticality}</td>
      <td>${a.owner ?? '--'}</td><td>${formatDate(a.last_audit_date)}</td><td>${a.status}</td>
    </tr>`).join('');

  const lgpdRows = lgpdItems.map((l) => `
    <tr>
      <td>${l.title}</td><td>${l.category}</td><td>${l.status}</td>
    </tr>`).join('');

  const credRows = credentials.map((c) => {
    const status = getCredentialStatus(c);
    const days = daysUntil(c.expiry_date);
    const statusColor = status === 'Expired' ? '#dc2626' : status === 'Expiring Soon' ? '#d97706' : '#16a34a';
    return `
    <tr>
      <td>${c.name}</td><td>${c.type}</td><td>${c.holder ?? '--'}</td>
      <td>${formatDate(c.expiry_date)}</td><td style="color:${statusColor};font-weight:600">${status}${days !== null ? ` (${days > 0 ? '+' + days : days}d)` : ''}</td>
    </tr>`;
  }).join('');

  const auditRows = auditLogs.map((a) => `
    <tr>
      <td>${a.title}</td><td>${a.severity}</td><td>${a.status}</td>
      <td>${a.assigned_to ?? '--'}</td><td>${formatDate(a.incident_date)}</td>
    </tr>`).join('');

  win.document.write(`
<!DOCTYPE html><html><head><title>Relatório de Auditoria GuardiaGRC — ${date}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Inter', system-ui, sans-serif; color: #1f2531; padding: 40px; background: #f8f9fb; }
  .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:32px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
  .logo { display:flex; align-items:center; gap:12px; }
  .logo-icon { width:40px; height:40px; border-radius:10px; background: linear-gradient(135deg, #3366ff, #1430d8); display:flex; align-items:center; justify-content:center; color:#fff; font-weight:800; font-size:18px; }
  .logo h1 { font-size:20px; font-weight:700; }
  .logo p { font-size:11px; color:#64748b; }
  .report-date { text-align:right; font-size:12px; color:#64748b; }
  .score-section { background:#fff; border-radius:16px; padding:28px; margin-bottom:24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); display:flex; align-items:center; gap:32px; }
  .score-circle { width:120px; height:120px; border-radius:50%; border: 8px solid ${scoreColor}; display:flex; flex-direction:column; align-items:center; justify-content:center; flex-shrink:0; }
  .score-value { font-size:28px; font-weight:800; color:${scoreColor}; }
  .score-label { font-size:11px; color:#64748b; }
  .score-breakdown h2 { font-size:16px; margin-bottom:12px; }
  .score-breakdown ul { list-style:none; }
  .score-breakdown li { font-size:13px; padding:4px 0; display:flex; justify-content:space-between; border-bottom:1px solid #f1f5f9; }
  .score-breakdown li span:last-child { font-weight:600; }
  section { background:#fff; border-radius:16px; padding:24px; margin-bottom:24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
  section h2 { font-size:15px; font-weight:700; margin-bottom:16px; padding-bottom:8px; border-bottom:1px solid #e2e8f0; }
  table { width:100%; border-collapse:collapse; font-size:12px; }
  th { text-align:left; padding:8px 12px; background:#f8fafc; color:#64748b; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; }
  td { padding:8px 12px; border-bottom:1px solid #f1f5f9; }
  tr:last-child td { border-bottom:none; }
  .footer { margin-top:32px; text-align:center; font-size:11px; color:#94a3b8; border-top:1px solid #e2e8f0; padding-top:16px; }
  @media print { body { padding:20px; background:#fff; } section { box-shadow:none; } }
</style></head><body>

<div class="header">
  <div class="logo">
    <div class="logo-icon">G</div>
    <div><h1>GuardiaGRC</h1><p>Conformidade LGPD & Segurança de TI</p></div>
  </div>
  <div class="report-date">Gerado em: ${date}</div>
</div>

<div class="score-section">
  <div class="score-circle">
    <span class="score-value">${risk.score}%</span>
    <span class="score-label">${scoreLabel}</span>
  </div>
  <div class="score-breakdown" style="flex:1">
    <h2>Detalhamento do Score de Risco</h2>
    <ul>
      <li><span>Vulnerabilidades abertas de alta severidade (-15% cada)</span><span>-${risk.deductions.highVulns}% (${risk.highSeverityOpen} itens)</span></li>
      <li><span>Vulnerabilidades abertas de média severidade (-8% cada)</span><span>-${risk.deductions.mediumVulns}% (${risk.mediumSeverityOpen} itens)</span></li>
      <li><span>Credenciais / políticas vencidas (-10% cada)</span><span>-${risk.deductions.expiredCreds}% (${risk.expiredCredentials} itens)</span></li>
      <li><span>Itens não conformes do checklist LGPD (-5% cada)</span><span>-${risk.deductions.unresolvedLgpd}% (${risk.unresolvedLgpdItems} itens)</span></li>
    </ul>
  </div>
</div>

<section>
  <h2>Ativos de TI (${assets.length})</h2>
  <table><thead><tr><th>Nome</th><th>Tipo</th><th>Criticidade</th><th>Responsável</th><th>Última Auditoria</th><th>Status</th></tr></thead>
  <tbody>${assetRows}</tbody></table>
</section>

<section>
  <h2>Checklist de Conformidade LGPD (${lgpdItems.length})</h2>
  <table><thead><tr><th>Item</th><th>Categoria</th><th>Status</th></tr></thead>
  <tbody>${lgpdRows}</tbody></table>
</section>

<section>
  <h2>Credenciais & Vencimentos (${credentials.length})</h2>
  <table><thead><tr><th>Nome</th><th>Tipo</th><th>Titular</th><th>Data de Vencimento</th><th>Status</th></tr></thead>
  <tbody>${credRows}</tbody></table>
</section>

<section>
  <h2>Logs de Auditoria & Itens de Ação (${auditLogs.length})</h2>
  <table><thead><tr><th>Título</th><th>Severidade</th><th>Status</th><th>Responsável</th><th>Data do Incidente</th></tr></thead>
  <tbody>${auditRows}</tbody></table>
</section>

<div class="footer">GuardiaGRC — Relatório de Auditoria Confidencial — Gerado em ${date}</div>

<script>setTimeout(() => window.print(), 500);</script>
</body></html>`);
  win.document.close();
}
