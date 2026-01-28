/**
 * Currency formatting utilities
 * 
 * Provides functions for formatting numeric values as USD currency strings
 * with locale-aware formatting.
 */

/**
 * Format a number as USD currency
 * 
 * @param value - Numeric value to format
 * @returns Formatted currency string (e.g., "$1,234.50")
 * 
 * @example
 * formatCurrency(1234.5)  // Returns "$1,234.50"
 * formatCurrency(0)       // Returns "$0.00"
 * formatCurrency(null)    // Returns ""
 * formatCurrency(undefined) // Returns ""
 * 
 * Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
