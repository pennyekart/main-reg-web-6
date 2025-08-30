import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from './useAdminAuth';

export interface Permission {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

export const useAdminPermissions = () => {
  const { currentAdminName, isAdminLoggedIn } = useAdminAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdminLoggedIn && currentAdminName) {
      fetchUserPermissions();
    } else {
      setPermissions([]);
      setLoading(false);
    }
  }, [isAdminLoggedIn, currentAdminName]);

  const fetchUserPermissions = async () => {
    try {
      // Super admin Eva has all permissions
      if (currentAdminName === 'eva') {
        const { data: allPermissions, error } = await supabase
          .from('admin_permissions')
          .select('name')
          .eq('is_active', true);
        
        if (error) throw error;
        setPermissions(allPermissions.map(p => p.name));
        setLoading(false);
        return;
      }

      // Get current user's permissions
      const { data: userPermissions, error } = await supabase
        .from('admin_user_permissions')
        .select(`
          admin_permissions:permission_id(name)
        `)
        .eq('admin_user_id', await getUserId());

      if (error) throw error;
      
      const permissionNames = userPermissions
        .map(up => up.admin_permissions?.name)
        .filter(Boolean) as string[];
      
      setPermissions(permissionNames);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const getUserId = async (): Promise<string> => {
    const { data: user, error } = await supabase
      .from('admin_users')
      .select('id')
      .eq('username', currentAdminName)
      .eq('is_active', true)
      .single();
    
    if (error || !user) throw new Error('User not found');
    return user.id;
  };

  const hasPermission = (permissionName: string): boolean => {
    return permissions.includes(permissionName);
  };

  const hasAnyPermission = (permissionNames: string[]): boolean => {
    return permissionNames.some(permission => hasPermission(permission));
  };

  return {
    permissions,
    loading,
    hasPermission,
    hasAnyPermission,
    isSuper: currentAdminName === 'eva'
  };
};