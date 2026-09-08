import { GrcAsset, LgpdItem, Credential, AuditLog, CredentialStatus } from '@/types';
import { daysUntil } from '@/lib/utils';

export interface RiskScoreBreakdown {
  score: number;
  deductions: {
    highVulns: number;
    mediumVulns: number;
    expiredCreds: number;
    unresolvedLgpd: number;
  };
  highSeverityOpen: number;
  mediumSeverityOpen: number;
  expiredCredentials: number;
  unresolvedLgpdItems: number;
}

/**
 * Compliance Risk Score Engine
 * Starts at 100% and deducts points based on:
 * - High-severity open audit items: -15% each
 * - Medium-severity open audit items: -8% each
 * - Expired credentials/policies: -10% each
 * - Unresolved LGPD checklist items (Non-Compliant): -5% each
 */
export function calculateRiskScore(
  assets: GrcAsset[],
  lgpdItems: LgpdItem[],
  credentials: Credential[],
  auditLogs: AuditLog[]
): RiskScoreBreakdown {
  const highSeverityOpen = auditLogs.filter(
    (a) => a.severity === 'High' && a.status !== 'Resolved'
  ).length;

  const mediumSeverityOpen = auditLogs.filter(
    (a) => a.severity === 'Medium' && a.status !== 'Resolved'
  ).length;

  const expiredCredentials = credentials.filter((c) => {
    const days = daysUntil(c.expiry_date);
    return days !== null && days < 0;
  }).length;

  const unresolvedLgpdItems = lgpdItems.filter(
    (l) => l.status === 'Non-Compliant'
  ).length;

  const highDeduction = highSeverityOpen * 15;
  const mediumDeduction = mediumSeverityOpen * 8;
  const expiredDeduction = expiredCredentials * 10;
  const lgpdDeduction = unresolvedLgpdItems * 5;

  const totalDeduction = highDeduction + mediumDeduction + expiredDeduction + lgpdDeduction;
  const score = Math.max(0, 100 - totalDeduction);

  return {
    score,
    deductions: {
      highVulns: highDeduction,
      mediumVulns: mediumDeduction,
      expiredCreds: expiredDeduction,
      unresolvedLgpd: lgpdDeduction,
    },
    highSeverityOpen,
    mediumSeverityOpen,
    expiredCredentials,
    unresolvedLgpdItems,
  };
}

export function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Baixo Risco';
  if (score >= 50) return 'Risco Médio';
  return 'Risco Crítico';
}

export function getCredentialStatus(cred: Credential): CredentialStatus {
  const days = daysUntil(cred.expiry_date);
  if (days === null) return 'Active';
  if (days < 0) return 'Expired';
  if (days < 30) return 'Expiring Soon';
  return 'Active';
}

export function getAlertCount(
  credentials: Credential[],
  auditLogs: AuditLog[],
  lgpdItems: LgpdItem[]
): number {
  const expiredCreds = credentials.filter((c) => getCredentialStatus(c) === 'Expired').length;
  const highOpenAudits = auditLogs.filter((a) => a.severity === 'High' && a.status === 'Open').length;
  const nonCompliantLgpd = lgpdItems.filter((l) => l.status === 'Non-Compliant').length;
  return expiredCreds + highOpenAudits + nonCompliantLgpd;
}
