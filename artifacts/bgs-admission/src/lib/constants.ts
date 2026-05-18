export const COLLEGE_NAME = "BGS PU College";
export const COLLEGE_LOCATION = "Hanumanthpura, Shidlaghatta, Karnataka 562105";
export const COLLEGE_CODE = "MC0118";
export const COLLEGE_FULL_NAME = `${COLLEGE_NAME}, ${COLLEGE_LOCATION}`;

export const VILLAGES = [
  "Shidlaghatta",
  "Hanumanthpura",
  "Gowribidanur",
  "Bagepalli",
  "Gudibanda",
  "Chintamani",
  "Sidlaghatta",
  "Chickballapur",
  "Gauribidanur",
  "Vijayapura",
  "Manchenahalli",
  "Budigere",
  "Doddaballapur",
  "Devanahalli",
  "Nandi Hills",
  "Muddenahalli",
  "Kanivenarayanapura",
  "Thondebhavi",
  "Kasaba Hobli",
  "Other",
];

export const COURSES = [
  { value: "PCMB", label: "PCMB (Physics, Chemistry, Maths, Biology)" },
  { value: "PCMCS", label: "PCMCS (Physics, Chemistry, Maths, Computer Science)" },
  { value: "CEBA", label: "CEBA (Commerce, Economics, Business Studies, Accountancy)" },
  { value: "CEBAC", label: "CEBAC (Commerce, Economics, Business Studies, Accountancy, Computer)" },
  { value: "Arts", label: "Arts (History, Political Science, Economics, Kannada)" },
];

export const STATUS_LABELS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  meeting_fixed: "Meeting Fixed",
  confirmed: "Confirmed",
  archived: "Archived",
};

export const STATUS_COLORS: Record<string, string> = {
  new: "bg-gray-100 text-gray-700",
  contacted: "bg-blue-100 text-blue-700",
  meeting_fixed: "bg-amber-100 text-amber-700",
  confirmed: "bg-green-100 text-green-700",
  archived: "bg-red-100 text-red-700",
};

export const MESSAGE_TEMPLATES = {
  new: (student: string, id: string) =>
    `BGS College: We received ${student}'s application (ID: ${id}). We will contact you within 2 days. -BGS Hanumanthpura`,
  contacted: (parent: string, student: string) =>
    `BGS College: Hello ${parent}, regarding ${student}'s admission. When can you visit campus? -BGS Hanumanthpura`,
  meeting_fixed: (student: string, date: string, time: string) =>
    `BGS College: Meeting for ${student} on ${date} at ${time}. BGS PU College, Hanumanthpura. Bring: Marks Card, TC, Aadhaar, 4 Photos. -BGS Hanumanthpura`,
  confirmed: (student: string, course: string) =>
    `🎉 BGS College: ${student} CONFIRMED for ${course}! Welcome! Class starts soon. -BGS Hanumanthpura`,
  archived: (id: string) =>
    `BGS College: Application ${id} closed. Thank you. Best wishes. -BGS Hanumanthpura`,
};

export const ADMISSION_YEAR = "2026";
