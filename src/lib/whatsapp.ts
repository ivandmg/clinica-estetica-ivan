/** Arma un link de WhatsApp con texto prellenado. `number` solo dígitos con código de país. */
export function whatsappLink(number: string, text?: string): string {
  const digits = number.replace(/\D/g, "");
  const base = `https://wa.me/${digits}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
