import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  reference_number: string | null;
  account_id: string;
}

interface Account {
  id: string;
  name: string;
}

interface EditTransactionDialogProps {
  transaction: Transaction | null;
  accounts: Account[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const EditTransactionDialog = ({ 
  transaction, 
  accounts, 
  open, 
  onOpenChange, 
  onSuccess 
}: EditTransactionDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    type: '',
    description: '',
    reference_number: '',
    account_id: ''
  });

  useEffect(() => {
    if (transaction) {
      setFormData({
        amount: Math.abs(transaction.amount).toString(),
        type: transaction.type,
        description: transaction.description || '',
        reference_number: transaction.reference_number || '',
        account_id: transaction.account_id
      });
    }
  }, [transaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction) return;

    setLoading(true);
    try {
      const amount = parseFloat(formData.amount);
      const finalAmount = formData.type.toLowerCase().includes('debit') || 
                         formData.type.toLowerCase().includes('withdrawal') ? 
                         -Math.abs(amount) : Math.abs(amount);

      const { error } = await supabase
        .from('cash_transactions' as any)
        .update({
          amount: finalAmount,
          type: formData.type,
          description: formData.description || null,
          reference_number: formData.reference_number || null,
          account_id: formData.account_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Transaction updated successfully"
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update transaction"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="account">Account</Label>
            <Select value={formData.account_id} onValueChange={(value) => setFormData(prev => ({ ...prev, account_id: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="credit">Credit</SelectItem>
                <SelectItem value="debit">Debit</SelectItem>
                <SelectItem value="deposit">Deposit</SelectItem>
                <SelectItem value="withdrawal">Withdrawal</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Reference Number</Label>
            <Input
              id="reference"
              value={formData.reference_number}
              onChange={(e) => setFormData(prev => ({ ...prev, reference_number: e.target.value }))}
              placeholder="Optional reference number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Optional description"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Transaction'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTransactionDialog;