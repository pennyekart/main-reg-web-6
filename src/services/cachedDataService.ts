import { supabase } from '@/integrations/supabase/client';

export interface CachedPanchayath {
  id: string;
  name: string;
  district?: string;
  external_id?: string;
  last_synced_at?: string;
}

export interface CachedWard {
  id: string;
  name: string;
  panchayath_id: string;
  external_id?: string;
  external_panchayath_id?: string;
  last_synced_at?: string;
}

export interface CachedAgent {
  id: string;
  name: string;
  phone?: string;
  panchayath_id?: string;
  ward_id?: string;
  external_id?: string;
  external_panchayath_id?: string;
  external_ward_id?: string;
  last_synced_at?: string;
}

class CachedDataService {
  async getPanchayaths(): Promise<CachedPanchayath[]> {
    try {
      console.log('🔄 Fetching cached panchayaths...');
      
      const { data, error } = await (supabase as any)
        .from('cached_panchayaths')
        .select('id, name, district, external_id, last_synced_at')
        .order('name');
      
      if (error) {
        console.error('❌ Error fetching cached panchayaths:', error);
        return [];
      }
      
      console.log(`✅ Found ${data?.length || 0} cached panchayaths`);
      return data as CachedPanchayath[];
    } catch (error) {
      console.error('Error fetching cached panchayaths:', error);
      return [];
    }
  }

  async getWardsByPanchayath(panchayathId: string): Promise<CachedWard[]> {
    try {
      console.log('🔄 Fetching cached wards for panchayath:', panchayathId);
      
      const { data, error } = await (supabase as any)
        .from('cached_wards')
        .select('id, name, panchayath_id, external_id, external_panchayath_id, last_synced_at')
        .eq('panchayath_id', panchayathId)
        .order('name');
      
      if (error) {
        console.error('❌ Error fetching cached wards:', error);
        return [];
      }
      
      console.log(`✅ Found ${data?.length || 0} cached wards`);
      return data as CachedWard[];
    } catch (error) {
      console.error('Error fetching cached wards:', error);
      return [];
    }
  }

  async getAgentsByWard(wardId: string): Promise<CachedAgent[]> {
    try {
      console.log('🔄 Fetching cached agents for ward:', wardId);
      
      const { data, error } = await (supabase as any)
        .from('cached_agents')
        .select('id, name, phone, panchayath_id, ward_id, external_id, external_panchayath_id, external_ward_id, last_synced_at')
        .eq('ward_id', wardId)
        .order('name');
      
      if (error) {
        console.error('❌ Error fetching cached agents:', error);
        return [];
      }
      
      console.log(`✅ Found ${data?.length || 0} cached agents`);
      return data as CachedAgent[];
    } catch (error) {
      console.error('Error fetching cached agents:', error);
      return [];
    }
  }

  async getAgentsByPanchayath(panchayathId: string): Promise<CachedAgent[]> {
    try {
      console.log('🔄 Fetching cached agents for panchayath:', panchayathId);
      
      const { data, error } = await (supabase as any)
        .from('cached_agents')
        .select('id, name, phone, panchayath_id, ward_id, external_id, external_panchayath_id, external_ward_id, last_synched_at')
        .eq('panchayath_id', panchayathId)
        .order('name');
      
      if (error) {
        console.error('❌ Error fetching cached agents:', error);
        return [];
      }
      
      console.log(`✅ Found ${data?.length || 0} cached agents`);
      return data as CachedAgent[];
    } catch (error) {
      console.error('Error fetching cached agents:', error);
      return [];
    }
  }

  async syncData(action: 'sync_all' | 'sync_panchayaths' | 'sync_wards' | 'sync_agents' = 'sync_all') {
    try {
      console.log('🔄 Triggering data sync:', action);
      
      const { data, error } = await supabase.functions.invoke('sync-external-data', {
        body: { action }
      });
      
      if (error) {
        console.error('❌ Sync error:', error);
        throw error;
      }
      
      console.log('✅ Sync completed:', data);
      return data;
    } catch (error) {
      console.error('Error syncing data:', error);
      throw error;
    }
  }

  async getLastSyncTime(): Promise<string | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('cached_panchayaths')
        .select('last_synced_at')
        .order('last_synced_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error || !data) {
        return null;
      }
      
      return data?.last_synced_at || null;
    } catch (error) {
      console.error('Error getting last sync time:', error);
      return null;
    }
  }

  async checkSyncStatus(): Promise<{ needsSync: boolean; lastSync: string | null }> {
    const lastSync = await this.getLastSyncTime();
    const needsSync = !lastSync || new Date().getTime() - new Date(lastSync).getTime() > 24 * 60 * 60 * 1000; // 24 hours
    
    return { needsSync, lastSync };
  }
}

export const cachedDataService = new CachedDataService();