-- Create cash accounts table
CREATE TABLE public.cash_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cash transactions table (for cash in/out)
CREATE TABLE public.cash_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.cash_accounts(id),
  type TEXT NOT NULL CHECK (type IN ('cash_in', 'cash_out')),
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  reference_number TEXT,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cash transfers table
CREATE TABLE public.cash_transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_account_id UUID NOT NULL REFERENCES public.cash_accounts(id),
  to_account_id UUID NOT NULL REFERENCES public.cash_accounts(id),
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  reference_number TEXT,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.cash_accounts(id),
  category TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  reference_number TEXT,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.cash_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admin can manage cash accounts" ON public.cash_accounts FOR ALL USING (true);
CREATE POLICY "Admin can manage cash transactions" ON public.cash_transactions FOR ALL USING (true);
CREATE POLICY "Admin can manage cash transfers" ON public.cash_transfers FOR ALL USING (true);
CREATE POLICY "Admin can manage expenses" ON public.expenses FOR ALL USING (true);

-- Create trigger for updating timestamps
CREATE TRIGGER update_cash_accounts_updated_at
  BEFORE UPDATE ON public.cash_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cash_transactions_updated_at
  BEFORE UPDATE ON public.cash_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cash_transfers_updated_at
  BEFORE UPDATE ON public.cash_transfers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default cash accounts
INSERT INTO public.cash_accounts (name, balance) VALUES 
('Main Cash', 0),
('Petty Cash', 0),
('Bank Account', 0);