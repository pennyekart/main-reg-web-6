import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ExpiringRegistrationsAlert from './ExpiringRegistrationsAlert';

interface ExpiringRegistration {
  id: string;
  name: string;
  phone: string;
  esep_id: string;
  category: string;
  location: string;
  created_at: string;
  days_remaining: number;
}

const NotificationBell = () => {
  const [expiringRegistrations, setExpiringRegistrations] = useState<ExpiringRegistration[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchExpiringRegistrations = async () => {
    try {
      setLoading(true);
      
      // Calculate the date 5 days from now
      const fiveDaysFromNow = new Date();
      fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);
      
      const { data: registrations, error } = await supabase
        .from('registrations')
        .select(`
          id,
          full_name,
          mobile_number,
          customer_id,
          address,
          created_at,
          expiry_date,
          categories!registrations_category_id_fkey(name_english)
        `)
        .eq('status', 'pending');

      if (error) {
        console.error('Error fetching expiring registrations:', error);
        return;
      }

      // Calculate days remaining for each registration
      const now = new Date();
      const expiringRegs: ExpiringRegistration[] = registrations
        .map(reg => {
          const expiryDate = new Date(reg.expiry_date);
          const diffTime = expiryDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          return {
            id: reg.id,
            name: reg.full_name,
            phone: reg.mobile_number,
            esep_id: reg.customer_id,
            category: reg.categories?.name_english || 'Unknown',
            location: reg.address,
            created_at: reg.created_at,
            days_remaining: diffDays
          };
        })
        .filter(reg => reg.days_remaining <= 5 && reg.days_remaining > 0)
        .sort((a, b) => a.days_remaining - b.days_remaining);

      setExpiringRegistrations(expiringRegs);
    } catch (error) {
      console.error('Error fetching expiring registrations:', error);
      toast({
        title: "Error",
        description: "Failed to fetch expiring registrations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpiringRegistrations();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('registrations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'registrations'
        },
        () => {
          fetchExpiringRegistrations();
        }
      )
      .subscribe();

    // Refresh every hour
    const interval = setInterval(fetchExpiringRegistrations, 60 * 60 * 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  // Show alert automatically when expiring registrations are found
  useEffect(() => {
    if (expiringRegistrations.length > 0) {
      // Auto-show alert after 2 seconds on load
      const timer = setTimeout(() => {
        setShowAlert(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [expiringRegistrations.length]);

  const handleBellClick = () => {
    if (expiringRegistrations.length > 0) {
      setShowAlert(true);
    }
  };

  return (
    <>
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBellClick}
          className="relative p-2"
          disabled={loading}
        >
          <Bell className="h-5 w-5" />
          {expiringRegistrations.length > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {expiringRegistrations.length}
            </Badge>
          )}
        </Button>
      </div>

      <ExpiringRegistrationsAlert
        open={showAlert}
        onOpenChange={setShowAlert}
        registrations={expiringRegistrations}
      />
    </>
  );
};

export default NotificationBell;