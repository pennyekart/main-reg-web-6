import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CashAccount {
  id: string;
  name: string;
  balance: number;
  is_active: boolean;
}

const AccountsTab = () => {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<CashAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch verification-related cash amounts
  const [verificationAmounts, setVerificationAmounts] = useState({
    totalVerificationFees: 0,
    mainCashFromVerifications: 0
  });

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch accounts
      const { data: accountsData, error: accountsError } = await supabase
        .from('cash_accounts')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (accountsError) throw accountsError;
      setAccounts(accountsData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch data"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Automatic cash update based on verified registrations
  const updateCashFromVerifications = async () => {
    try {
      // Get all verified registrations with fees
      const { data: verifiedRegistrations, error } = await supabase
        .from('registrations')
        .select(`
          fee,
          registration_verifications!inner (
            verified,
            verified_at
          )
        `)
        .eq('registration_verifications.verified', true)
        .not('registration_verifications.verified_at', 'is', null);

      if (error) throw error;

      const totalVerifiedAmount = (verifiedRegistrations || [])
        .reduce((sum, reg) => sum + (reg.fee || 0), 0);

      // Find main cash account and update its balance
      const mainCashAccount = accounts.find(acc => 
        acc.name.toLowerCase().includes('main') || 
        acc.name.toLowerCase().includes('cash')
      );

      if (mainCashAccount && totalVerifiedAmount !== mainCashAccount.balance) {
        await supabase
          .from('cash_accounts')
          .update({ balance: totalVerifiedAmount })
          .eq('id', mainCashAccount.id);

        // Refresh data
        fetchData();
      }

    } catch (error) {
      console.error('Error updating cash from verifications:', error);
    }
  };

  const fetchVerificationAmounts = async () => {
    try {
      // Get total fees from verified registrations
      const { data: verifiedRegistrations, error: verificationError } = await supabase
        .from('registrations')
        .select(`
          fee,
          registration_verifications!inner (
            verified,
            verified_at
          )
        `)
        .eq('registration_verifications.verified', true)
        .not('registration_verifications.verified_at', 'is', null);

      if (verificationError) throw verificationError;

      const totalVerificationFees = (verifiedRegistrations || [])
        .reduce((sum, reg) => sum + (reg.fee || 0), 0);

      // Find main cash account
      const mainCashAccount = accounts.find(acc => 
        acc.name.toLowerCase().includes('main') || 
        acc.name.toLowerCase().includes('cash')
      );

      setVerificationAmounts({
        totalVerificationFees,
        mainCashFromVerifications: mainCashAccount ? totalVerificationFees : 0
      });

    } catch (error) {
      console.error('Error fetching verification amounts:', error);
    }
  };

  // Update cash balance when verifications change
  useEffect(() => {
    if (accounts.length > 0) {
      updateCashFromVerifications();
      fetchVerificationAmounts();
    }
  }, [accounts.length]);

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cash Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cash Accounts Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {accounts.map((account) => (
          <Card key={account.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{account.name}</p>
                  <p className="text-2xl font-bold">₹{account.balance.toFixed(2)}</p>
                  {(account.name.toLowerCase().includes('main') || account.name.toLowerCase().includes('cash')) && (
                    <p className="text-xs text-green-600 mt-1">
                      From Verifications: ₹{verificationAmounts.mainCashFromVerifications.toFixed(2)}
                    </p>
                  )}
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Balance</p>
                <p className="text-2xl font-bold text-primary">₹{totalBalance.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Card - Cash connected to verifications only */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-800">Verification-Based Cash Management</h3>
              <p className="text-sm text-blue-600">
                Main Cash account automatically updates when registrations are verified. 
                Total verified amount: ₹{verificationAmounts.totalVerificationFees.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Verification-Related Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Verification Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {verificationAmounts.totalVerificationFees > 0 ? (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-green-800">Registration Verifications</p>
                    <p className="text-sm text-green-600">Total amount from verified registrations</p>
                  </div>
                  <p className="text-lg font-bold text-green-700">
                    ₹{verificationAmounts.totalVerificationFees.toFixed(2)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>No verified registrations yet</p>
                <p className="text-sm">Cash will automatically update when registrations are verified</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountsTab;