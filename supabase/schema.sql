-- Create services table
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('Interior', 'Exterior', 'Completo')),
  duration_minutes INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create appointments table
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes TEXT,
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

-- Enable Row Level Security (RLS)
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

-- Policies for services
CREATE POLICY "Public can read active services" ON services FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can do everything on services" ON services FOR ALL USING (auth.role() = 'authenticated');

-- Policies for clients
CREATE POLICY "Admins can manage clients" ON clients FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Public can insert clients" ON clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update clients" ON clients FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public can read clients" ON clients FOR SELECT USING (true);

-- Policies for appointments
CREATE POLICY "Public can insert appointments" ON appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage appointments" ON appointments FOR ALL USING (auth.role() = 'authenticated');

-- Policies for schedules
CREATE POLICY "Everyone can read schedules" ON schedules FOR SELECT USING (true);
CREATE POLICY "Admins can manage schedules" ON schedules FOR ALL USING (auth.role() = 'authenticated');

-- Policies for blocks
CREATE POLICY "Everyone can read blocks" ON blocks FOR SELECT USING (true);
CREATE POLICY "Admins can manage blocks" ON blocks FOR ALL USING (auth.role() = 'authenticated');

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
