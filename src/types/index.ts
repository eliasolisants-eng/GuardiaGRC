export type AssetType = 'Server' | 'Database' | 'API' | 'Endpoint';
export type Criticality = 'High' | 'Medium' | 'Low';
export type AssetStatus = 'Compliant' | 'At Risk' | 'Non-Compliant';

export type LGPDStatus = 'Compliant' | 'In Progress' | 'Non-Compliant';

export type CredentialType = 'Employee Access' | 'SSL Certificate' | 'Security Policy';
export type CredentialStatus = 'Active' | 'Expiring Soon' | 'Expired';

export type AuditSeverity = 'High' | 'Medium' | 'Low';
export type AuditStatus = 'Open' | 'In Review' | 'Resolved';

export interface GrcAsset {
  id: string;
  name: string;
  type: AssetType;
  criticality: Criticality;
  owner: string | null;
  last_audit_date: string | null;
  status: AssetStatus;
  created_at: string;
  updated_at: string;
}

export interface LgpdItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: LGPDStatus;
  updated_at: string;
  created_at: string;
}

export interface Credential {
  id: string;
  name: string;
  type: CredentialType;
  holder: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  status: CredentialStatus;
  created_at: string;
}

export interface AuditLog {
  id: string;
  title: string;
  description: string | null;
  severity: AuditSeverity;
  status: AuditStatus;
  assigned_to: string | null;
  incident_date: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface RiskHistoryPoint {
  id: string;
  score: number;
  calculated_at: string;
}

export const ASSET_TYPES: AssetType[] = ['Server', 'Database', 'API', 'Endpoint'];
export const CRITICALITIES: Criticality[] = ['High', 'Medium', 'Low'];
export const ASSET_STATUSES: AssetStatus[] = ['Compliant', 'At Risk', 'Non-Compliant'];

export const LGPD_STATUSES: LGPDStatus[] = ['Compliant', 'In Progress', 'Non-Compliant'];

export const CREDENTIAL_TYPES: CredentialType[] = ['Employee Access', 'SSL Certificate', 'Security Policy'];

export const AUDIT_SEVERITIES: AuditSeverity[] = ['High', 'Medium', 'Low'];
export const AUDIT_STATUSES: AuditStatus[] = ['Open', 'In Review', 'Resolved'];

export const ASSET_STATUS_COLORS: Record<AssetStatus, string> = {
  'Compliant': ' compliant',
  'At Risk': ' at-risk',
  'Non-Compliant': ' non-compliant',
};

export const SEVERITY_COLORS: Record<AuditSeverity, string> = {
  'High': ' high',
  'Medium': ' medium',
  'Low': ' low',
};

export const AUDIT_STATUS_COLORS: Record<AuditStatus, string> = {
  'Open': ' open',
  'In Review': ' in-review',
  'Resolved': ' resolved',
};

export const LGPD_STATUS_COLORS: Record<LGPDStatus, string> = {
  'Compliant': ' compliant',
  'In Progress': ' in-progress',
  'Non-Compliant': ' non-compliant',
};

export const CRITICALITY_COLORS: Record<Criticality, string> = {
  'High': ' high',
  'Medium': ' medium',
  'Low': ' low',
};
