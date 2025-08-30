import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminAuthContextType {
  isAdminLoggedIn: boolean;
  currentAdminName: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [currentAdminName, setCurrentAdminName] = useState<string | null>(null);

  useEffect(() => {
    const savedAuth = localStorage.getItem('adminAuth');
    const savedAdminName = localStorage.getItem('adminName');
    if (savedAuth === 'true' && savedAdminName) {
      setIsAdminLoggedIn(true);
      setCurrentAdminName(savedAdminName);
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const { data: adminUser, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('username', username)
        .eq('is_active', true)
        .single();

      if (error || !adminUser) {
        return false;
      }

      // For now, using simple password comparison - in production, use bcrypt
      if (adminUser.password_hash === password) {
        setIsAdminLoggedIn(true);
        setCurrentAdminName(username);
        localStorage.setItem('adminAuth', 'true');
        localStorage.setItem('adminName', username);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setIsAdminLoggedIn(false);
    setCurrentAdminName(null);
    localStorage.removeItem('adminAuth');
    localStorage.removeItem('adminName');
  };

  return (
    <AdminAuthContext.Provider value={{ isAdminLoggedIn, currentAdminName, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};