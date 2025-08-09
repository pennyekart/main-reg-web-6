-- Create admin users table
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by TEXT,
  last_login TIMESTAMP WITH TIME ZONE
);

-- Create admin permissions table
CREATE TABLE public.admin_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin user permissions junction table
CREATE TABLE public.admin_user_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.admin_permissions(id) ON DELETE CASCADE,
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  granted_by TEXT,
  UNIQUE(admin_user_id, permission_id)
);

-- Enable Row Level Security
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_user_permissions ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_users
CREATE POLICY "Admin can manage admin users" 
ON public.admin_users 
FOR ALL 
USING (true);

-- Create policies for admin_permissions
CREATE POLICY "Admin can manage permissions" 
ON public.admin_permissions 
FOR ALL 
USING (true);

-- Create policies for admin_user_permissions
CREATE POLICY "Admin can manage user permissions" 
ON public.admin_user_permissions 
FOR ALL 
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_admin_users_updated_at
BEFORE UPDATE ON public.admin_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default permissions
INSERT INTO public.admin_permissions (name, description) VALUES
('users_read', 'View user registrations'),
('users_write', 'Manage user registrations'),
('categories_read', 'View categories'),
('categories_write', 'Manage categories'),
('panchayaths_read', 'View panchayaths'),
('panchayaths_write', 'Manage panchayaths'),
('announcements_read', 'View announcements'),
('announcements_write', 'Manage announcements'),
('utilities_read', 'View utilities'),
('utilities_write', 'Manage utilities'),
('accounts_read', 'View cash accounts'),
('accounts_write', 'Manage cash accounts'),
('reports_read', 'View reports'),
('admin_users_read', 'View admin users'),
('admin_users_write', 'Manage admin users');

-- Insert default admin user (eva with all permissions)
INSERT INTO public.admin_users (username, password_hash, full_name, email, created_by) 
VALUES ('eva', '$2b$10$dummyhash', 'Eva Administrator', 'eva@admin.com', 'system');

-- Get the admin user ID and assign all permissions
DO $$
DECLARE
    admin_id UUID;
    perm_record RECORD;
BEGIN
    SELECT id INTO admin_id FROM public.admin_users WHERE username = 'eva';
    
    FOR perm_record IN SELECT id FROM public.admin_permissions LOOP
        INSERT INTO public.admin_user_permissions (admin_user_id, permission_id, granted_by)
        VALUES (admin_id, perm_record.id, 'system');
    END LOOP;
END $$;