import { MessageCircle, Phone } from "lucide-react";
import { telLink, waLink } from "@/lib/contact-links";
import { cn } from "@/lib/utils";

const linkClass =
  "inline-flex items-center gap-1.5 hover:underline focus-visible:underline";

export function PhoneLink({
  phone,
  className,
  showIcon = true,
}: {
  phone: string | null | undefined;
  className?: string;
  showIcon?: boolean;
}) {
  const href = phone ? telLink(phone) : "";
  if (!phone || !href) return <>—</>;
  return (
    <a href={href} className={cn(linkClass, className)} aria-label={`Call ${phone}`}>
      {showIcon && <Phone className="size-3.5 shrink-0" aria-hidden />}
      {phone}
    </a>
  );
}

export function WhatsAppLink({
  phone,
  className,
  showIcon = true,
}: {
  phone: string | null | undefined;
  className?: string;
  showIcon?: boolean;
}) {
  const href = phone ? waLink(phone) : "";
  if (!phone || !href) return <>—</>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(linkClass, className)}
      aria-label={`Open WhatsApp chat with ${phone}`}
    >
      {showIcon && <MessageCircle className="size-3.5 shrink-0" aria-hidden />}
      {phone}
    </a>
  );
}
