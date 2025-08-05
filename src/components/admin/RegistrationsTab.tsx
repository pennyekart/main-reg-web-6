import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, FileDown, Edit, Trash2, Check, X, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Registration {
  id: string;
  customer_id: string;
  full_name: string;
  mobile_number: string;
  address: string;
  ward: string;
  agent: string;
  status: string;
  fee: number;
  created_at: string;
  approved_date: string;
  approved_by: string;
  expiry_date: string;
  categories: {
    name_english: string;
    name_malayalam: string;
  };
  preference_categories?: {
    name_english: string;
    name_malayalam: string;
  };
  panchayaths?: {
    name: string;
    district: string;
  };
}

const RegistrationsTab = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [panchayaths, setPanchayaths] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [panchayathFilter, setPanchayathFilter] = useState('all');

  useEffect(() => {
    fetchRegistrations();
    fetchCategories();
    fetchPanchayaths();
  }, []);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          *,
          categories!registrations_category_id_fkey (name_english, name_malayalam),
          preference_categories:categories!registrations_preference_category_id_fkey (name_english, name_malayalam),
          panchayaths (name, district)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching registrations:', error);
        toast.error('Error fetching registrations');
      } else {
        console.log('Fetched registrations:', data);
        setRegistrations(data as unknown as Registration[] || []);
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast.error('Error fetching registrations');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name_english');
    
    if (data) setCategories(data);
  };

  const fetchPanchayaths = async () => {
    const { data } = await supabase
      .from('panchayaths')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (data) setPanchayaths(data);
  };

  const updateRegistrationStatus = async (id: string, status: string) => {
    try {
      const updateData: any = { 
        status,
        ...(status === 'approved' && {
          approved_date: new Date().toISOString(),
          approved_by: 'eva' // Admin username
        })
      };

      const { error } = await supabase
        .from('registrations')
        .update(updateData)
        .eq('id', id);

      if (error) {
        toast.error('Error updating status');
      } else {
        toast.success(`Registration ${status} successfully`);
        fetchRegistrations();
      }
    } catch (error) {
      toast.error('Error updating status');
    }
  };

  const deleteRegistration = async (id: string) => {
    if (!confirm('Are you sure you want to delete this registration?')) return;

    try {
      const { error } = await supabase
        .from('registrations')
        .delete()
        .eq('id', id);

      if (error) {
        toast.error('Error deleting registration');
      } else {
        toast.success('Registration deleted successfully');
        fetchRegistrations();
      }
    } catch (error) {
      toast.error('Error deleting registration');
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const filteredRegistrations = registrations.filter(reg => {
    const matchesSearch = searchQuery === '' || 
      reg.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.mobile_number.includes(searchQuery) ||
      reg.customer_id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || reg.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || reg.categories?.name_english === categoryFilter;
    const matchesPanchayath = panchayathFilter === 'all' || reg.panchayaths?.name === panchayathFilter;

    return matchesSearch && matchesStatus && matchesCategory && matchesPanchayath;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registration Management</CardTitle>
        <div className="flex flex-wrap gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            <Input
              placeholder="Search by name, mobile, or customer ID"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.name_english}>
                  {cat.name_english}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={panchayathFilter} onValueChange={setPanchayathFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by panchayath" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Panchayaths</SelectItem>
              {panchayaths.map((pan) => (
                <SelectItem key={pan.id} value={pan.name}>
                  {pan.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline">
            <FileDown className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Preference</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Reg. Date</TableHead>
                  <TableHead>Approved Date</TableHead>
                  <TableHead>Approved By</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistrations.map((reg) => (
                  <TableRow key={reg.id}>
                    <TableCell className="font-medium">{reg.customer_id}</TableCell>
                    <TableCell>{reg.full_name}</TableCell>
                    <TableCell>{reg.mobile_number}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{reg.categories?.name_english}</div>
                        <div className="text-muted-foreground">{reg.categories?.name_malayalam}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {reg.preference_categories ? (
                        <div className="text-sm">
                          <div>{reg.preference_categories.name_english}</div>
                          <div className="text-muted-foreground">{reg.preference_categories.name_malayalam}</div>
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(reg.status)}>
                        {reg.status}
                      </Badge>
                    </TableCell>
                    <TableCell>₹{reg.fee}</TableCell>
                    <TableCell>
                      {format(new Date(reg.created_at), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>
                      {reg.approved_date ? format(new Date(reg.approved_date), 'dd/MM/yyyy') : '-'}
                    </TableCell>
                    <TableCell>{reg.approved_by || '-'}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{format(new Date(reg.expiry_date), 'dd/MM/yyyy')}</div>
                        <div className="text-muted-foreground">
                          {Math.ceil((new Date(reg.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {reg.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateRegistrationStatus(reg.id, 'approved')}
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateRegistrationStatus(reg.id, 'rejected')}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteRegistration(reg.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RegistrationsTab;
