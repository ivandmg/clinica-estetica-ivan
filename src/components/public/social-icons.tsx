// Íconos de marcas (lucide no incluye logos de marcas).
type IconProps = React.SVGProps<SVGSVGElement>;

export function InstagramIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FacebookIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M13.5 21v-7.5h2.53l.38-2.94H13.5V8.68c0-.85.24-1.43 1.46-1.43h1.56V4.62a20.9 20.9 0 0 0-2.27-.12c-2.25 0-3.79 1.37-3.79 3.9v2.16H7.92v2.94h2.54V21h3.04Z" />
    </svg>
  );
}

export function TikTokIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M16.6 3c.32 2.1 1.6 3.55 3.9 3.72v2.9a7.1 7.1 0 0 1-3.84-1.18v5.94c0 3.55-2.57 5.62-5.47 5.62A5.37 5.37 0 0 1 6 14.62c0-3.33 2.86-5.67 6.3-5.17v3.05c-1.56-.36-3.27.46-3.27 2.13 0 1.32 1.03 2.3 2.29 2.3 1.4 0 2.4-.9 2.4-2.67V3h2.88Z" />
    </svg>
  );
}

export function WhatsAppIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12.04 2.5a9.43 9.43 0 0 0-8.1 14.26L2.5 21.5l4.87-1.4a9.43 9.43 0 1 0 4.67-17.6Zm0 17.2a7.74 7.74 0 0 1-3.97-1.1l-.28-.17-2.89.83.85-2.8-.19-.3a7.77 7.77 0 1 1 6.48 3.54Zm4.26-5.8c-.23-.12-1.38-.68-1.6-.76-.21-.08-.37-.12-.52.12-.16.23-.6.76-.74.91-.13.16-.27.18-.5.06a6.4 6.4 0 0 1-1.88-1.16 7.06 7.06 0 0 1-1.3-1.62c-.14-.23-.02-.36.1-.47.1-.1.23-.27.35-.4.11-.14.15-.24.23-.4.08-.15.04-.29-.02-.4-.06-.12-.52-1.26-.72-1.72-.19-.45-.38-.39-.52-.4h-.45a.86.86 0 0 0-.62.3 2.6 2.6 0 0 0-.82 1.93c0 1.14.83 2.24.95 2.4.11.15 1.63 2.49 3.95 3.49.55.24.98.38 1.32.49.55.17 1.06.15 1.46.09.44-.07 1.38-.57 1.58-1.11.19-.55.19-1.01.13-1.11-.06-.1-.21-.16-.44-.28Z" />
    </svg>
  );
}
