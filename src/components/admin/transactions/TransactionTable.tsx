import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

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

interface Account {
  id: string;
  name: string;
}

interface TransactionTableProps {
  transactions: Transaction[];
  accounts: Account[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transactionId: string) => void;
}

const TransactionTable = ({ transactions, accounts, onEdit, onDelete }: TransactionTableProps) => {
  const getAccountName = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    return account?.name || 'Unknown Account';
  };

  const getTypeVariant = (type: string) => {
    switch (type.toLowerCase()) {
      case 'credit':
      case 'deposit':
        return 'default';
      case 'debit':
      case 'withdrawal':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No transactions found</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Account</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>
                {format(new Date(transaction.created_at), 'MMM dd, yyyy HH:mm')}
              </TableCell>
              <TableCell>{getAccountName(transaction.account_id)}</TableCell>
              <TableCell>
                <Badge variant={getTypeVariant(transaction.type)}>
                  {transaction.type}
                </Badge>
              </TableCell>
              <TableCell>{transaction.description || '-'}</TableCell>
              <TableCell>{transaction.reference_number || '-'}</TableCell>
              <TableCell className="text-right font-medium">
                <span className={transaction.type.toLowerCase().includes('credit') || transaction.type.toLowerCase().includes('deposit') ? 'text-green-600' : 'text-red-600'}>
                  {transaction.type.toLowerCase().includes('credit') || transaction.type.toLowerCase().includes('deposit') ? '+' : '-'}₹{Math.abs(transaction.amount).toFixed(2)}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(transaction)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(transaction.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TransactionTable;