-- ============================================
-- MIGRACIÓN: Tablas nuevas (máquinas, recurrencias, transacciones)
-- Ejecutar esto en el SQL Editor de Supabase
-- ============================================

-- 1. Agregar campo tools_needed a services
ALTER TABLE services ADD COLUMN IF NOT EXISTS tools_needed TEXT;

-- 2. Crear tabla machines (máquinas y equipos)
CREATE TABLE IF NOT EXISTS machines (
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

-- 3. Crear tabla recurrences (turnos recurrentes)
CREATE TABLE IF NOT EXISTS recurrences (
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

-- 4. Crear tabla transactions (transacciones financieras)
CREATE TABLE IF NOT EXISTS transactions (
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

-- 5. Habilitar RLS
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 6. Políticas RLS
CREATE POLICY "Public can read active machines" ON machines FOR SELECT USING (is_active = true);
CREATE POLICY "Authenticated can manage machines" ON machines FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can manage recurrences" ON recurrences FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can manage transactions" ON transactions FOR ALL USING (auth.role() = 'authenticated');

-- 7. Crear tabla profiles (perfiles de usuario con roles)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'empleado' CHECK (role IN ('admin', 'gerente', 'empleado')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Habilitar RLS para profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 9. Políticas RLS para profiles
CREATE POLICY "Authenticated can manage profiles" ON profiles FOR ALL USING (auth.role() = 'authenticated');
