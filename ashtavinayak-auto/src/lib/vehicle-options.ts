export const VEHICLE_TYPE_OPTIONS = [
  { value: "CAR", label: "Car" },
  { value: "BIKE", label: "Bike" },
  { value: "SCOOTER", label: "Scooter" },
  { value: "BUS", label: "Bus" },
  { value: "COMMERCIAL", label: "Commercial Vehicle" },
  { value: "OTHER", label: "Other" },
] as const;

export const FUEL_TYPE_OPTIONS = [
  { value: "PETROL", label: "Petrol" },
  { value: "DIESEL", label: "Diesel" },
  { value: "CNG", label: "CNG" },
  { value: "ELECTRIC", label: "Electric" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "LPG", label: "LPG" },
  { value: "OTHER", label: "Other" },
] as const;

export const TRANSMISSION_OPTIONS = [
  { value: "MANUAL", label: "Manual" },
  { value: "AUTOMATIC", label: "Automatic" },
  { value: "AMT", label: "AMT" },
  { value: "CVT", label: "CVT" },
  { value: "DCT", label: "DCT" },
  { value: "OTHER", label: "Other" },
] as const;

export const CONDITION_OPTIONS = [
  { value: "EXCELLENT", label: "Excellent" },
  { value: "GOOD", label: "Good" },
  { value: "AVERAGE", label: "Average" },
  { value: "NEEDS_REPAIR", label: "Needs Repair" },
] as const;

export const PREFERRED_CONTACT_OPTIONS = [
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "PHONE", label: "Phone" },
  { value: "EMAIL", label: "Email" },
] as const;

export const VEHICLE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_REVIEW: "Pending Review",
  LISTED: "Listed",
  RESERVED: "Reserved",
  SOLD: "Sold",
  REJECTED: "Rejected",
  ARCHIVED: "Archived",
};

export const SUBMISSION_STATUS_LABELS: Record<string, string> = {
  PENDING_REVIEW: "Pending Review",
  UNDER_REVIEW: "Under Review",
  MORE_INFORMATION_REQUIRED: "More Information Required",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export const ENQUIRY_STATUS_LABELS: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  FOLLOW_UP: "Follow Up",
  INTERESTED: "Interested",
  CLOSED: "Closed",
  NOT_INTERESTED: "Not Interested",
};

export const ENQUIRY_STATUS_OPTIONS = Object.entries(ENQUIRY_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export const CALLBACK_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  CONTACTED: "Contacted",
  CLOSED: "Closed",
};

export const CALLBACK_STATUS_OPTIONS = Object.entries(CALLBACK_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));
