import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cachedDataService } from '@/services/cachedDataService';
import type { CachedPanchayath, CachedWard, CachedAgent } from '@/services/cachedDataService';

interface Category {
  id: string;
  name_english: string;
  name_malayalam: string;
  description: string;
  actual_fee: number;
  offer_fee: number;
}

interface Panchayath {
  id: string;
  name: string;
  district: string;
}

interface RegistrationFormProps {
  category: Category;
  onSuccess: () => void;
}

const RegistrationForm = ({
  category,
  onSuccess
}: RegistrationFormProps) => {
  const [formData, setFormData] = useState({
    fullName: '',
    mobileNumber: '',
    address: '',
    panchayathId: '',
    wardId: '',
    agent: '',
    preferenceId: ''
  });

  const [panchayaths, setPanchayaths] = useState<CachedPanchayath[]>([]);
  const [wards, setWards] = useState<CachedWard[]>([]);
  const [agents, setAgents] = useState<CachedAgent[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [generatedId, setGeneratedId] = useState('');

  useEffect(() => {
    fetchPanchayaths();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (formData.panchayathId) {
      fetchWards(formData.panchayathId);
    } else {
      setWards([]);
      setAgents([]);
      setFormData(prev => ({ ...prev, wardId: '', agent: '' }));
    }
  }, [formData.panchayathId]);

  useEffect(() => {
    if (formData.wardId) {
      fetchAgentsByWard(formData.wardId);
    } else {
      setAgents([]);
      setFormData(prev => ({ ...prev, agent: '' }));
    }
  }, [formData.wardId]);

  const fetchPanchayaths = async () => {
    try {
      console.log('🔄 Fetching cached panchayaths...');
      
      // Check if sync is needed
      const { needsSync } = await cachedDataService.checkSyncStatus();
      
      if (needsSync) {
        console.log('📥 Syncing data from external database...');
        try {
          await cachedDataService.syncData('sync_all');
        } catch (syncError) {
          console.warn('⚠️ Sync failed, using existing cached data:', syncError);
        }
      }
      
      const panchayathData = await cachedDataService.getPanchayaths();
      console.log('✅ Cached panchayaths fetched:', panchayathData);
      setPanchayaths(panchayathData);
    } catch (error) {
      console.error('❌ Error fetching panchayaths:', error);
      toast.error('Failed to load panchayaths. Please try again.');
    }
  };

  const fetchWards = async (panchayathId: string) => {
    try {
      console.log('🔄 Fetching cached wards for panchayath:', panchayathId);
      
      const wardData = await cachedDataService.getWardsByPanchayath(panchayathId);
      console.log('✅ Cached wards fetched:', wardData);
      setWards(wardData);
    } catch (error) {
      console.error('❌ Error fetching wards:', error);
      setWards([]);
      toast.error('Failed to load wards. Please try again.');
    }
  };

  const fetchAgentsByWard = async (wardId: string) => {
    try {
      console.log('🔄 Fetching cached agents for ward:', wardId);
      
      const agentData = await cachedDataService.getAgentsByWard(wardId);
      console.log('✅ Cached agents fetched:', agentData);
      setAgents(agentData);
    } catch (error) {
      console.error('❌ Error fetching agents:', error);
      setAgents([]);
      toast.error('Failed to load agents. Please try again.');
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name_english');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories. Please try again.');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Basic validation
      if (!formData.fullName || !formData.mobileNumber || !formData.address || !formData.wardId) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (formData.mobileNumber.length !== 10) {
        toast.error('Mobile number must be 10 digits');
        return;
      }

      // Find selected panchayath
      const selectedPanchayath = panchayaths.find(p => p.id === formData.panchayathId);
      
      // Find selected ward
      const selectedWard = wards.find(w => w.id === formData.wardId);

      // Prepare registration data (customer_id will be generated by trigger)
      const registrationData = {
        full_name: formData.fullName,
        mobile_number: formData.mobileNumber,
        address: formData.address,
        panchayath_id: formData.panchayathId,
        ward: selectedWard?.name || '',
        agent: formData.agent,
        category_id: category.id,
        preference_category_id: formData.preferenceId || null,
        fee: category.offer_fee || category.actual_fee
      };

      console.log('📝 Submitting registration:', registrationData);

      const { data, error } = await (supabase as any)
        .from('registrations')
        .insert([registrationData])
        .select()
        .single();

      if (error) {
        if (error.code === '23505' && error.message.includes('mobile_number')) {
          toast.error('This mobile number is already registered. Please use a different number or contact support.');
          return;
        }
        throw error;
      }

      console.log('✅ Registration successful:', data);
      setGeneratedId(data.customer_id);
      setShowSuccess(true);
      
      toast.success('Registration submitted successfully!');

    } catch (error) {
      console.error('❌ Registration error:', error);
      toast.error('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    onSuccess();
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="fullName">Full Name *</Label>
          <Input
            id="fullName"
            value={formData.fullName}
            onChange={(e) => handleInputChange('fullName', e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="mobileNumber">Mobile Number *</Label>
          <Input
            id="mobileNumber"
            type="tel"
            maxLength={10}
            value={formData.mobileNumber}
            onChange={(e) => handleInputChange('mobileNumber', e.target.value.replace(/\D/g, ''))}
            required
          />
        </div>

        <div>
          <Label htmlFor="address">Address *</Label>
          <Textarea
            id="address"
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            required
          />
        </div>

        <div>
          <Label>Panchayath *</Label>
          <Select 
            value={formData.panchayathId} 
            onValueChange={(value) => handleInputChange('panchayathId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Panchayath" />
            </SelectTrigger>
            <SelectContent>
              {panchayaths.map((panchayath) => (
                <SelectItem key={panchayath.id} value={panchayath.id}>
                  {panchayath.name} {panchayath.district && `(${panchayath.district})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Ward *</Label>
          <Select 
            value={formData.wardId} 
            onValueChange={(value) => handleInputChange('wardId', value)}
            disabled={!formData.panchayathId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Ward" />
            </SelectTrigger>
            <SelectContent>
              {wards.map((ward) => (
                <SelectItem key={ward.id} value={ward.id}>
                  {ward.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Agent (Optional)</Label>
          <Select 
            value={formData.agent} 
            onValueChange={(value) => handleInputChange('agent', value)}
            disabled={!formData.wardId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Agent" />
            </SelectTrigger>
            <SelectContent>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.name}>
                  {agent.name} {agent.phone && `- ${agent.phone}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {category.name_english.toLowerCase().includes('job card') && (
          <div>
            <Label>Preference Category (Optional)</Label>
            <Select 
              value={formData.preferenceId} 
              onValueChange={(value) => handleInputChange('preferenceId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {categories
                  .filter(cat => cat.id !== category.id)
                  .map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name_english}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Processing...' : 'Submit Registration'}
        </Button>
      </form>

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registration Successful!</DialogTitle>
          </DialogHeader>
          <div className="text-center p-4">
            <p className="mb-4">Your registration has been submitted successfully.</p>
            <div className="bg-muted p-4 rounded-lg">
              <p className="font-semibold">Your Customer ID:</p>
              <p className="text-lg font-mono">{generatedId}</p>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Please save this ID for future reference.
            </p>
            <Button onClick={handleSuccessClose} className="mt-4">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RegistrationForm;