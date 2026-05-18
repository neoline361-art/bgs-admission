export type StaffRole = "teacher" | "office" | "admin";

export type ApplicationStatus =
  | "new"
  | "contacted"
  | "meeting_fixed"
  | "confirmed"
  | "archived";

export interface Staff {
  id: string;
  username: string;
  name: string;
  pin_hash: string;
  role: StaffRole;
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Application {
  id: string;
  app_id: string;
  student_name: string;
  parent_name: string;
  phone: string;
  alt_phone: string | null;
  village: string;
  current_school: string;
  course: string;
  marks_percent: number | null;
  message: string | null;
  status: ApplicationStatus;
  meeting_date: string | null;
  meeting_time: string | null;
  assigned_teacher_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  assigned_teacher?: Staff | null;
}

export interface StatusLog {
  id: string;
  application_id: string;
  from_status: ApplicationStatus;
  to_status: ApplicationStatus;
  changed_by: string;
  changed_at: string;
  note: string | null;
}

export interface SmsLog {
  id: string;
  application_id: string;
  phone: string;
  message: string;
  channel: "whatsapp" | "sms";
  sent_by: string;
  sent_at: string;
  status: "sent" | "failed" | "pending";
}

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: StaffRole;
  phone: string | null;
}
