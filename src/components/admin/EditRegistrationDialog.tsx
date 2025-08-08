import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface Registration {
  id: string;
  customer_id: string;
  full_name: string;
  mobile_number: string;
  address: string;
  ward: string;
  agent: string;
  category_id: string;
  preference_category_id?: string;
  panchayath_id?: string;
  fee: number;
  status: string;
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

interface Category {
  id: string;
  name_english: string;
  name_malayalam: string;
  actual_fee: number;
  offer_fee: number;
}

interface Panchayath {
  id: string;
  name: string;
  district: string;
}

interface EditRegistrationDialogProps {
  registration: Registration | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EditRegistrationDialog = ({ registration, isOpen, onClose, onSuccess }: EditRegistrationDialogProps) => {
  const [formData, setFormData] = useState({
    full_name: '',
    mobile_number: '',
    address: '',
    ward: '',
    agent: '',
    category_id: '',
    preference_category_id: '',
    panchayath_id: '',
    fee: 0
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [panchayaths, setPanchayaths] = useState<Panchayath[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (registration) {
      setFormData({
        full_name: registration.full_name,
        mobile_number: registration.mobile_number,
        address: registration.address,
        ward: registration.ward,
        agent: registration.agent || '',
        category_id: registration.category_id,
        preference_category_id: registration.preference_category_id || 'none',
        panchayath_id: registration.panchayath_id || 'none',
        fee: registration.fee
      });
    }
  }, [registration]);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      fetchPanchayaths();
    }
  }, [isOpen]);

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

  const handleCategoryChange = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (category) {
      setFormData(prev => ({
        ...prev,
        category_id: categoryId,
        fee: category.offer_fee > 0 ? category.offer_fee : category.actual_fee
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!registration) return;

    setLoading(true);
    try {
      const updateData = {
        full_name: formData.full_name,
        mobile_number: formData.mobile_number,
        address: formData.address,
        ward: formData.ward,
        agent: formData.agent || null,
        category_id: formData.category_id,
        preference_category_id: formData.preference_category_id === 'none' ? null : formData.preference_category_id || null,
        panchayath_id: formData.panchayath_id === 'none' ? null : formData.panchayath_id || null,
        fee: formData.fee
      };

      const { error } = await supabase
        .from('registrations')
        .update(updateData)
        .eq('id', registration.id);

      if (error) {
        toast.error('Error updating registration');
      } else {
        toast.success('Registration updated successfully');
        onSuccess();
        onClose();
      }
    } catch (error) {
      toast.error('Error updating registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Registration</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile_number">Mobile Number *</Label>
              <Input
                id="mobile_number"
                value={formData.mobile_number}
                onChange={(e) => setFormData(prev => ({ ...prev, mobile_number: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address *</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ward">Ward *</Label>
              <Input
                id="ward"
                value={formData.ward}
                onChange={(e) => setFormData(prev => ({ ...prev, ward: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent">Agent / P.R.O</Label>
              <Input
                id="agent"
                value={formData.agent}
                onChange={(e) => setFormData(prev => ({ ...prev, agent: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category_id} onValueChange={handleCategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name_english} / <span className="font-malayalam">{category.name_malayalam}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="panchayath">Panchayath</Label>
              <Select value={formData.panchayath_id} onValueChange={(value) => setFormData(prev => ({ ...prev, panchayath_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Panchayath" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {panchayaths.map((panchayath) => (
                    <SelectItem key={panchayath.id} value={panchayath.id}>
                      {panchayath.name} - {panchayath.district}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="preference_category">Preference Category</Label>
            <Select value={formData.preference_category_id} onValueChange={(value) => setFormData(prev => ({ ...prev, preference_category_id: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select Preference" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name_english} / <span className="font-malayalam">{category.name_malayalam}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fee">Fee (₹)</Label>
            <Input
              id="fee"
              type="number"
              value={formData.fee}
              onChange={(e) => setFormData(prev => ({ ...prev, fee: Number(e.target.value) }))}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Registration'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditRegistrationDialog;