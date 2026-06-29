-- ============================================
-- MIGRACIÓN: Mejorar seguridad RLS
-- Ejecutar esto en el SQL Editor de Supabase
-- ============================================

-- Eliminar políticas existentes de services
DROP POLICY IF EXISTS "Public can read active services" ON services;
DROP POLICY IF EXISTS "Anyone can read all services" ON services;
DROP POLICY IF EXISTS "Anyone can insert services" ON services;
DROP POLICY IF EXISTS "Anyone can update services" ON services;
DROP POLICY IF EXISTS "Anyone can delete services" ON services;

-- Políticas seguras para services
CREATE POLICY "Public can read active services" ON services FOR SELECT USING (is_active = true);
CREATE POLICY "Authenticated can read all services" ON services FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can insert services" ON services FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can update services" ON services FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can delete services" ON services FOR DELETE USING (auth.role() = 'authenticated');

-- Eliminar políticas existentes de clients
DROP POLICY IF EXISTS "Anyone can manage clients" ON clients;

-- Políticas seguras para clients
CREATE POLICY "Public can read clients" ON clients FOR SELECT USING (true);
CREATE POLICY "Public can insert clients" ON clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update own client" ON clients FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can manage clients" ON clients FOR ALL USING (auth.role() = 'authenticated');

-- Eliminar políticas existentes de appointments
DROP POLICY IF EXISTS "Public can read appointments" ON appointments;
DROP POLICY IF EXISTS "Public can insert appointments" ON appointments;
DROP POLICY IF EXISTS "Anyone can update appointments" ON appointments;
DROP POLICY IF EXISTS "Anyone can delete appointments" ON appointments;

-- Políticas seguras para appointments
CREATE POLICY "Authenticated can read appointments" ON appointments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Public can insert appointments" ON appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated can update appointments" ON appointments FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can delete appointments" ON appointments FOR DELETE USING (auth.role() = 'authenticated');

-- Eliminar políticas existentes de schedules
DROP POLICY IF EXISTS "Everyone can read schedules" ON schedules;
DROP POLICY IF EXISTS "Anyone can manage schedules" ON schedules;

-- Políticas seguras para schedules
CREATE POLICY "Public can read schedules" ON schedules FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage schedules" ON schedules FOR ALL USING (auth.role() = 'authenticated');

-- Eliminar políticas existentes de blocks
DROP POLICY IF EXISTS "Everyone can read blocks" ON blocks;
DROP POLICY IF EXISTS "Anyone can manage blocks" ON blocks;

-- Políticas seguras para blocks
CREATE POLICY "Public can read blocks" ON blocks FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage blocks" ON blocks FOR ALL USING (auth.role() = 'authenticated');

-- Eliminar políticas existentes de vehicles
DROP POLICY IF EXISTS "Anyone can manage vehicles" ON vehicles;

-- Políticas seguras para vehicles
CREATE POLICY "Public can read vehicles" ON vehicles FOR SELECT USING (true);
CREATE POLICY "Public can insert vehicles" ON vehicles FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated can manage vehicles" ON vehicles FOR ALL USING (auth.role() = 'authenticated');

-- Eliminar políticas existentes de work_orders
DROP POLICY IF EXISTS "Anyone can manage work_orders" ON work_orders;

-- Políticas seguras para work_orders
CREATE POLICY "Authenticated can manage work_orders" ON work_orders FOR ALL USING (auth.role() = 'authenticated');

-- Eliminar políticas existentes de work_order_items
DROP POLICY IF EXISTS "Anyone can manage work_order_items" ON work_order_items;

-- Políticas seguras para work_order_items
CREATE POLICY "Authenticated can manage work_order_items" ON work_order_items FOR ALL USING (auth.role() = 'authenticated');

-- Eliminar políticas existentes de products
DROP POLICY IF EXISTS "Anyone can manage products" ON products;

-- Políticas seguras para products
CREATE POLICY "Public can read active products" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "Authenticated can manage products" ON products FOR ALL USING (auth.role() = 'authenticated');
