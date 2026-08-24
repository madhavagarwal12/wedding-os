const INDIA_COUNTRY_CODE = "91";

export function digitsOnly(phone: string) {
  return phone.replace(/\D/g, "");
}

export function telLink(phone: string) {
  const digits = digitsOnly(phone);
  return digits ? `tel:+${withCountryCode(digits)}` : "";
}

export function waLink(phone: string) {
  const digits = digitsOnly(phone);
  return digits ? `https://wa.me/${withCountryCode(digits)}` : "";
}

/**
 * PRD §19 targets India, where mobile numbers are stored as bare 10 digits.
 * Anything longer is assumed to already carry its own country code and is
 * passed through untouched.
 */
function withCountryCode(digits: string) {
  return digits.length === 10 ? `${INDIA_COUNTRY_CODE}${digits}` : digits;
}
