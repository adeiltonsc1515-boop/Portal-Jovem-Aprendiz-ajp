
import { User, Protocol, UserRole, ProtocolStatus } from './types';

const supabaseUrl = 'https://wrrmtwzruznamyvrkohw.supabase.co';
const supabaseKey = 'sb_publishable_Cf3KvrWwLuNpw0S1ri4Gmg_9Ne8LKcc'; 

async function supabaseRequest(path: string, options: RequestInit = {}) {
  const url = `${supabaseUrl}/rest/v1/${path}`;
  
  const headers: Record<string, string> = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    ...((options.headers as any) || {}),
  };

  if (options.method === 'POST' || options.method === 'PATCH') {
    headers['Prefer'] = 'return=representation';
  }

  try {
    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorText;
      } catch (e) { /* ignore */ }
      throw new Error(errorMessage);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return response.json();
    }
    return null;
  } catch (error: any) {
    console.error("Erro na requisição Supabase:", error);
    if (error.message === 'Failed to fetch') {
      throw new Error("Erro de conexão: Verifique sua internet ou se o projeto Supabase está ativo.");
    }
    throw error;
  }
}

export const supabase = {
  async login(identifier: string, password: string, role: UserRole): Promise<User | null> {
    // Garantir que não estamos filtrando por string vazia se o identificador for obrigatório
    if (!identifier || !password) return null;
    
    const data = await supabaseRequest(`users?identifier=eq.${identifier}&password=eq.${password}&role=eq.${role}`);
    if (data && data.length > 0) {
      const u = data[0];
      return {
        id: u.id,
        name: u.name,
        identifier: u.identifier,
        role: u.role as UserRole,
        avatarUrl: u.avatar_url,
        companyId: u.company_id
      };
    }
    return null;
  },

  async register(userData: Partial<User> & { password?: string }): Promise<User | null> {
    const payload = {
      name: userData.name,
      identifier: userData.identifier,
      password: userData.password,
      role: userData.role,
      avatar_url: userData.avatarUrl || null,
      // CRITICAL FIX: UUID columns must be null, not empty string ""
      company_id: userData.companyId && userData.companyId !== "" ? userData.companyId : null
    };
    
    const data = await supabaseRequest('users', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return data && data.length > 0 ? (data[0] as User) : null;
  },

  async getCompanies(): Promise<User[]> {
    const data = await supabaseRequest(`users?role=eq.${UserRole.COMPANY}&select=id,name,avatar_url`);
    return (data || []) as User[];
  },

  async createProtocol(protocol: Omit<Protocol, 'id' | 'createdAt' | 'status'>): Promise<Protocol> {
    const newProtocol = {
      id: `PJA-${Math.floor(100000 + Math.random() * 900000)}`,
      userId: protocol.userId,
      // CRITICAL FIX: UUID columns must be null, not empty string ""
      targetCompanyId: protocol.targetCompanyId && protocol.targetCompanyId !== "" ? protocol.targetCompanyId : null,
      type: protocol.type,
      reason: protocol.reason,
      description: protocol.description,
      aiRefinement: protocol.aiRefinement || null,
      legalAnalysis: protocol.legalAnalysis || null,
      status: ProtocolStatus.RECEIVED,
      createdAt: new Date().toISOString()
    };
    const data = await supabaseRequest('protocols', {
      method: 'POST',
      body: JSON.stringify(newProtocol)
    });
    return data[0] as Protocol;
  },

  async getProtocols(userId: string): Promise<Protocol[]> {
    if (!userId) return [];
    const data = await supabaseRequest(`protocols?userId=eq.${userId}&order=createdAt.desc`);
    return (data || []) as Protocol[];
  },

  async getCompanyData(companyId: string) {
    // Se companyId estiver vazio, não faz a requisição para evitar erro 22P02
    if (!companyId || companyId === "") {
      return { praises: [], apprenticeCount: 0 };
    }

    const praises = await supabaseRequest(`protocols?targetCompanyId=eq.${companyId}&type=eq.ELOGIO&order=createdAt.desc`);
    const apprentices = await supabaseRequest(`users?company_id=eq.${companyId}&select=id`);
    
    return {
      praises: (praises || []) as Protocol[],
      apprenticeCount: (apprentices || []).length
    };
  }
};
