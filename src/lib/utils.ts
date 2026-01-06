import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Trunca un número a 1 decimal (sin redondear) y lo formatea con coma como separador decimal
 * Ejemplo: 0.98 -> "0,9" (no "1,0")
 */
export function truncateTo1Decimal(value: number): string {
  const truncated = Math.floor(value * 10) / 10;
  return truncated.toString().replace(".", ",");
}
