import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>
        
        <Tabs defaultValue="registrations" className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="registrations">Registrations</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="panchayaths">Panchayaths</TabsTrigger>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
            <TabsTrigger value="utilities">Utilities</TabsTrigger>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
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