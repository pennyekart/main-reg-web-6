import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('🔄 Sync function called with method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const EXTERNAL_SUPABASE_URL = "https://atwqmghvpyawsxeykgpb.supabase.co";
    const EXTERNAL_SUPABASE_ANON_KEY = Deno.env.get('EXTERNAL_SUPABASE_ANON_KEY')!;

    // Create clients
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const externalSupabase = createClient(EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_ANON_KEY);

    const { action } = await req.json().catch(() => ({ action: 'sync_all' }));
    console.log('📋 Sync action:', action);

    let result: any = {};

    if (action === 'sync_panchayaths' || action === 'sync_all') {
      console.log('🔄 Syncing panchayaths...');
      
      // Fetch from external database
      const { data: externalPanchayaths, error: externalError } = await externalSupabase
        .from('panchayaths')
        .select('*')
        .order('name');
      
      if (externalError) {
        console.error('❌ Error fetching external panchayaths:', externalError);
        throw externalError;
      }

      console.log(`📊 Found ${externalPanchayaths?.length || 0} panchayaths in external DB`);

      // Sync to local cache
      if (externalPanchayaths && externalPanchayaths.length > 0) {
        for (const panchayath of externalPanchayaths) {
          // Check if exists
          const { data: existing } = await supabase
            .from('cached_panchayaths')
            .select('id')
            .eq('external_id', panchayath.id)
            .single();

          if (existing) {
            // Update existing
            await supabase
              .from('cached_panchayaths')
              .update({
                name: panchayath.name,
                district: panchayath.district,
                last_synced_at: new Date().toISOString()
              })
              .eq('external_id', panchayath.id);
          } else {
            // Insert new
            await supabase
              .from('cached_panchayaths')
              .insert({
                id: panchayath.id, // Use external ID as primary key
                name: panchayath.name,
                district: panchayath.district,
                external_id: panchayath.id,
                last_synced_at: new Date().toISOString()
              });
          }
        }
      }

      result.panchayaths_synced = externalPanchayaths?.length || 0;
    }

    if (action === 'sync_agents' || action === 'sync_all') {
      console.log('🔄 Syncing agents...');
      
      // Try different table names for agents
      let externalAgents = null;
      const agentTables = ['agents', 'agent', 'pros', 'pro'];
      
      for (const tableName of agentTables) {
        try {
          const { data, error } = await externalSupabase
            .from(tableName)
            .select('*')
            .order('name');
          
          if (data && !error) {
            externalAgents = data;
            console.log(`✅ Found agents in table: ${tableName}`);
            break;
          }
        } catch (e) {
          console.log(`❌ Table ${tableName} not found`);
        }
      }

      if (externalAgents && externalAgents.length > 0) {
        console.log(`📊 Found ${externalAgents.length} agents in external DB`);
        
        for (const agent of externalAgents) {
          // Find matching panchayath
          let panchayathId = null;
          if (agent.panchayath_id) {
            const { data: panchayath } = await supabase
              .from('cached_panchayaths')
              .select('id')
              .eq('external_id', agent.panchayath_id)
              .single();
            panchayathId = panchayath?.id;
          }

          // Check if exists
          const { data: existing } = await supabase
            .from('cached_agents')
            .select('id')
            .eq('external_id', agent.id)
            .single();

          if (existing) {
            // Update existing
            await supabase
              .from('cached_agents')
              .update({
                name: agent.name,
                phone: agent.phone,
                panchayath_id: panchayathId,
                external_panchayath_id: agent.panchayath_id,
                external_ward_id: agent.ward_id,
                last_synced_at: new Date().toISOString()
              })
              .eq('external_id', agent.id);
          } else {
            // Insert new
            await supabase
              .from('cached_agents')
              .insert({
                name: agent.name,
                phone: agent.phone,
                panchayath_id: panchayathId,
                external_id: agent.id,
                external_panchayath_id: agent.panchayath_id,
                external_ward_id: agent.ward_id,
                last_synced_at: new Date().toISOString()
              });
          }
        }
      }

      result.agents_synced = externalAgents?.length || 0;
    }

    // Note: Wards don't exist in external DB, so we'll create some sample ones
    if (action === 'sync_wards' || action === 'sync_all') {
      console.log('🔄 Creating sample wards (external DB has no ward table)...');
      
      // Get all cached panchayaths
      const { data: panchayaths } = await supabase
        .from('cached_panchayaths')
        .select('id, name');

      let wardsCreated = 0;
      
      if (panchayaths) {
        for (const panchayath of panchayaths) {
          // Create sample wards for each panchayath
          const sampleWards = [
            `${panchayath.name} Ward 1`,
            `${panchayath.name} Ward 2`,
            `${panchayath.name} Ward 3`,
            `${panchayath.name} Central Ward`,
            `${panchayath.name} East Ward`,
            `${panchayath.name} West Ward`
          ];

          for (const wardName of sampleWards) {
            // Check if ward already exists
            const { data: existing } = await supabase
              .from('cached_wards')
              .select('id')
              .eq('name', wardName)
              .eq('panchayath_id', panchayath.id)
              .single();

            if (!existing) {
              await supabase
                .from('cached_wards')
                .insert({
                  name: wardName,
                  panchayath_id: panchayath.id,
                  external_panchayath_id: panchayath.id,
                  last_synced_at: new Date().toISOString()
                });
              wardsCreated++;
            }
          }
        }
      }

      result.wards_created = wardsCreated;
    }

    console.log('✅ Sync completed:', result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        ...result,
        synced_at: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Sync error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage, success: false }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});