export type Tenant = {
  id: string;
  name_en: string;
  name_th: string;
  tax_id: string;
  address_en: string;
  address_th: string;
  phone: string;
  email: string;
  is_active: boolean;
  created_at: string;
};

export type UserRole = 'admin' | 'manager' | 'staff' | 'family' | 'doctor' | 'nurse';

export type Profile = {
  id: string;
  tenant_id: string;
  email: string;
  role: UserRole;
  full_name_en: string;
  full_name_th: string;
  phone: string;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
};

export type Patient = {
  id: string;
  tenant_id: string;
  bed_id: string | null;
  first_name_en: string;
  first_name_th: string;
  last_name_en: string;
  last_name_th: string;
  romanized_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  national_id: string;
  phone: string;
  blood_type: string;
  allergies: string;
  chronic_diseases: string;
  medications: string;
  language_preference: 'th' | 'en';
  guardian_name: string;
  guardian_relation: string;
  guardian_phone: string;
  guardian_email: string;
  guardian_country: string;
  guardian_language: 'th' | 'en';
  admission_date: string | null;
  discharge_date: string | null;
  notes: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Room = {
  id: string;
  facility_id: string;
  name_en: string;
  name_th: string;
  floor: number;
  room_type: 'private' | 'semi_private' | 'ward' | 'suite';
  notes: string;
  is_active: boolean;
  created_at: string;
};

export type Bed = {
  id: string;
  facility_id: string;
  room_id: string;
  bed_number: string;
  status: 'vacant' | 'occupied' | 'maintenance' | 'reserved';
  notes: string;
  created_at: string;
};

export type DailyCareRecord = {
  id: string;
  facility_id: string;
  resident_id: string;
  staff_id: string;
  care_date: string;
  shift: 'morning' | 'afternoon' | 'evening' | 'all_day';
  meal_status: '' | 'complete' | 'partial' | 'none';
  medication_given: boolean;
  medication_notes: string;
  bathroom_assist: boolean;
  bathing_assist: boolean;
  mobility_assist: boolean;
  mood: '' | 'happy' | 'neutral' | 'sad' | 'anxious' | 'agitated';
  temperature: number | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  notes: string;
  created_at: string;
};

export type Incident = {
  id: string;
  facility_id: string;
  resident_id: string;
  reported_by: string;
  incident_type: 'fall' | 'hospital_visit' | 'emergency' | 'injury' | 'behavioral' | 'medication_error' | 'other';
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  title_en: string;
  title_th: string;
  description_en: string;
  description_th: string;
  incident_date: string;
  location_en: string;
  location_th: string;
  attachment_path: string;
  guardian_notified: boolean;
  guardian_notified_at: string | null;
  follow_up_notes: string;
  created_at: string;
  updated_at: string;
};

export type Appointment = {
  id: string;
  tenant_id: string;
  patient_id: string;
  doctor_id: string;
  title_en: string;
  title_th: string;
  description_en: string;
  description_th: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  location_en: string;
  location_th: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type Invoice = {
  id: string;
  tenant_id: string;
  patient_id: string;
  invoice_number: string;
  amount: number;
  amount_thai_text: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  payment_method: 'cash' | 'promptpay' | 'bank_transfer' | 'credit_card';
  promptpay_qr_data: string | null;
  line_notify_sent: boolean;
  issued_at: string;
  paid_at: string | null;
  due_date: string;
  created_at: string;
  updated_at: string;
};

export type InvoiceItem = {
  id: string;
  invoice_id: string;
  description_en: string;
  description_th: string;
  quantity: number;
  unit_price: number;
  amount: number;
  category: 'room' | 'meal' | 'nursing' | 'therapy' | 'medication' | 'transport' | 'other';
  created_at: string;
};

export type PaymentRecord = {
  id: string;
  facility_id: string;
  invoice_id: string | null;
  resident_id: string;
  amount: number;
  currency: string;
  payment_method: 'cash' | 'bank_transfer' | 'promptpay' | 'credit_card' | 'debit_card' | 'other';
  payment_date: string;
  reference_code: string;
  notes: string;
  created_at: string;
};

export type NotificationLog = {
  id: string;
  facility_id: string;
  resident_id: string | null;
  recipient_type: 'email' | 'line' | 'sms' | 'push';
  recipient_address: string;
  notification_type: 'daily_summary' | 'weekly_summary' | 'monthly_summary' | 'incident_alert' | 'billing_reminder' | 'payment_receipt' | 'appointment_reminder' | 'general';
  subject_en: string;
  subject_th: string;
  body_en: string;
  body_th: string;
  status: 'pending' | 'sent' | 'failed' | 'clicked';
  error_message: string;
  sent_at: string | null;
  created_at: string;
};

export type TranslationResource = {
  id: string;
  facility_id: string | null;
  resource_key: string;
  context: string;
  en: string;
  th: string;
  is_core: boolean;
  created_at: string;
};

export type Locale = 'en' | 'th';
