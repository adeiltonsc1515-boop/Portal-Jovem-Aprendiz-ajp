
export enum UserRole {
  APPRENTICE = 'APPRENTICE',
  COMPANY = 'COMPANY'
}

export enum ProtocolStatus {
  RECEIVED = 'RECEIVED',
  ANALYZING = 'ANALYZING',
  CONCLUDED = 'CONCLUDED'
}

export enum ManifestType {
  COMPLAINT = 'RECLAMAÇÃO',
  DOUBT = 'DÚVIDA',
  PRAISE = 'ELOGIO'
}

export interface User {
  id: string;
  name: string;
  identifier: string; // Matricula (Aprendiz) ou CNPJ (Empresa)
  role: UserRole;
  password?: string;
  avatarUrl?: string; // Para empresas
  companyId?: string; // Para aprendizes, vinculando a uma empresa
}

export interface Protocol {
  id: string; 
  userId: string;
  targetCompanyId?: string; // Empresa que recebe o elogio/reclamação
  type: ManifestType;
  reason: string;
  description: string;
  aiRefinement?: string;
  legalAnalysis?: string;
  status: ProtocolStatus;
  createdAt: string;
}

export interface AIResponse {
  refinedText: string;
  legalAnalysis: string;
}
