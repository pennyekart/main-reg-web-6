-- Fix RLS policies by creating INSERT/UPDATE/DELETE policies specifically

-- Announcements policies
CREATE POLICY "Admin can insert announcements" ON announcements FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can update announcements" ON announcements FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Admin can delete announcements" ON announcements FOR DELETE USING (true);

-- Utilities policies  
CREATE POLICY "Admin can insert utilities" ON utilities FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can update utilities" ON utilities FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Admin can delete utilities" ON utilities FOR DELETE USING (true);

-- Panchayaths policies
CREATE POLICY "Admin can insert panchayaths" ON panchayaths FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can update panchayaths" ON panchayaths FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Admin can delete panchayaths" ON panchayaths FOR DELETE USING (true);

-- Categories policies
CREATE POLICY "Admin can insert categories" ON categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can update categories" ON categories FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Admin can delete categories" ON categories FOR DELETE USING (true);