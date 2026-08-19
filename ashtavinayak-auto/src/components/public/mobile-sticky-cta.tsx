import Link from "next/link";
import { Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MobileStickyCta({
  phone,
  whatsappLink,
  enquireHref = "#enquire",
}: {
  phone: string;
  whatsappLink: string;
  enquireHref?: string;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t bg-background p-2 shadow-[0_-2px_8px_rgba(0,0,0,0.08)] lg:hidden">
      {phone && (
        <Button asChild variant="outline" className="flex-1">
          <a href={`tel:${phone}`}>
            <Phone className="h-4 w-4" /> Call
          </a>
        </Button>
      )}
      <Button asChild variant="whatsapp" className="flex-1">
        <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
          <MessageCircle className="h-4 w-4" /> WhatsApp
        </a>
      </Button>
      <Button asChild className="flex-1">
        <Link href={enquireHref}>Enquire</Link>
      </Button>
    </div>
  );
}
