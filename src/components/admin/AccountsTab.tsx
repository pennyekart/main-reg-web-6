import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import TransactionTable from './transactions/TransactionTable';
import EditTransactionDialog from './transactions/EditTransactionDialog';
import DeleteTransactionDialog from './transactions/DeleteTransactionDialog';

interface CashAccount {
  id: string;
  name: string;
  balance: number;
  is_active: boolean;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  reference_number: string | null;
  created_at: string;
  account_id: string;
  created_by: string | null;
}

const AccountsTab = () => {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<CashAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [deleteTransactionId, setDeleteTransactionId] = useState<string | null>(null);

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
        .from('cash_accounts' as any)
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (accountsError) throw accountsError;
      setAccounts((accountsData || []) as unknown as CashAccount[]);

      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('cash_transactions' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (transactionsError) throw transactionsError;
      setTransactions((transactionsData || []) as unknown as Transaction[]);

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
          .from('cash_accounts' as any)
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

      {/* All Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Transactions</CardTitle>
            <Button onClick={() => fetchData()}>
              <Plus className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <TransactionTable
            transactions={transactions}
            accounts={accounts}
            onEdit={setEditTransaction}
            onDelete={setDeleteTransactionId}
          />
        </CardContent>
      </Card>

      {/* Edit Transaction Dialog */}
      <EditTransactionDialog
        transaction={editTransaction}
        accounts={accounts}
        open={!!editTransaction}
        onOpenChange={(open) => !open && setEditTransaction(null)}
        onSuccess={fetchData}
      />

      {/* Delete Transaction Dialog */}
      <DeleteTransactionDialog
        transactionId={deleteTransactionId}
        open={!!deleteTransactionId}
        onOpenChange={(open) => !open && setDeleteTransactionId(null)}
        onSuccess={fetchData}
      />

      {/* Verification Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-800">Verification Summary</h3>
              <p className="text-sm text-blue-600">
                Total verified amount: ₹{verificationAmounts.totalVerificationFees.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountsTab;