-- ============================================
-- MIGRACIÓN: Agregar tablas nuevas y actualizar RLS
-- Ejecutar esto en el SQL Editor de Supabase
-- ============================================

-- 1. Agregar columnas faltantes a clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Crear tabla vehicles (ANTES de appointments)
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  color TEXT,
  license_plate TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Agregar columnas nuevas a appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

-- 4. Crear tabla work_orders
CREATE TABLE IF NOT EXISTS work_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  total DECIMAL(10, 2) DEFAULT 0,
  discount DECIMAL(10, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 5. Crear tabla work_order_items
CREATE TABLE IF NOT EXISTS work_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Crear tabla products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  brand TEXT,
  purchase_price DECIMAL(10, 2),
  sale_price DECIMAL(10, 2),
  stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  unit TEXT DEFAULT 'unit' CHECK (unit IN ('unit', 'liter', 'kg', 'ml')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Habilitar RLS en nuevas tablas
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 8. Eliminar políticas existentes de services
DROP POLICY IF EXISTS "Admins can do everything on services" ON services;
DROP POLICY IF EXISTS "Public can read active services" ON services;
DROP POLICY IF EXISTS "Anyone can read all services" ON services;
DROP POLICY IF EXISTS "Anyone can insert services" ON services;
DROP POLICY IF EXISTS "Anyone can update services" ON services;
DROP POLICY IF EXISTS "Anyone can delete services" ON services;

-- 9. Crear nuevas políticas para services
CREATE POLICY "Public can read active services" ON services FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can read all services" ON services FOR SELECT USING (true);
CREATE POLICY "Anyone can insert services" ON services FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update services" ON services FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete services" ON services FOR DELETE USING (true);

-- 10. Eliminar políticas existentes de appointments
DROP POLICY IF EXISTS "Admins can manage appointments" ON appointments;
DROP POLICY IF EXISTS "Public can insert appointments" ON appointments;
DROP POLICY IF EXISTS "Public can read appointments" ON appointments;
DROP POLICY IF EXISTS "Anyone can update appointments" ON appointments;
DROP POLICY IF EXISTS "Anyone can delete appointments" ON appointments;

-- 11. Crear nuevas políticas para appointments
CREATE POLICY "Public can read appointments" ON appointments FOR SELECT USING (true);
CREATE POLICY "Public can insert appointments" ON appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update appointments" ON appointments FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete appointments" ON appointments FOR DELETE USING (true);

-- 12. Eliminar políticas existentes de clients
DROP POLICY IF EXISTS "Admins can manage clients" ON clients;
DROP POLICY IF EXISTS "Public can insert clients" ON clients;
DROP POLICY IF EXISTS "Public can update clients" ON clients;
DROP POLICY IF EXISTS "Public can read clients" ON clients;
DROP POLICY IF EXISTS "Anyone can manage clients" ON clients;

-- 13. Crear nuevas políticas para clients
CREATE POLICY "Anyone can manage clients" ON clients FOR ALL USING (true) WITH CHECK (true);

-- 14. Eliminar políticas existentes de schedules
DROP POLICY IF EXISTS "Everyone can read schedules" ON schedules;
DROP POLICY IF EXISTS "Admins can manage schedules" ON schedules;
DROP POLICY IF EXISTS "Anyone can manage schedules" ON schedules;

-- 15. Crear nuevas políticas para schedules
CREATE POLICY "Everyone can read schedules" ON schedules FOR SELECT USING (true);
CREATE POLICY "Anyone can manage schedules" ON schedules FOR ALL USING (true) WITH CHECK (true);

-- 16. Eliminar políticas existentes de blocks
DROP POLICY IF EXISTS "Everyone can read blocks" ON blocks;
DROP POLICY IF EXISTS "Admins can manage blocks" ON blocks;
DROP POLICY IF EXISTS "Anyone can manage blocks" ON blocks;

-- 17. Crear nuevas políticas para blocks
CREATE POLICY "Everyone can read blocks" ON blocks FOR SELECT USING (true);
CREATE POLICY "Anyone can manage blocks" ON blocks FOR ALL USING (true) WITH CHECK (true);

-- 18. Políticas para nuevas tablas
CREATE POLICY "Anyone can manage vehicles" ON vehicles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can manage work_orders" ON work_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can manage work_order_items" ON work_order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can manage products" ON products FOR ALL USING (true) WITH CHECK (true);
