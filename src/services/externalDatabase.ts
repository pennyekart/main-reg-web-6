import { supabase } from '@/integrations/supabase/client';

export interface ExternalPanchayath {
  id: string;
  name: string;
  district: string;
}

export interface ExternalWard {
  id: string;
  name: string;
  panchayath_id: string;
}

export interface ExternalAgent {
  id: string;
  name: string;
  phone?: string;
  panchayath_id?: string;
  ward_id?: string;
}

class ExternalDatabaseService {
  private async callExternalDB(action: string, params?: any) {
    console.log('🔄 Calling external DB with action:', action, 'params:', params);
    
    const { data, error } = await supabase.functions.invoke('explore-external-db', {
      body: { action, ...params }
    });
    
    console.log('📤 External DB response:', { data, error });
    
    if (error) {
      console.error('❌ External DB error:', error);
      throw error;
    }
    return data;
  }

  async getPanchayaths(): Promise<ExternalPanchayath[]> {
    try {
      const result = await this.callExternalDB('fetch_panchayaths');
      return result.panchayaths || [];
    } catch (error) {
      console.error('Error fetching panchayaths:', error);
      return [];
    }
  }

  async getWardsByPanchayath(panchayathId: string): Promise<ExternalWard[]> {
    try {
      const result = await this.callExternalDB('fetch_wards', { panchayath_id: panchayathId });
      return result.wards || [];
    } catch (error) {
      console.error('Error fetching wards:', error);
      return [];
    }
  }

  async getAgents(): Promise<ExternalAgent[]> {
    try {
      const result = await this.callExternalDB('fetch_agents');
      return result.agents || [];
    } catch (error) {
      console.error('Error fetching agents:', error);
      return [];
    }
  }

  async exploreSchema() {
    try {
      const result = await this.callExternalDB('explore_schema');
      return result.schema || {};
    } catch (error) {
      console.error('Error exploring schema:', error);
      return {};
    }
  }
}

export const externalDbService = new ExternalDatabaseService();