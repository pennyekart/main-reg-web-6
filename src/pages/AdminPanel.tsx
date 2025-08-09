import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
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
import NotificationBell from '@/components/admin/NotificationBell';

const AdminPanel = () => {
  const { isAdminLoggedIn, logout } = useAdminAuth();
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

  if (!isAdminLoggedIn) {
    return null;
  }

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
        
        <Tabs defaultValue="registrations" className="w-full">
          <div className="overflow-x-auto">
            <TabsList className="flex w-max sm:grid sm:w-full sm:grid-cols-4 lg:grid-cols-8 h-auto p-1">
              <TabsTrigger value="registrations" className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3">
                Registrations
              </TabsTrigger>
              <TabsTrigger value="categories" className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3">
                Categories
              </TabsTrigger>
              <TabsTrigger value="panchayaths" className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3">
                Panchayaths
              </TabsTrigger>
              <TabsTrigger value="announcements" className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3">
                Announcements
              </TabsTrigger>
              <TabsTrigger value="utilities" className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3">
                Utilities
              </TabsTrigger>
              <TabsTrigger value="accounts" className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3">
                Accounts
              </TabsTrigger>
              <TabsTrigger value="reports" className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3">
                Reports
              </TabsTrigger>
              <TabsTrigger value="admin-users" className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3">
                Admin Users
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="registrations">
            <RegistrationsTab />
          </TabsContent>
          
          <TabsContent value="categories">
            <CategoriesTab />
          </TabsContent>
          
          <TabsContent value="panchayaths">
            <PanchayathsTab />
          </TabsContent>
          
          <TabsContent value="announcements">
            <AnnouncementsTab />
          </TabsContent>
          
          <TabsContent value="utilities">
            <UtilitiesTab />
          </TabsContent>
          
          <TabsContent value="accounts">
            <AccountsTab />
          </TabsContent>
          
          <TabsContent value="reports">
            <ReportsTab />
          </TabsContent>
          
          <TabsContent value="admin-users">
            <AdminUsersTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;