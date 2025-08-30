import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Search, Plus, Shield, UserCheck } from 'lucide-react';

interface AdminUser {
  id: string;
  username: string;
  full_name: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

interface UserPermission {
  id: string;
  admin_user_id: string;
  permission_id: string;
  granted_at: string;
  granted_by: string;
  admin_users: AdminUser;
  admin_permissions: Permission;
}

const PermissionManagerTab = () => {
  const { toast } = useToast();
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedPermission, setSelectedPermission] = useState<string>('');
  const [isGrantDialogOpen, setIsGrantDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch admin users
      const { data: users, error: usersError } = await supabase
        .from('admin_users')
        .select('*')
        .order('full_name');

      if (usersError) throw usersError;
      setAdminUsers(users || []);

      // Fetch permissions
      const { data: perms, error: permsError } = await supabase
        .from('admin_permissions')
        .select('*')
        .order('name');

      if (permsError) throw permsError;
      setPermissions(perms || []);

      // Fetch user permissions with related data
      const { data: userPerms, error: userPermsError } = await supabase
        .from('admin_user_permissions')
        .select(`
          *,
          admin_users:admin_user_id(*),
          admin_permissions:permission_id(*)
        `)
        .order('granted_at', { ascending: false });

      if (userPermsError) throw userPermsError;
      setUserPermissions(userPerms || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load permission data"
      });
    }
  };

  const grantPermission = async () => {
    if (!selectedUser || !selectedPermission) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select both user and permission"
      });
      return;
    }

    setLoading(true);
    try {
      // Check if permission already exists
      const existing = userPermissions.find(
        up => up.admin_user_id === selectedUser && up.permission_id === selectedPermission
      );

      if (existing) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "User already has this permission"
        });
        return;
      }

      const { error } = await supabase
        .from('admin_user_permissions')
        .insert({
          admin_user_id: selectedUser,
          permission_id: selectedPermission,
          granted_by: 'eva' // Super admin Eva
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Permission granted successfully"
      });

      setIsGrantDialogOpen(false);
      setSelectedUser('');
      setSelectedPermission('');
      fetchData();
    } catch (error) {
      console.error('Error granting permission:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to grant permission"
      });
    } finally {
      setLoading(false);
    }
  };

  const revokePermission = async (userPermissionId: string) => {
    try {
      const { error } = await supabase
        .from('admin_user_permissions')
        .delete()
        .eq('id', userPermissionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Permission revoked successfully"
      });

      fetchData();
    } catch (error) {
      console.error('Error revoking permission:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to revoke permission"
      });
    }
  };

  const filteredUserPermissions = userPermissions.filter(up =>
    up.admin_users.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    up.admin_users.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    up.admin_permissions.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Permission Manager</h2>
          <p className="text-muted-foreground">
            Manage admin user permissions granted by Super Admin Eva
          </p>
        </div>
        <Dialog open={isGrantDialogOpen} onOpenChange={setIsGrantDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Grant Permission
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Grant Permission</DialogTitle>
              <DialogDescription>
                Select a user and permission to grant access.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="user">Admin User</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select admin user" />
                  </SelectTrigger>
                  <SelectContent>
                    {adminUsers.filter(user => user.is_active).map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name} ({user.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="permission">Permission</Label>
                <Select value={selectedPermission} onValueChange={setSelectedPermission}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select permission" />
                  </SelectTrigger>
                  <SelectContent>
                    {permissions.filter(perm => perm.is_active).map((permission) => (
                      <SelectItem key={permission.id} value={permission.id}>
                        {permission.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsGrantDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={grantPermission} disabled={loading}>
                {loading ? 'Granting...' : 'Grant Permission'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            User Permissions
          </CardTitle>
          <CardDescription>
            View and manage permissions for admin users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users or permissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-[300px]"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admin User</TableHead>
                <TableHead>Permission</TableHead>
                <TableHead>Granted By</TableHead>
                <TableHead>Granted At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUserPermissions.map((userPermission) => (
                <TableRow key={userPermission.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{userPermission.admin_users.full_name}</div>
                      <div className="text-sm text-muted-foreground">
                        @{userPermission.admin_users.username}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {userPermission.admin_permissions.name}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <UserCheck className="h-4 w-4" />
                      {userPermission.granted_by || 'eva'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(userPermission.granted_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => revokePermission(userPermission.id)}
                    >
                      Revoke
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUserPermissions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    No permissions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PermissionManagerTab;