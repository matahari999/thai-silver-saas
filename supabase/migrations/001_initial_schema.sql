-- ============================================================
-- SilverCare Thailand - Multi-Tenant Supabase Schema
-- Migration 001: Initial Schema with RLS Policies
-- ============================================================

-- 1. CORE: TENANTS (nursing homes / clinics)
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_th TEXT NOT NULL,
  tax_id VARCHAR(13) UNIQUE NOT NULL,
  address_en TEXT NOT NULL,
  address_th TEXT NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email TEXT UNIQUE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. PROFILES (users with role-based access)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin','doctor','nurse','family')),
  full_name_en TEXT NOT NULL,
  full_name_th TEXT NOT NULL,
  phone VARCHAR(20),
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_profiles_tenant ON profiles(tenant_id);
CREATE INDEX idx_profiles_role ON profiles(role);

-- 3. PATIENTS
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  first_name_en TEXT NOT NULL,
  first_name_th TEXT NOT NULL,
  last_name_en TEXT NOT NULL,
  last_name_th TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender VARCHAR(10) NOT NULL CHECK (gender IN ('male','female','other')),
  national_id VARCHAR(13) UNIQUE NOT NULL,
  phone VARCHAR(20),
  emergency_contact_name TEXT NOT NULL,
  emergency_contact_phone VARCHAR(20) NOT NULL,
  blood_type VARCHAR(5),
  allergies TEXT DEFAULT '',
  chronic_diseases TEXT DEFAULT '',
  medications TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_patients_tenant ON patients(tenant_id);
CREATE INDEX idx_patients_active ON patients(tenant_id, is_active);

-- 4. APPOINTMENTS
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title_en TEXT NOT NULL,
  title_th TEXT NOT NULL,
  description_en TEXT DEFAULT '',
  description_th TEXT DEFAULT '',
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','confirmed','in_progress','completed','cancelled')),
  location_en TEXT DEFAULT '',
  location_th TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_appointments_tenant ON appointments(tenant_id);
CREATE INDEX idx_appointments_date ON appointments(tenant_id, appointment_date);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_status ON appointments(status);

-- 5. INVOICES (billing)
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
  amount_thai_text TEXT DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','overdue','cancelled')),
  payment_method VARCHAR(20) CHECK (payment_method IN ('cash','promptpay','bank_transfer','credit_card')),
  promptpay_qr_data TEXT,
  line_notify_sent BOOLEAN NOT NULL DEFAULT false,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ,
  due_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX idx_invoices_status ON invoices(tenant_id, status);
CREATE INDEX idx_invoices_patient ON invoices(patient_id);

-- 6. LINE NOTIFICATIONS LOG
CREATE TABLE IF NOT EXISTS line_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  recipient_line_id TEXT NOT NULL,
  message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('reminder','report','billing','alert')),
  message_en TEXT NOT NULL,
  message_th TEXT NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_line_notif_tenant ON line_notifications(tenant_id);

-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_notifications ENABLE ROW LEVEL SECURITY;

-- TENANTS: Only admins of that tenant can view their tenant
CREATE POLICY tenant_isolation_select ON tenants
  FOR SELECT USING (
    id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

-- PROFILES: Users see profiles within their tenant
CREATE POLICY profiles_tenant_select ON profiles
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );
CREATE POLICY profiles_tenant_insert ON profiles
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('admin','doctor'))
  );
CREATE POLICY profiles_tenant_update ON profiles
  FOR UPDATE USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('admin','doctor'))
  );

-- PATIENTS: Multi-tenant isolation
CREATE POLICY patients_tenant_select ON patients
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );
CREATE POLICY patients_tenant_insert ON patients
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('admin','doctor','nurse'))
  );
CREATE POLICY patients_tenant_update ON patients
  FOR UPDATE USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('admin','doctor','nurse'))
  );
CREATE POLICY patients_tenant_delete ON patients
  FOR DELETE USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('admin'))
  );

-- APPOINTMENTS: Family members see their own patient's appointments
CREATE POLICY appointments_tenant_select ON appointments
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );
CREATE POLICY appointments_tenant_insert ON appointments
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('admin','doctor','nurse'))
  );
CREATE POLICY appointments_tenant_update ON appointments
  FOR UPDATE USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('admin','doctor','nurse'))
  );

-- INVOICES: Billing isolation
CREATE POLICY invoices_tenant_select ON invoices
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );
CREATE POLICY invoices_tenant_insert ON invoices
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('admin','doctor'))
  );
CREATE POLICY invoices_tenant_update ON invoices
  FOR UPDATE USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('admin'))
  );

-- LINE NOTIFICATIONS
CREATE POLICY line_notif_tenant_select ON line_notifications
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );
CREATE POLICY line_notif_tenant_insert ON line_notifications
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('admin','doctor'))
  );

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID LANGUAGE SQL STABLE AS $$
  SELECT tenant_id FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS VARCHAR(20) LANGUAGE SQL STABLE AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION generate_invoice_number(p_tenant_id UUID)
RETURNS TEXT LANGUAGE PLPGSQL AS $$
DECLARE
  v_year TEXT;
  v_seq INT;
  v_number TEXT;
BEGIN
  v_year := to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(SUBSTRING(invoice_number FROM '\d+$')::INT), 0) + 1
    INTO v_seq
    FROM invoices
    WHERE tenant_id = p_tenant_id
      AND invoice_number LIKE 'INV-' || v_year || '-%';
  v_number := 'INV-' || v_year || '-' || LPAD(v_seq::TEXT, 5, '0');
  RETURN v_number;
END;
$$;

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE PLPGSQL AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
