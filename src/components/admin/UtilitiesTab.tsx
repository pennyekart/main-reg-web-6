import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface Utility {
  id: string;
  name: string;
  url: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

const UtilitiesTab = () => {
  const [utilities, setUtilities] = useState<Utility[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingUtility, setEditingUtility] = useState<Utility | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: ''
  });

  useEffect(() => {
    fetchUtilities();
  }, []);

  const fetchUtilities = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('utilities')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Error fetching utilities');
      } else {
        setUtilities(data || []);
      }
    } catch (error) {
      toast.error('Error fetching utilities');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      description: ''
    });
    setEditingUtility(null);
  };

  const handleAddNew = () => {
    resetForm();
    setShowDialog(true);
  };

  const handleEdit = (utility: Utility) => {
    setFormData({
      name: utility.name,
      url: utility.url,
      description: utility.description
    });
    setEditingUtility(utility);
    setShowDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.url) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Add https:// if not present
    let url = formData.url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    const submitData = { ...formData, url };

    try {
      if (editingUtility) {
        const { error } = await supabase
          .from('utilities')
          .update(submitData)
          .eq('id', editingUtility.id);

        if (error) {
          toast.error('Error updating utility');
        } else {
          toast.success('Utility updated successfully');
          setShowDialog(false);
          fetchUtilities();
          resetForm();
        }
      } else {
        const { error } = await supabase
          .from('utilities')
          .insert(submitData);

        if (error) {
          toast.error('Error creating utility');
        } else {
          toast.success('Utility created successfully');
          setShowDialog(false);
          fetchUtilities();
          resetForm();
        }
      }
    } catch (error) {
      toast.error('Error saving utility');
    }
  };

  const toggleUtilityStatus = async (utility: Utility) => {
    try {
      const { error } = await supabase
        .from('utilities')
        .update({ is_active: !utility.is_active })
        .eq('id', utility.id);

      if (error) {
        toast.error('Error updating utility status');
      } else {
        toast.success('Utility status updated');
        fetchUtilities();
      }
    } catch (error) {
      toast.error('Error updating utility status');
    }
  };

  const deleteUtility = async (id: string) => {
    if (!confirm('Are you sure you want to delete this utility?')) return;

    try {
      const { error } = await supabase
        .from('utilities')
        .delete()
        .eq('id', id);

      if (error) {
        toast.error('Error deleting utility');
      } else {
        toast.success('Utility deleted successfully');
        fetchUtilities();
      }
    } catch (error) {
      toast.error('Error deleting utility');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Utilities Management</CardTitle>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={handleAddNew}>
                <Plus className="w-4 h-4 mr-2" />
                Add Utility
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingUtility ? 'Edit Utility' : 'Add New Utility'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="url">URL *</Label>
                  <Input
                    id="url"
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingUtility ? 'Update' : 'Create'}
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
                  <TableHead>Name</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {utilities.map((utility) => (
                  <TableRow key={utility.id}>
                    <TableCell className="font-medium">{utility.name}</TableCell>
                    <TableCell>
                      <a 
                        href={utility.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        <span className="max-w-xs truncate">{utility.url}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{utility.description || '-'}</TableCell>
                    <TableCell>
                      <Badge 
                        className={utility.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                        onClick={() => toggleUtilityStatus(utility)}
                        style={{ cursor: 'pointer' }}
                      >
                        {utility.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(utility)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteUtility(utility.id)}
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

export default UtilitiesTab;