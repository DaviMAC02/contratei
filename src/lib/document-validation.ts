export function validateCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, "");

  // Check if has 11 digits
  if (cleaned.length !== 11) return false;

  // Check if all digits are the same
  if (/^(\d)\1+$/.test(cleaned)) return false;

  // Validate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let checkDigit = 11 - (sum % 11);
  if (checkDigit >= 10) checkDigit = 0;
  if (checkDigit !== parseInt(cleaned.charAt(9))) return false;

  // Validate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  checkDigit = 11 - (sum % 11);
  if (checkDigit >= 10) checkDigit = 0;
  if (checkDigit !== parseInt(cleaned.charAt(10))) return false;

  return true;
}

export function validateCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, "");

  // Check if has 14 digits
  if (cleaned.length !== 14) return false;

  // Check if all digits are the same
  if (/^(\d)\1+$/.test(cleaned)) return false;

  // Validate first check digit
  let length = 12;
  let numbers = cleaned.substring(0, length);
  let digits = cleaned.substring(length);
  let sum = 0;
  let pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  // Validate second check digit
  length = 13;
  numbers = cleaned.substring(0, length);
  sum = 0;
  pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;

  return true;
}

export function formatCPF(value: string): string {
  const cleaned = value.replace(/\D/g, "");
  const match = cleaned.match(/(\d{0,3})(\d{0,3})(\d{0,3})(\d{0,2})/);
  if (!match) return value;
  const formatted = [match[1], match[2], match[3], match[4]]
    .filter(Boolean)
    .join(".");
  return formatted.replace(/\.(\d{2})$/, "-$1");
}

export function formatCNPJ(value: string): string {
  const cleaned = value.replace(/\D/g, "");
  const match = cleaned.match(/(\d{0,2})(\d{0,3})(\d{0,3})(\d{0,4})(\d{0,2})/);
  if (!match) return value;
  let formatted = match[1];
  if (match[2]) formatted += "." + match[2];
  if (match[3]) formatted += "." + match[3];
  if (match[4]) formatted += "/" + match[4];
  if (match[5]) formatted += "-" + match[5];
  return formatted;
}

export function formatCEP(value: string): string {
  const cleaned = value.replace(/\D/g, "");
  const match = cleaned.match(/(\d{0,5})(\d{0,3})/);
  if (!match) return value;
  return match[2] ? `${match[1]}-${match[2]}` : match[1];
}
