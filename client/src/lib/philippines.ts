// Philippine localization utilities

/**
 * Format a Philippine phone number to canonical form (+63XXXXXXXXXX)
 * Accepts: +63XXXXXXXXXX, 09XXXXXXXXX, 9XXXXXXXXX
 */
export function formatPhilippinePhone(phone: string): string {
  if (!phone) return "";
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");
  
  // Handle different formats
  if (digits.startsWith("63")) {
    return `+${digits}`;
  } else if (digits.startsWith("9") && digits.length === 10) {
    return `+63${digits}`;
  } else if (digits.startsWith("0") && digits.length === 11) {
    return `+63${digits.substring(1)}`;
  }
  
  return phone; // Return as-is if format doesn't match
}

/**
 * Display Philippine phone number in user-friendly format
 * +63 XXX-XXXX-XXXX or 09XX-XXX-XXXX
 */
export function displayPhilippinePhone(phone: string): string {
  if (!phone) return "";
  
  const canonical = formatPhilippinePhone(phone);
  if (canonical.startsWith("+63") && canonical.length === 13) {
    const number = canonical.substring(3);
    return `+63 ${number.substring(0, 3)}-${number.substring(3, 7)}-${number.substring(7)}`;
  }
  
  return phone;
}

/**
 * Validate Philippine phone number format
 */
export function isValidPhilippinePhone(phone: string): boolean {
  if (!phone) return true; // Optional field
  
  const phoneRegex = /^(\+63|0)9\d{2}-?\d{3}-?\d{4}$/;
  const digitsOnly = /^(\+63|0)?9\d{9}$/;
  
  return phoneRegex.test(phone) || digitsOnly.test(phone);
}

/**
 * Format currency in Philippine Peso
 */
export function formatPeso(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "Not specified";
  
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format salary range in Philippine Peso
 */
export function formatPesoRange(min: number | null, max: number | null): string {
  if (!min && !max) return "Not specified";
  if (min && max) {
    return `${formatPeso(min)} - ${formatPeso(max)}`;
  }
  if (min) return `From ${formatPeso(min)}`;
  if (max) return `Up to ${formatPeso(max)}`;
  return "Not specified";
}

/**
 * Parse date to YYYY-MM format
 */
export function formatYearMonth(date: Date | undefined): string {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Parse date to YYYY format
 */
export function formatYear(date: Date | undefined): string {
  if (!date) return "";
  return String(date.getFullYear());
}

/**
 * Parse YYYY-MM string to Date
 */
export function parseYearMonth(yearMonth: string): Date | undefined {
  if (!yearMonth) return undefined;
  const [year, month] = yearMonth.split('-');
  if (!year || !month) return undefined;
  return new Date(parseInt(year), parseInt(month) - 1, 1);
}

/**
 * Parse YYYY string to Date
 */
export function parseYear(year: string): Date | undefined {
  if (!year) return undefined;
  const yearNum = parseInt(year);
  if (isNaN(yearNum)) return undefined;
  return new Date(yearNum, 0, 1);
}
