import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

interface AdminAuthContextType {
  isAdminLoggedIn: boolean;
  currentAdminName: string | null;
  login: (username: string, password: string) => boolean;
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

  const login = (username: string, password: string): boolean => {
    if (username === 'eva' && password === '123') {
      setIsAdminLoggedIn(true);
      setCurrentAdminName(username);
      localStorage.setItem('adminAuth', 'true');
      localStorage.setItem('adminName', username);
      return true;
    }
    return false;
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