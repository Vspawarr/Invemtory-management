import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";

export function WhatsAppButton({
  href,
  children,
  size = "default",
  className,
}: {
  href: string;
  children: React.ReactNode;
  size?: ButtonProps["size"];
  className?: string;
}) {
  return (
    <Button asChild variant="whatsapp" size={size} className={className}>
      <Link href={href} target="_blank" rel="noopener noreferrer">
        <MessageCircle className="h-4 w-4" />
        {children}
      </Link>
    </Button>
  );
}
