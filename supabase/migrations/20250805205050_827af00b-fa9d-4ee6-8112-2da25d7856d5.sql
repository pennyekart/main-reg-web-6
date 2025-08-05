-- Add missing RLS policies for admin registration management
CREATE POLICY "Admin can update registrations" 
ON public.registrations 
FOR UPDATE 
USING (true)
WITH CHECK (true);

CREATE POLICY "Admin can delete registrations" 
ON public.registrations 
FOR DELETE 
USING (true);