-- ============================================================
-- SilverCare Thailand - Migration 002
-- Rooms, Beds, Daily Care Records, Incidents, Invoice Items,
-- Payment Records, Notification Log, Translation Resources
-- ============================================================

-- 7. ROOMS
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name_en TEXT NOT NULL,
  name_th TEXT NOT NULL,
  floor INT NOT NULL DEFAULT 1,
  room_type VARCHAR(20) NOT NULL DEFAULT 'private' CHECK (room_type IN ('private','semi_private','ward','suite')),
  notes TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_rooms_facility ON rooms(facility_id);

-- 8. BEDS
CREATE TABLE IF NOT EXISTS beds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  bed_number VARCHAR(10) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'vacant' CHECK (status IN ('vacant','occupied','maintenance','reserved')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(room_id, bed_number)
);
CREATE INDEX idx_beds_facility ON beds(facility_id);
CREATE INDEX idx_beds_room ON beds(room_id);
CREATE INDEX idx_beds_status ON beds(status);

-- Link resident to bed
ALTER TABLE patients ADD COLUMN IF NOT EXISTS bed_id UUID REFERENCES beds(id) ON DELETE SET NULL;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS romanized_name TEXT DEFAULT '';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS language_preference VARCHAR(10) NOT NULL DEFAULT 'th' CHECK (language_preference IN ('th','en'));
ALTER TABLE patients ADD COLUMN IF NOT EXISTS guardian_name TEXT DEFAULT '';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS guardian_relation TEXT DEFAULT '';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS guardian_phone TEXT DEFAULT '';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS guardian_email TEXT DEFAULT '';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS guardian_country TEXT DEFAULT 'TH';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS guardian_language VARCHAR(10) DEFAULT 'th' CHECK (guardian_language IN ('th','en'));
ALTER TABLE patients ADD COLUMN IF NOT EXISTS admission_date DATE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS discharge_date DATE;

-- 9. DAILY CARE RECORDS
CREATE TABLE IF NOT EXISTS daily_care_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  resident_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  care_date DATE NOT NULL,
  shift VARCHAR(10) NOT NULL CHECK (shift IN ('morning','afternoon','evening','all_day')),
  meal_status VARCHAR(20) DEFAULT '' CHECK (meal_status IN ('','complete','partial','none')),
  medication_given BOOLEAN NOT NULL DEFAULT false,
  medication_notes TEXT DEFAULT '',
  bathroom_assist BOOLEAN NOT NULL DEFAULT false,
  bathing_assist BOOLEAN NOT NULL DEFAULT false,
  mobility_assist BOOLEAN NOT NULL DEFAULT false,
  mood VARCHAR(20) DEFAULT '' CHECK (mood IN ('','happy','neutral','sad','anxious','agitated')),
  temperature DECIMAL(4,1),
  blood_pressure_systolic INT,
  blood_pressure_diastolic INT,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_dcr_facility ON daily_care_records(facility_id);
CREATE INDEX idx_dcr_resident ON daily_care_records(resident_id);
CREATE INDEX idx_dcr_date ON daily_care_records(resident_id, care_date);

-- 10. INCIDENTS (Falls, Hospital Visits, Emergencies)
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  resident_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  incident_type VARCHAR(30) NOT NULL CHECK (incident_type IN ('fall','hospital_visit','emergency','injury','behavioral','medication_error','other')),
  severity VARCHAR(10) NOT NULL DEFAULT 'minor' CHECK (severity IN ('minor','moderate','severe','critical')),
  title_en TEXT NOT NULL,
  title_th TEXT NOT NULL,
  description_en TEXT NOT NULL,
  description_th TEXT NOT NULL,
  incident_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  location_en TEXT DEFAULT '',
  location_th TEXT DEFAULT '',
  attachment_path TEXT DEFAULT '',
  guardian_notified BOOLEAN NOT NULL DEFAULT false,
  guardian_notified_at TIMESTAMPTZ,
  follow_up_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_incidents_facility ON incidents(facility_id);
CREATE INDEX idx_incidents_resident ON incidents(resident_id);
CREATE INDEX idx_incidents_type ON incidents(incident_type);

-- 11. INVOICE ITEMS (Line items for each invoice)
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description_en TEXT NOT NULL,
  description_th TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL CHECK (unit_price >= 0),
  amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
  category VARCHAR(30) NOT NULL CHECK (category IN ('room','meal','nursing','therapy','medication','transport','other')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);

-- 12. PAYMENT RECORDS
CREATE TABLE IF NOT EXISTS payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  resident_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'THB',
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash','bank_transfer','promptpay','credit_card','debit_card','other')),
  payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  reference_code TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payment_facility ON payment_records(facility_id);
CREATE INDEX idx_payment_invoice ON payment_records(invoice_id);
CREATE INDEX idx_payment_resident ON payment_records(resident_id);

-- 13. NOTIFICATION LOG (General - email, Line, SMS)
CREATE TABLE IF NOT EXISTS notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  resident_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  recipient_type VARCHAR(10) NOT NULL CHECK (recipient_type IN ('email','line','sms','push')),
  recipient_address TEXT NOT NULL,
  notification_type VARCHAR(30) NOT NULL CHECK (notification_type IN ('daily_summary','weekly_summary','monthly_summary','incident_alert','billing_reminder','payment_receipt','appointment_reminder','general')),
  subject_en TEXT NOT NULL,
  subject_th TEXT NOT NULL,
  body_en TEXT NOT NULL,
  body_th TEXT NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed','clicked')),
  error_message TEXT DEFAULT '',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notif_facility ON notification_log(facility_id);
CREATE INDEX idx_notif_resident ON notification_log(resident_id);
CREATE INDEX idx_notif_type ON notification_log(notification_type);

-- 14. TRANSLATION RESOURCES (for dynamic multi-language content)
CREATE TABLE IF NOT EXISTS translation_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  resource_key TEXT NOT NULL,
  context TEXT DEFAULT '',
  en TEXT NOT NULL,
  th TEXT NOT NULL,
  is_core BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(facility_id, resource_key)
);
CREATE INDEX idx_trans_key ON translation_resources(resource_key);

-- ============================================================
-- RLS POLICIES FOR NEW TABLES
-- ============================================================

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_care_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_resources ENABLE ROW LEVEL SECURITY;

-- ROOMS
CREATE POLICY rooms_facility_select ON rooms FOR SELECT USING (
  facility_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY rooms_facility_insert ON rooms FOR INSERT WITH CHECK (
  facility_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('admin','manager'))
);
CREATE POLICY rooms_facility_update ON rooms FOR UPDATE USING (
  facility_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('admin','manager'))
);

-- BEDS
CREATE POLICY beds_facility_select ON beds FOR SELECT USING (
  facility_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY beds_facility_insert ON beds FOR INSERT WITH CHECK (
  facility_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('admin','manager'))
);
CREATE POLICY beds_facility_update ON beds FOR UPDATE USING (
  facility_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('admin','manager','staff'))
);

-- DAILY CARE RECORDS
CREATE POLICY dcr_facility_select ON daily_care_records FOR SELECT USING (
  facility_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY dcr_facility_insert ON daily_care_records FOR INSERT WITH CHECK (
  facility_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('admin','manager','staff'))
);
CREATE POLICY dcr_facility_update ON daily_care_records FOR UPDATE USING (
  facility_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('admin','manager','staff'))
);

-- INCIDENTS
CREATE POLICY incidents_facility_select ON incidents FOR SELECT USING (
  facility_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY incidents_facility_insert ON incidents FOR INSERT WITH CHECK (
  facility_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('admin','manager','staff'))
);
CREATE POLICY incidents_facility_update ON incidents FOR UPDATE USING (
  facility_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('admin','manager'))
);

-- INVOICE ITEMS
CREATE POLICY inv_items_select ON invoice_items FOR SELECT USING (
  invoice_id IN (SELECT id FROM invoices WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
);
CREATE POLICY inv_items_insert ON invoice_items FOR INSERT WITH CHECK (
  invoice_id IN (SELECT id FROM invoices WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
);

-- PAYMENT RECORDS
CREATE POLICY payment_facility_select ON payment_records FOR SELECT USING (
  facility_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY payment_facility_insert ON payment_records FOR INSERT WITH CHECK (
  facility_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('admin','manager'))
);

-- NOTIFICATION LOG
CREATE POLICY notif_facility_select ON notification_log FOR SELECT USING (
  facility_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY notif_facility_insert ON notification_log FOR INSERT WITH CHECK (
  facility_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
);

-- TRANSLATION RESOURCES
CREATE POLICY trans_facility_select ON translation_resources FOR SELECT USING (
  facility_id IS NULL OR facility_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY trans_facility_insert ON translation_resources FOR INSERT WITH CHECK (
  facility_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('admin'))
);

-- Update role enum to include manager/staff/family
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin','manager','staff','family','doctor','nurse'));

-- ============================================================
-- HELPER: generate report template
-- ============================================================
CREATE OR REPLACE FUNCTION generate_daily_summary(p_resident_id UUID, p_date DATE)
RETURNS TEXT LANGUAGE PLPGSQL AS $$
DECLARE
  v_record daily_care_records%ROWTYPE;
  v_report TEXT;
BEGIN
  SELECT * INTO v_record FROM daily_care_records
    WHERE resident_id = p_resident_id AND care_date = p_date
    LIMIT 1;

  IF NOT FOUND THEN
    RETURN 'No care records for this date.';
  END IF;

  v_report := format(
    'Meal: %s | Medication: %s | Bathroom Assist: %s | Bathing Assist: %s | Mood: %s',
    COALESCE(v_record.meal_status, 'none'),
    CASE WHEN v_record.medication_given THEN 'Yes' ELSE 'No' END,
    CASE WHEN v_record.bathroom_assist THEN 'Yes' ELSE 'No' END,
    CASE WHEN v_record.bathing_assist THEN 'Yes' ELSE 'No' END,
    COALESCE(v_record.mood, 'not recorded')
  );

  RETURN v_report;
END;
$$;
