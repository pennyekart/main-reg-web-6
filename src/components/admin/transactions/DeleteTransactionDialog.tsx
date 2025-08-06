import { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DeleteTransactionDialogProps {
  transactionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const DeleteTransactionDialog = ({ 
  transactionId, 
  open, 
  onOpenChange, 
  onSuccess 
}: DeleteTransactionDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!transactionId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('cash_transactions' as any)
        .delete()
        .eq('id', transactionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Transaction deleted successfully"
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete transaction"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this transaction? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={loading}>
            {loading ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteTransactionDialog;