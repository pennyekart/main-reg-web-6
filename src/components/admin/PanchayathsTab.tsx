import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Panchayath {
  id: string;
  name: string;
  district: string;
  is_active: boolean;
  created_at: string;
}

const PanchayathsTab = () => {
  const [panchayaths, setPanchayaths] = useState<Panchayath[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingPanchayath, setEditingPanchayath] = useState<Panchayath | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    district: ''
  });

  useEffect(() => {
    fetchPanchayaths();
  }, []);

  const fetchPanchayaths = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('panchayaths')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Error fetching panchayaths');
      } else {
        setPanchayaths(data || []);
      }
    } catch (error) {
      toast.error('Error fetching panchayaths');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      district: ''
    });
    setEditingPanchayath(null);
  };

  const handleAddNew = () => {
    resetForm();
    setShowDialog(true);
  };

  const handleEdit = (panchayath: Panchayath) => {
    setFormData({
      name: panchayath.name,
      district: panchayath.district
    });
    setEditingPanchayath(panchayath);
    setShowDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.district) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (editingPanchayath) {
        const { error } = await supabase
          .from('panchayaths')
          .update(formData)
          .eq('id', editingPanchayath.id);

        if (error) {
          toast.error('Error updating panchayath');
        } else {
          toast.success('Panchayath updated successfully');
          setShowDialog(false);
          fetchPanchayaths();
          resetForm();
        }
      } else {
        const { error } = await supabase
          .from('panchayaths')
          .insert(formData);

        if (error) {
          toast.error('Error creating panchayath');
        } else {
          toast.success('Panchayath created successfully');
          setShowDialog(false);
          fetchPanchayaths();
          resetForm();
        }
      }
    } catch (error) {
      toast.error('Error saving panchayath');
    }
  };

  const togglePanchayathStatus = async (panchayath: Panchayath) => {
    try {
      const { error } = await supabase
        .from('panchayaths')
        .update({ is_active: !panchayath.is_active })
        .eq('id', panchayath.id);

      if (error) {
        toast.error('Error updating panchayath status');
      } else {
        toast.success('Panchayath status updated');
        fetchPanchayaths();
      }
    } catch (error) {
      toast.error('Error updating panchayath status');
    }
  };

  const deletePanchayath = async (id: string) => {
    if (!confirm('Are you sure you want to delete this panchayath?')) return;

    try {
      const { error } = await supabase
        .from('panchayaths')
        .delete()
        .eq('id', id);

      if (error) {
        toast.error('Error deleting panchayath');
      } else {
        toast.success('Panchayath deleted successfully');
        fetchPanchayaths();
      }
    } catch (error) {
      toast.error('Error deleting panchayath');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Panchayaths Management</CardTitle>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={handleAddNew}>
                <Plus className="w-4 h-4 mr-2" />
                Add Panchayath
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" aria-describedby="panchayath-form-description">
              <DialogHeader>
                <DialogTitle>
                  {editingPanchayath ? 'Edit Panchayath' : 'Add New Panchayath'}
                </DialogTitle>
              </DialogHeader>
              <div id="panchayath-form-description" className="sr-only">
                Form to {editingPanchayath ? 'edit an existing' : 'add a new'} panchayath with name and district information.
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Panchayath Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="district">District Name *</Label>
                  <Input
                    id="district"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingPanchayath ? 'Update' : 'Create'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
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
                  <TableHead>Panchayath Name</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {panchayaths.map((panchayath) => (
                  <TableRow key={panchayath.id}>
                    <TableCell className="font-medium">{panchayath.name}</TableCell>
                    <TableCell>{panchayath.district}</TableCell>
                    <TableCell>
                      <Badge 
                        className={panchayath.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                        onClick={() => togglePanchayathStatus(panchayath)}
                        style={{ cursor: 'pointer' }}
                      >
                        {panchayath.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(panchayath)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deletePanchayath(panchayath.id)}
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

export default PanchayathsTab;