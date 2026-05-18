import { MESSAGE_TEMPLATES } from "./constants";
import type { Application } from "./types";

export function buildWhatsAppUrl(phone: string, message: string): string {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/91${phone}?text=${encoded}`;
}

export function openWhatsApp(phone: string, message: string) {
  window.open(buildWhatsAppUrl(phone, message), "_blank");
}

export function getMessageForStatus(app: Application): string {
  switch (app.status) {
    case "new":
      return MESSAGE_TEMPLATES.new(app.student_name, app.app_id);
    case "contacted":
      return MESSAGE_TEMPLATES.contacted(app.parent_name, app.student_name);
    case "meeting_fixed":
      return MESSAGE_TEMPLATES.meeting_fixed(
        app.student_name,
        app.meeting_date || "TBD",
        app.meeting_time || "TBD"
      );
    case "confirmed":
      return MESSAGE_TEMPLATES.confirmed(app.student_name, app.course);
    case "archived":
      return MESSAGE_TEMPLATES.archived(app.app_id);
    default:
      return MESSAGE_TEMPLATES.new(app.student_name, app.app_id);
  }
}
