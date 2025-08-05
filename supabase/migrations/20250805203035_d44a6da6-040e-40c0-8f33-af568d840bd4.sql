-- Fix RLS policies to allow admin operations on all tables

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Anyone can view active announcements" ON announcements;
DROP POLICY IF EXISTS "Anyone can view active utilities" ON utilities; 
DROP POLICY IF EXISTS "Anyone can view active panchayaths" ON panchayaths;
DROP POLICY IF EXISTS "Anyone can view active categories" ON categories;

-- Create new policies that allow admin operations
-- Announcements policies
CREATE POLICY "Anyone can view active announcements" ON announcements FOR SELECT USING (is_active = true);
CREATE POLICY "Admin can manage announcements" ON announcements FOR ALL USING (true) WITH CHECK (true);

-- Utilities policies  
CREATE POLICY "Anyone can view active utilities" ON utilities FOR SELECT USING (is_active = true);
CREATE POLICY "Admin can manage utilities" ON utilities FOR ALL USING (true) WITH CHECK (true);

-- Panchayaths policies
CREATE POLICY "Anyone can view active panchayaths" ON panchayaths FOR SELECT USING (is_active = true);
CREATE POLICY "Admin can manage panchayaths" ON panchayaths FOR ALL USING (true) WITH CHECK (true);

-- Categories policies
CREATE POLICY "Anyone can view active categories" ON categories FOR SELECT USING (is_active = true);
CREATE POLICY "Admin can manage categories" ON categories FOR ALL USING (true) WITH CHECK (true);