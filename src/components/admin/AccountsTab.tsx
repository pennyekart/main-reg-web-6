import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, ArrowRightLeft, Receipt, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface CashAccount {
  id: string;
  name: string;
  balance: number;
  is_active: boolean;
}

interface CashTransaction {
  id: string;
  account_id: string;
  type: 'cash_in' | 'cash_out';
  amount: number;
  description: string;
  reference_number: string;
  created_by: string;
  created_at: string;
  cash_accounts: { name: string };
}

interface CashTransfer {
  id: string;
  from_account_id: string;
  to_account_id: string;
  amount: number;
  description: string;
  reference_number: string;
  created_by: string;
  created_at: string;
  from_account: { name: string };
  to_account: { name: string };
}

interface Expense {
  id: string;
  account_id: string;
  category: string;
  amount: number;
  description: string;
  reference_number: string;
  created_by: string;
  created_at: string;
  cash_accounts: { name: string };
}

const AccountsTab = () => {
  const { toast } = useToast();
  const { currentAdminName } = useAdminAuth();
  const [accounts, setAccounts] = useState<CashAccount[]>([]);
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [transfers, setTransfers] = useState<CashTransfer[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [cashForm, setCashForm] = useState({
    account_id: '',
    type: 'cash_in' as 'cash_in' | 'cash_out',
    amount: '',
    description: '',
    reference_number: ''
  });

  const [transferForm, setTransferForm] = useState({
    from_account_id: '',
    to_account_id: '',
    amount: '',
    description: '',
    reference_number: ''
  });

  const [expenseForm, setExpenseForm] = useState({
    account_id: '',
    category: '',
    amount: '',
    description: '',
    reference_number: ''
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

      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('cash_transactions')
        .select(`
          *,
          cash_accounts (name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (transactionsError) throw transactionsError;
      setTransactions((transactionsData || []) as CashTransaction[]);

      // Fetch transfers
      const { data: transfersData, error: transfersError } = await supabase
        .from('cash_transfers')
        .select(`
          *,
          from_account:cash_accounts!cash_transfers_from_account_id_fkey (name),
          to_account:cash_accounts!cash_transfers_to_account_id_fkey (name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (transfersError) throw transfersError;
      setTransfers(transfersData || []);

      // Fetch expenses
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select(`
          *,
          cash_accounts (name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (expensesError) throw expensesError;
      setExpenses(expensesData || []);

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

  const handleCashTransaction = async () => {
    if (!cashForm.account_id || !cashForm.amount || !cashForm.description) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill all required fields"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('cash_transactions')
        .insert({
          account_id: cashForm.account_id,
          type: cashForm.type,
          amount: parseFloat(cashForm.amount),
          description: cashForm.description,
          reference_number: cashForm.reference_number,
          created_by: currentAdminName || 'admin'
        });

      if (error) throw error;

      // Update account balance
      const account = accounts.find(a => a.id === cashForm.account_id);
      if (account) {
        const balanceChange = cashForm.type === 'cash_in' 
          ? parseFloat(cashForm.amount) 
          : -parseFloat(cashForm.amount);
        
        await supabase
          .from('cash_accounts')
          .update({ balance: account.balance + balanceChange })
          .eq('id', cashForm.account_id);
      }

      setCashForm({
        account_id: '',
        type: 'cash_in',
        amount: '',
        description: '',
        reference_number: ''
      });

      toast({
        title: "Success",
        description: "Cash transaction recorded successfully"
      });

      fetchData();
    } catch (error) {
      console.error('Error recording transaction:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to record transaction"
      });
    }
  };

  const handleTransfer = async () => {
    if (!transferForm.from_account_id || !transferForm.to_account_id || !transferForm.amount) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill all required fields"
      });
      return;
    }

    if (transferForm.from_account_id === transferForm.to_account_id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Cannot transfer to the same account"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('cash_transfers')
        .insert({
          from_account_id: transferForm.from_account_id,
          to_account_id: transferForm.to_account_id,
          amount: parseFloat(transferForm.amount),
          description: transferForm.description,
          reference_number: transferForm.reference_number,
          created_by: currentAdminName || 'admin'
        });

      if (error) throw error;

      // Update balances
      const fromAccount = accounts.find(a => a.id === transferForm.from_account_id);
      const toAccount = accounts.find(a => a.id === transferForm.to_account_id);
      
      if (fromAccount && toAccount) {
        const amount = parseFloat(transferForm.amount);
        
        await Promise.all([
          supabase
            .from('cash_accounts')
            .update({ balance: fromAccount.balance - amount })
            .eq('id', transferForm.from_account_id),
          supabase
            .from('cash_accounts')
            .update({ balance: toAccount.balance + amount })
            .eq('id', transferForm.to_account_id)
        ]);
      }

      setTransferForm({
        from_account_id: '',
        to_account_id: '',
        amount: '',
        description: '',
        reference_number: ''
      });

      toast({
        title: "Success",
        description: "Transfer completed successfully"
      });

      fetchData();
    } catch (error) {
      console.error('Error processing transfer:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process transfer"
      });
    }
  };

  const handleExpense = async () => {
    if (!expenseForm.account_id || !expenseForm.category || !expenseForm.amount || !expenseForm.description) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill all required fields"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('expenses')
        .insert({
          account_id: expenseForm.account_id,
          category: expenseForm.category,
          amount: parseFloat(expenseForm.amount),
          description: expenseForm.description,
          reference_number: expenseForm.reference_number,
          created_by: currentAdminName || 'admin'
        });

      if (error) throw error;

      // Update account balance (subtract expense)
      const account = accounts.find(a => a.id === expenseForm.account_id);
      if (account) {
        await supabase
          .from('cash_accounts')
          .update({ balance: account.balance - parseFloat(expenseForm.amount) })
          .eq('id', expenseForm.account_id);
      }

      setExpenseForm({
        account_id: '',
        category: '',
        amount: '',
        description: '',
        reference_number: ''
      });

      toast({
        title: "Success",
        description: "Expense recorded successfully"
      });

      fetchData();
    } catch (error) {
      console.error('Error recording expense:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to record expense"
      });
    }
  };

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

  // Fetch verification-related cash amounts
  const [verificationAmounts, setVerificationAmounts] = useState({
    totalVerificationFees: 0,
    mainCashFromVerifications: 0
  });

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

  useEffect(() => {
    if (accounts.length > 0) {
      fetchVerificationAmounts();
    }
  }, [accounts]);

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

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Cash In/Out
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cash Transaction</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="cash-account">Account</Label>
                <Select value={cashForm.account_id} onValueChange={(value) => setCashForm(prev => ({ ...prev, account_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="cash-type">Type</Label>
                <Select value={cashForm.type} onValueChange={(value: 'cash_in' | 'cash_out') => setCashForm(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash_in">Cash In</SelectItem>
                    <SelectItem value="cash_out">Cash Out</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="cash-amount">Amount</Label>
                <Input
                  id="cash-amount"
                  type="number"
                  value={cashForm.amount}
                  onChange={(e) => setCashForm(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="cash-description">Description</Label>
                <Textarea
                  id="cash-description"
                  value={cashForm.description}
                  onChange={(e) => setCashForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Transaction description"
                />
              </div>
              <div>
                <Label htmlFor="cash-reference">Reference Number</Label>
                <Input
                  id="cash-reference"
                  value={cashForm.reference_number}
                  onChange={(e) => setCashForm(prev => ({ ...prev, reference_number: e.target.value }))}
                  placeholder="Optional reference"
                />
              </div>
              <Button onClick={handleCashTransaction} className="w-full">
                Record Transaction
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4" />
              Transfer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cash Transfer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="from-account">From Account</Label>
                <Select value={transferForm.from_account_id} onValueChange={(value) => setTransferForm(prev => ({ ...prev, from_account_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="to-account">To Account</Label>
                <Select value={transferForm.to_account_id} onValueChange={(value) => setTransferForm(prev => ({ ...prev, to_account_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="transfer-amount">Amount</Label>
                <Input
                  id="transfer-amount"
                  type="number"
                  value={transferForm.amount}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="transfer-description">Description</Label>
                <Textarea
                  id="transfer-description"
                  value={transferForm.description}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Transfer description"
                />
              </div>
              <div>
                <Label htmlFor="transfer-reference">Reference Number</Label>
                <Input
                  id="transfer-reference"
                  value={transferForm.reference_number}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, reference_number: e.target.value }))}
                  placeholder="Optional reference"
                />
              </div>
              <Button onClick={handleTransfer} className="w-full">
                Process Transfer
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Expense</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="expense-account">Account</Label>
                <Select value={expenseForm.account_id} onValueChange={(value) => setExpenseForm(prev => ({ ...prev, account_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="expense-category">Category</Label>
                <Select value={expenseForm.category} onValueChange={(value) => setExpenseForm(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="office">Office Supplies</SelectItem>
                    <SelectItem value="travel">Travel</SelectItem>
                    <SelectItem value="utilities">Utilities</SelectItem>
                    <SelectItem value="food">Food & Beverages</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="expense-amount">Amount</Label>
                <Input
                  id="expense-amount"
                  type="number"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="expense-description">Description</Label>
                <Textarea
                  id="expense-description"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Expense description"
                />
              </div>
              <div>
                <Label htmlFor="expense-reference">Reference Number</Label>
                <Input
                  id="expense-reference"
                  value={expenseForm.reference_number}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, reference_number: e.target.value }))}
                  placeholder="Optional reference"
                />
              </div>
              <Button onClick={handleExpense} className="w-full">
                Record Expense
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Recent Activity Tables */}
      <Tabs defaultValue="transactions" className="w-full">
        <TabsList>
          <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
          <TabsTrigger value="transfers">Recent Transfers</TabsTrigger>
          <TabsTrigger value="expenses">Recent Expenses</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Recent Cash Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Created By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{new Date(transaction.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{transaction.cash_accounts?.name}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          transaction.type === 'cash_in' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.type === 'cash_in' ? 'Cash In' : 'Cash Out'}
                        </span>
                      </TableCell>
                      <TableCell className={transaction.type === 'cash_in' ? 'text-green-600' : 'text-red-600'}>
                        {transaction.type === 'cash_in' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>{transaction.reference_number}</TableCell>
                      <TableCell>{transaction.created_by}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfers">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transfers</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Created By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfers.map((transfer) => (
                    <TableRow key={transfer.id}>
                      <TableCell>{new Date(transfer.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{transfer.from_account?.name}</TableCell>
                      <TableCell>{transfer.to_account?.name}</TableCell>
                      <TableCell>₹{transfer.amount.toFixed(2)}</TableCell>
                      <TableCell>{transfer.description}</TableCell>
                      <TableCell>{transfer.reference_number}</TableCell>
                      <TableCell>{transfer.created_by}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle>Recent Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Created By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{new Date(expense.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{expense.cash_accounts?.name}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800 capitalize">
                          {expense.category}
                        </span>
                      </TableCell>
                      <TableCell className="text-red-600">-₹{expense.amount.toFixed(2)}</TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>{expense.reference_number}</TableCell>
                      <TableCell>{expense.created_by}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccountsTab;