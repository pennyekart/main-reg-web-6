-- Add QR code path column to categories table
ALTER TABLE public.categories 
ADD COLUMN qr_code_url TEXT;