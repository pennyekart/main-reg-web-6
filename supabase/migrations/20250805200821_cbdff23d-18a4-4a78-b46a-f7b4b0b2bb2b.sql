-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_english TEXT NOT NULL,
  name_malayalam TEXT NOT NULL,
  description TEXT,
  actual_fee DECIMAL(10,2) DEFAULT 0,
  offer_fee DECIMAL(10,2) DEFAULT 0,
  expiry_days INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create panchayaths table
CREATE TABLE public.panchayaths (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  district TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create registrations table
CREATE TABLE public.registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  mobile_number TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL,
  panchayath_id UUID REFERENCES public.panchayaths(id),
  ward TEXT NOT NULL,
  agent TEXT,
  category_id UUID NOT NULL REFERENCES public.categories(id),
  preference_category_id UUID REFERENCES public.categories(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  fee DECIMAL(10,2) DEFAULT 0,
  approved_date TIMESTAMP WITH TIME ZONE,
  approved_by TEXT,
  expiry_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create announcements table
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create utilities table
CREATE TABLE public.utilities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.panchayaths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utilities ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (most data should be readable by everyone)
CREATE POLICY "Anyone can view active categories" ON public.categories FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view active panchayaths" ON public.panchayaths FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view active announcements" ON public.announcements FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view active utilities" ON public.utilities FOR SELECT USING (is_active = true);

-- Create policies for registrations (users can create, but only view their own)
CREATE POLICY "Anyone can create registrations" ON public.registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view their own registrations" ON public.registrations FOR SELECT USING (true);

-- Create function to generate customer ID
CREATE OR REPLACE FUNCTION generate_customer_id(mobile TEXT, name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN mobile || UPPER(LEFT(name, 1));
END;
$$;

-- Create function to set expiry date based on category
CREATE OR REPLACE FUNCTION set_registration_expiry()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  expiry_days INTEGER;
BEGIN
  -- Get expiry days from category
  SELECT c.expiry_days INTO expiry_days 
  FROM public.categories c 
  WHERE c.id = NEW.category_id;
  
  -- Set expiry date
  NEW.expiry_date = NEW.created_at + INTERVAL '1 day' * COALESCE(expiry_days, 30);
  
  -- Generate customer ID if not provided
  IF NEW.customer_id IS NULL OR NEW.customer_id = '' THEN
    NEW.customer_id = generate_customer_id(NEW.mobile_number, NEW.full_name);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for registration expiry
CREATE TRIGGER set_registration_expiry_trigger
  BEFORE INSERT ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION set_registration_expiry();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_panchayaths_updated_at BEFORE UPDATE ON public.panchayaths FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_registrations_updated_at BEFORE UPDATE ON public.registrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_utilities_updated_at BEFORE UPDATE ON public.utilities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories
INSERT INTO public.categories (name_english, name_malayalam) VALUES
('Job Card (Special)', 'ജോബ് കാർഡ്'),
('Farmelife', 'ഫാമിലൈഫ്'),
('Organelife', 'ഓർഗാനി ലൈഫ്'),
('Foodelife', 'ഫുഡി ലൈഫ്'),
('Entrelife', 'എൻട്രി ലൈഫ്'),
('Pennyekart Paid Registration', 'പെന്നികാർട്ട് പണമടച്ചുള്ള രജിസ്ട്രേഷൻ'),
('Pennyekart Free Registration', 'പെന്നികാർട്ട് സൗജന്യ രജിസ്ട്രേഷൻ');

-- Insert sample panchayaths
INSERT INTO public.panchayaths (name, district) VALUES
('Thiruvananthapuram', 'Thiruvananthapuram'),
('Neyyattinkara', 'Thiruvananthapuram'),
('Kochi', 'Ernakulam'),
('Kozhikode', 'Kozhikode');