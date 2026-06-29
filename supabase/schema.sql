-- Create services table
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('Interior', 'Exterior', 'Completo')),
  duration_minutes INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  tools_needed TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create vehicles table
CREATE TABLE vehicles (
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

-- Create appointments table
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  duration_minutes INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create work_orders table
CREATE TABLE work_orders (
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

-- Create work_order_items table
CREATE TABLE work_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create products table
CREATE TABLE products (
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

-- Create schedules table (for weekly availability)
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- Create blocks table (for specific date blocks like holidays/vacations)
CREATE TABLE blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create machines table (workshop equipment)
CREATE TABLE machines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  purchase_date DATE,
  purchase_price DECIMAL(10, 2),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive')),
  last_maintenance DATE,
  next_maintenance DATE,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create recurrences table (recurring appointments)
CREATE TABLE recurrences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  day_of_month INTEGER CHECK (day_of_month BETWEEN 1 AND 31),
  time TIME NOT NULL,
  duration_minutes INTEGER,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create transactions table (financial accounting)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policies for services
CREATE POLICY "Public can read active services" ON services FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can read all services" ON services FOR SELECT USING (true);
CREATE POLICY "Anyone can insert services" ON services FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update services" ON services FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete services" ON services FOR DELETE USING (true);

-- Policies for clients
CREATE POLICY "Anyone can manage clients" ON clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public can insert clients" ON clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update clients" ON clients FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public can read clients" ON clients FOR SELECT USING (true);

-- Policies for appointments
CREATE POLICY "Public can read appointments" ON appointments FOR SELECT USING (true);
CREATE POLICY "Public can insert appointments" ON appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update appointments" ON appointments FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete appointments" ON appointments FOR DELETE USING (true);

-- Policies for schedules
CREATE POLICY "Everyone can read schedules" ON schedules FOR SELECT USING (true);
CREATE POLICY "Anyone can manage schedules" ON schedules FOR ALL USING (true) WITH CHECK (true);

-- Policies for blocks
CREATE POLICY "Everyone can read blocks" ON blocks FOR SELECT USING (true);
CREATE POLICY "Anyone can manage blocks" ON blocks FOR ALL USING (true) WITH CHECK (true);

-- Policies for vehicles
CREATE POLICY "Anyone can manage vehicles" ON vehicles FOR ALL USING (true) WITH CHECK (true);

-- Policies for work_orders
CREATE POLICY "Anyone can manage work_orders" ON work_orders FOR ALL USING (true) WITH CHECK (true);

-- Policies for work_order_items
CREATE POLICY "Anyone can manage work_order_items" ON work_order_items FOR ALL USING (true) WITH CHECK (true);

-- Policies for products
CREATE POLICY "Anyone can manage products" ON products FOR ALL USING (true) WITH CHECK (true);

-- Policies for machines
CREATE POLICY "Public can read active machines" ON machines FOR SELECT USING (is_active = true);
CREATE POLICY "Authenticated can manage machines" ON machines FOR ALL USING (auth.role() = 'authenticated');

-- Policies for recurrences
CREATE POLICY "Authenticated can manage recurrences" ON recurrences FOR ALL USING (auth.role() = 'authenticated');

-- Policies for transactions
CREATE POLICY "Authenticated can manage transactions" ON transactions FOR ALL USING (auth.role() = 'authenticated');

-- Create profiles table (linked to Supabase Auth users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'empleado' CHECK (role IN ('admin', 'gerente', 'empleado')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Policies for profiles
CREATE POLICY "Authenticated can manage profiles" ON profiles FOR ALL USING (auth.role() = 'authenticated');

-- Seed Data - Servicios de Car Detailing
INSERT INTO services (name, description, category, duration_minutes, price) VALUES
('Lavado Exterior Premium', 'Lavado completo con champú especial, secado y abrillantado de neumáticos.', 'Exterior', 45, 8000),
('Lavado Interior Profundo', 'Aspirado, limpieza de superficies, limpieza de vidrios y desinfección.', 'Interior', 60, 10000),
('Lavado Completo Full', 'Servicio integral de interior y exterior para tu vehículo.', 'Completo', 90, 15000),
('Pulido Ceramic Coating', 'Pulido de pintura y aplicación de recubrimiento cerámico para protección duradera.', 'Exterior', 180, 45000),
('Descontaminación de Pintura', 'Eliminación de contaminantes, óxido y marcas de agua de la superficie.', 'Exterior', 120, 30000),
('Limpieza de Motor', 'Limpieza completa del motor con productos especiales y protección.', 'Exterior', 60, 12000);

-- Seed Data - Horarios (Lunes a Sábado)
INSERT INTO schedules (day_of_week, start_time, end_time) VALUES
(1, '08:00', '18:00'),
(2, '08:00', '18:00'),
(3, '08:00', '18:00'),
(4, '08:00', '18:00'),
(5, '08:00', '18:00'),
(6, '09:00', '14:00');
