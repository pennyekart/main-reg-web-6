import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { externalDbService, ExternalPanchayath, ExternalWard, ExternalAgent } from '@/services/externalDatabase';
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
  const [panchayaths, setPanchayaths] = useState<ExternalPanchayath[]>([]);
  const [wards, setWards] = useState<ExternalWard[]>([]);
  const [agents, setAgents] = useState<ExternalAgent[]>([]);
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
      console.log('🔄 Fetching panchayaths...');
      const panchayathData = await externalDbService.getPanchayaths();
      console.log('✅ Panchayaths fetched:', panchayathData);
      setPanchayaths(panchayathData);
    } catch (error) {
      console.error('❌ Error fetching panchayaths:', error);
      toast.error('Failed to load panchayaths. Please try again.');
    }
  };

  const fetchWards = async (panchayathId: string) => {
    try {
      console.log('🔄 Fetching wards for panchayath:', panchayathId);
      
      // First test the external database connection
      const schemaResult = await externalDbService.exploreSchema();
      console.log('📊 External DB Schema:', schemaResult);
      
      const wardData = await externalDbService.getWardsByPanchayath(panchayathId);
      console.log('✅ Wards fetched:', wardData);
      setWards(wardData);
    } catch (error) {
      console.error('❌ Error fetching wards:', error);
      console.error('❌ Full error details:', JSON.stringify(error, null, 2));
      toast.error('Failed to load wards. Please try again.');
    }
  };

  const fetchAgents = async () => {
    try {
      console.log('🔄 Fetching agents...');
      const agentData = await externalDbService.getAgents();
      console.log('✅ Agents fetched:', agentData);
      setAgents(agentData);
    } catch (error) {
      console.error('❌ Error fetching agents:', error);
      // Don't show error toast for agents as it's optional
    }
  };

  const fetchAgentsByWard = async (wardId: string) => {
    try {
      console.log('🔄 Fetching agents for ward:', wardId);
      const agentData = await externalDbService.getAgents();
      // Filter agents by ward_id
      const filteredAgents = agentData.filter(agent => agent.ward_id === wardId);
      console.log('✅ Ward agents fetched:', filteredAgents);
      setAgents(filteredAgents);
    } catch (error) {
      console.error('❌ Error fetching ward agents:', error);
      setAgents([]);
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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.mobileNumber || !formData.address || !formData.panchayathId || !formData.wardId) {
      toast.error('Please fill in all required fields');
      return;
    }
    setLoading(true);
    try {
      // Get ward name from selected ward
      const selectedWard = wards.find(w => w.id === formData.wardId);
      const wardName = selectedWard?.name || formData.wardId;

      const registrationData = {
        full_name: formData.fullName,
        mobile_number: formData.mobileNumber,
        address: formData.address,
        panchayath_id: formData.panchayathId || null,
        ward: wardName, // Use ward name for the registration
        agent: formData.agent === 'none' ? null : formData.agent || null,
        category_id: category.id,
        preference_category_id: formData.preferenceId || null,
        fee: category.offer_fee > 0 ? category.offer_fee : category.actual_fee,
        customer_id: '' // Will be generated by trigger
      };
      const {
        data,
        error
      } = await supabase.from('registrations').insert(registrationData).select().single();
      if (error) {
        if (error.code === '23505') {
          toast.error('This mobile number is already registered');
        } else {
          toast.error('Registration failed. Please try again.');
        }
      } else {
        setGeneratedId(data.customer_id);
        setShowSuccess(true);
      }
    } catch (error) {
      toast.error('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  const handleSuccessClose = () => {
    setShowSuccess(false);
    onSuccess();
  };
  return <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name * / പൂർണ്ണ നാമം *</Label>
          <Input id="fullName" value={formData.fullName} onChange={e => setFormData({
          ...formData,
          fullName: e.target.value
        })} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mobileNumber">Mobile Number * / മൊബൈൽ നമ്പർ *</Label>
          <Input id="mobileNumber" type="tel" value={formData.mobileNumber} onChange={e => setFormData({
          ...formData,
          mobileNumber: e.target.value
        })} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address * / വിലാസം *</Label>
          <Textarea id="address" value={formData.address} onChange={e => setFormData({
          ...formData,
          address: e.target.value
        })} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="panchayath">Panchayath * / പഞ്ചായത്ത് *</Label>
          <Select value={formData.panchayathId} onValueChange={value => setFormData({
          ...formData,
          panchayathId: value
        })} required>
            <SelectTrigger>
              <SelectValue placeholder="Select Panchayath" />
            </SelectTrigger>
            <SelectContent>
              {panchayaths.map(panchayath => <SelectItem key={panchayath.id} value={panchayath.id}>
                  {panchayath.name} - {panchayath.district}
                </SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ward">Ward * / വാർഡ് *</Label>
          <Select value={formData.wardId} onValueChange={value => setFormData({
            ...formData,
            wardId: value
          })} required>
            <SelectTrigger>
              <SelectValue placeholder="Select Ward" />
            </SelectTrigger>
            <SelectContent>
              {wards.map(ward => <SelectItem key={ward.id} value={ward.id}>
                  {ward.name}
                </SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="agent">Agent / P.R.O / ഏജന്റ് / പി.ആർ.ഒ (optional)</Label>
          <Select value={formData.agent} onValueChange={value => setFormData({
            ...formData,
            agent: value
          })}>
            <SelectTrigger>
              <SelectValue placeholder="Select Agent (Optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Agent</SelectItem>
              {agents.map(agent => <SelectItem key={agent.id} value={agent.name}>
                  {agent.name} {agent.phone ? `- ${agent.phone}` : ''}
                </SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {category.name_english === 'Job Card (Special)' && <div className="space-y-2">
            <Label htmlFor="preference">Preference Category</Label>
            <Select value={formData.preferenceId} onValueChange={value => setFormData({
          ...formData,
          preferenceId: value
        })}>
              <SelectTrigger>
                <SelectValue placeholder="Select Preference" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>
                    {cat.name_english} / {cat.name_malayalam}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>}

        <Button type="submit" disabled={loading} className="w-full" size="lg">
          {loading ? 'Submitting...' : 'Submit Registration'}
        </Button>
      </form>

      <Dialog open={showSuccess} onOpenChange={handleSuccessClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">Congratulations!</DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4">
            <p className="text-lg">നിങ്ങളുടെ രജിസ്ട്രേഷൻ വിജയകരമായി സമർപ്പിച്ചു!</p>
            <div className="bg-primary/10 border border-primary rounded-lg p-4">
              <p className="font-semibold">Your Customer ID:</p>
              <p className="text-2xl font-bold text-primary">{generatedId}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Please save this ID for future reference. You can use it to check your registration status.
            </p>
            <Button onClick={handleSuccessClose} className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>;
};
export default RegistrationForm;