/**
 * WhatsApp click-to-chat link builders (V1: no WhatsApp Business API).
 * The business number always comes from NEXT_PUBLIC_WHATSAPP_NUMBER —
 * international format, digits only (e.g. 91XXXXXXXXXX). Never hard-coded.
 */

const BUSINESS_NAME = process.env.NEXT_PUBLIC_BUSINESS_NAME || "Ashtavinayak Auto Consultant";

export function getBusinessWhatsAppNumber(): string {
  return (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/\D/g, "");
}

export function waLink(message: string, number?: string): string {
  const target = (number ?? getBusinessWhatsAppNumber()).replace(/\D/g, "");
  const text = encodeURIComponent(message);
  return `https://wa.me/${target}?text=${text}`;
}

export function waGeneralChat(): string {
  return waLink(`Hello ${BUSINESS_NAME}, I would like to know more about your vehicles.`);
}

export function waSellIntent(): string {
  return waLink(`Hello ${BUSINESS_NAME}, I want to sell my vehicle. Please guide me.`);
}

export function waVehicleEnquiry(vehicle: {
  title: string;
  price: string;
  reference: string;
}): string {
  return waLink(
    `Hello ${BUSINESS_NAME}, I am interested in this vehicle:\n\n${vehicle.title}\nPrice: ${vehicle.price}\nReference: ${vehicle.reference}\n\nPlease share more details.`
  );
}

export function waVehicleInterest(vehicleTitle: string): string {
  return waLink(
    `Hello ${BUSINESS_NAME}, I am interested in ${vehicleTitle}. Please contact me.`
  );
}

export function waSubmissionConfirmation(referenceNumber: string): string {
  return waLink(
    `Hello ${BUSINESS_NAME}, I have submitted my vehicle for sale.\n\nMy submission reference is ${referenceNumber}.\n\nPlease confirm receipt.`
  );
}

export function waStatusShare(referenceNumber: string, statusUrl: string): string {
  return waLink(
    `Hello ${BUSINESS_NAME},\n\nI submitted my vehicle for sale.\n\nReference:\n${referenceNumber}\n\nYou can check the submission status here:\n${statusUrl}`
  );
}

/** Admin → seller/buyer outreach: link to the customer's own number. */
export function waToCustomer(customerPhone: string, message: string): string {
  const digits = customerPhone.replace(/\D/g, "");
  // Assume Indian numbers when no country code was provided
  const withCountry = digits.length === 10 ? `91${digits}` : digits;
  return waLink(message, withCountry);
}
