-- Create public storage bucket for category QR codes
INSERT INTO storage.buckets (id, name, public)
VALUES ('category-qr', 'category-qr', true);

-- Create policies for the category-qr bucket
CREATE POLICY "Anyone can view category QR files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'category-qr');

CREATE POLICY "Anyone can upload category QR files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'category-qr');

CREATE POLICY "Anyone can update category QR files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'category-qr');

CREATE POLICY "Anyone can delete category QR files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'category-qr');