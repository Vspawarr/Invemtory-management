"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { waToCustomer } from "@/lib/whatsapp";

export function WhatsAppContactPanel({
  title,
  phone,
  defaultMessage,
}: {
  title: string;
  phone: string;
  defaultMessage: string;
}) {
  const [message, setMessage] = useState(defaultMessage);

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{title}</p>
      <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} />
      <Button asChild variant="whatsapp" className="w-full">
        <a href={waToCustomer(phone, message)} target="_blank" rel="noopener noreferrer">
          <MessageCircle className="h-4 w-4" /> Open WhatsApp
        </a>
      </Button>
    </div>
  );
}
