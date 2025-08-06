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
          <Button onClick={handleLogout} variant="outline" size="sm">
            Logout
          </Button>
        </div>
        
        <Tabs defaultValue="registrations" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1">
            <TabsTrigger value="registrations" className="text-xs sm:text-sm">Registrations</TabsTrigger>
            <TabsTrigger value="categories" className="text-xs sm:text-sm">Categories</TabsTrigger>
            <TabsTrigger value="panchayaths" className="text-xs sm:text-sm">Panchayaths</TabsTrigger>
            <TabsTrigger value="announcements" className="text-xs sm:text-sm">Announcements</TabsTrigger>
            <TabsTrigger value="utilities" className="text-xs sm:text-sm">Utilities</TabsTrigger>
            <TabsTrigger value="accounts" className="text-xs sm:text-sm">Accounts</TabsTrigger>
            <TabsTrigger value="reports" className="text-xs sm:text-sm">Reports</TabsTrigger>
          </TabsList>
          
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
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;