import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navigation from '@/components/Navigation';
import RegistrationsTab from '@/components/admin/RegistrationsTab';
import CategoriesTab from '@/components/admin/CategoriesTab';
import PanchayathsTab from '@/components/admin/PanchayathsTab';
import AnnouncementsTab from '@/components/admin/AnnouncementsTab';
import UtilitiesTab from '@/components/admin/UtilitiesTab';
import AccountsTab from '@/components/admin/AccountsTab';
import ReportsTab from '@/components/admin/ReportsTab';
import AdminUsersTab from '@/components/admin/AdminUsersTab';
import PermissionManagerTab from '@/components/admin/PermissionManagerTab';
import NotificationBell from '@/components/admin/NotificationBell';

const AdminPanel = () => {
  const { isAdminLoggedIn, logout } = useAdminAuth();
  const { hasPermission, hasAnyPermission, isSuper, loading } = useAdminPermissions();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdminLoggedIn) {
      navigate('/admin/login');
    }
  }, [isAdminLoggedIn, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  if (!isAdminLoggedIn || loading) {
    return null;
  }

  // Define tab permissions mapping
  const tabPermissions = {
    registrations: ['users_read', 'users_write', 'manage_registrations'],
    categories: ['categories_read', 'categories_write', 'manage_categories'],
    panchayaths: ['panchayaths_read', 'panchayaths_write'],
    announcements: ['announcements_read', 'announcements_write'],
    utilities: ['utilities_read', 'utilities_write', 'manage_utilities'],
    accounts: ['accounts_read', 'accounts_write'],
    reports: ['reports_read', 'manage_reports'],
    'admin-users': ['admin_users_read', 'admin_users_write', 'manage_users'],
    permissions: [] // Only super admin can see this
  };

  // Filter tabs based on permissions
  const availableTabs = [
    { id: 'registrations', label: 'Registrations', component: <RegistrationsTab /> },
    { id: 'categories', label: 'Categories', component: <CategoriesTab /> },
    { id: 'panchayaths', label: 'Panchayaths', component: <PanchayathsTab /> },
    { id: 'announcements', label: 'Announcements', component: <AnnouncementsTab /> },
    { id: 'utilities', label: 'Utilities', component: <UtilitiesTab /> },
    { id: 'accounts', label: 'Accounts', component: <AccountsTab /> },
    { id: 'reports', label: 'Reports', component: <ReportsTab /> },
    { id: 'admin-users', label: 'Admin Users', component: <AdminUsersTab /> },
    { id: 'permissions', label: 'Permissions', component: <PermissionManagerTab /> }
  ].filter(tab => {
    if (isSuper) return true; // Super admin sees everything
    if (tab.id === 'permissions') return false; // Only super admin can manage permissions
    return hasAnyPermission(tabPermissions[tab.id as keyof typeof tabPermissions]);
  });

  // Get default tab (first available tab)
  const defaultTab = availableTabs[0]?.id || 'registrations';

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto py-4 px-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Admin Panel</h1>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button onClick={handleLogout} variant="outline" size="sm">
              Logout
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue={defaultTab} className="w-full">
          <div className="overflow-x-auto">
            <TabsList className={`flex w-max sm:grid sm:w-full h-auto p-1`} 
              style={{ gridTemplateColumns: `repeat(${availableTabs.length}, 1fr)` }}>
              {availableTabs.map((tab) => (
                <TabsTrigger 
                  key={tab.id}
                  value={tab.id} 
                  className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          
          {availableTabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id}>
              {tab.component}
            </TabsContent>
          ))}

          {availableTabs.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No permissions assigned. Contact Super Admin Eva.</p>
            </div>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;