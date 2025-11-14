/**
 * Countries List and Phone Format Mappings
 *
 * Contains list of supported countries with their ISO codes, dial codes,
 * and display format patterns for phone numbers
 */

import type { CountryInfo } from "@/types";

/**
 * List of supported countries with phone formatting information
 * Sorted alphabetically by country name for UI display
 */
export const COUNTRIES: CountryInfo[] = [
  {
    code: "US",
    name: "United States",
    dialCode: "+1",
    format: "(###) ###-####",
  },
  {
    code: "CA",
    name: "Canada",
    dialCode: "+1",
    format: "(###) ###-####",
  },
  {
    code: "GB",
    name: "United Kingdom",
    dialCode: "+44",
    format: "#### ### ####",
  },
  {
    code: "AU",
    name: "Australia",
    dialCode: "+61",
    format: "#### ### ###",
  },
  {
    code: "NZ",
    name: "New Zealand",
    dialCode: "+64",
    format: "### ### ####",
  },
  {
    code: "DE",
    name: "Germany",
    dialCode: "+49",
    format: "#### #######",
  },
  {
    code: "FR",
    name: "France",
    dialCode: "+33",
    format: "# ## ## ## ##",
  },
  {
    code: "IT",
    name: "Italy",
    dialCode: "+39",
    format: "### ### ####",
  },
  {
    code: "ES",
    name: "Spain",
    dialCode: "+34",
    format: "### ## ## ##",
  },
  {
    code: "NL",
    name: "Netherlands",
    dialCode: "+31",
    format: "## ########",
  },
  {
    code: "BE",
    name: "Belgium",
    dialCode: "+32",
    format: "### ## ## ##",
  },
  {
    code: "CH",
    name: "Switzerland",
    dialCode: "+41",
    format: "## ### ## ##",
  },
  {
    code: "AT",
    name: "Austria",
    dialCode: "+43",
    format: "### #######",
  },
  {
    code: "SE",
    name: "Sweden",
    dialCode: "+46",
    format: "##-### ## ##",
  },
  {
    code: "NO",
    name: "Norway",
    dialCode: "+47",
    format: "### ## ###",
  },
  {
    code: "DK",
    name: "Denmark",
    dialCode: "+45",
    format: "## ## ## ##",
  },
  {
    code: "FI",
    name: "Finland",
    dialCode: "+358",
    format: "## ### ## ##",
  },
  {
    code: "IE",
    name: "Ireland",
    dialCode: "+353",
    format: "## ### ####",
  },
  {
    code: "PL",
    name: "Poland",
    dialCode: "+48",
    format: "### ### ###",
  },
  {
    code: "PT",
    name: "Portugal",
    dialCode: "+351",
    format: "### ### ###",
  },
  {
    code: "GR",
    name: "Greece",
    dialCode: "+30",
    format: "### ### ####",
  },
  {
    code: "CZ",
    name: "Czech Republic",
    dialCode: "+420",
    format: "### ### ###",
  },
  {
    code: "HU",
    name: "Hungary",
    dialCode: "+36",
    format: "## ### ####",
  },
  {
    code: "RO",
    name: "Romania",
    dialCode: "+40",
    format: "### ### ###",
  },
  {
    code: "BG",
    name: "Bulgaria",
    dialCode: "+359",
    format: "### ### ###",
  },
  {
    code: "JP",
    name: "Japan",
    dialCode: "+81",
    format: "##-####-####",
  },
  {
    code: "KR",
    name: "South Korea",
    dialCode: "+82",
    format: "##-####-####",
  },
  {
    code: "CN",
    name: "China",
    dialCode: "+86",
    format: "### #### ####",
  },
  {
    code: "IN",
    name: "India",
    dialCode: "+91",
    format: "##### #####",
  },
  {
    code: "SG",
    name: "Singapore",
    dialCode: "+65",
    format: "#### ####",
  },
  {
    code: "MY",
    name: "Malaysia",
    dialCode: "+60",
    format: "##-### ####",
  },
  {
    code: "TH",
    name: "Thailand",
    dialCode: "+66",
    format: "##-###-####",
  },
  {
    code: "ID",
    name: "Indonesia",
    dialCode: "+62",
    format: "###-###-####",
  },
  {
    code: "PH",
    name: "Philippines",
    dialCode: "+63",
    format: "### ### ####",
  },
  {
    code: "VN",
    name: "Vietnam",
    dialCode: "+84",
    format: "### ### ####",
  },
  {
    code: "AE",
    name: "United Arab Emirates",
    dialCode: "+971",
    format: "## ### ####",
  },
  {
    code: "SA",
    name: "Saudi Arabia",
    dialCode: "+966",
    format: "## ### ####",
  },
  {
    code: "IL",
    name: "Israel",
    dialCode: "+972",
    format: "##-###-####",
  },
  {
    code: "TR",
    name: "Turkey",
    dialCode: "+90",
    format: "### ### ## ##",
  },
  {
    code: "ZA",
    name: "South Africa",
    dialCode: "+27",
    format: "## ### ####",
  },
  {
    code: "EG",
    name: "Egypt",
    dialCode: "+20",
    format: "### ### ####",
  },
  {
    code: "BR",
    name: "Brazil",
    dialCode: "+55",
    format: "## #####-####",
  },
  {
    code: "MX",
    name: "Mexico",
    dialCode: "+52",
    format: "### ### ####",
  },
  {
    code: "AR",
    name: "Argentina",
    dialCode: "+54",
    format: "## ####-####",
  },
  {
    code: "CL",
    name: "Chile",
    dialCode: "+56",
    format: "# #### ####",
  },
  {
    code: "CO",
    name: "Colombia",
    dialCode: "+57",
    format: "### ### ####",
  },
  {
    code: "PE",
    name: "Peru",
    dialCode: "+51",
    format: "### ### ###",
  },
];

/**
 * Get country by ISO code
 */
export function getCountryByCode(code: string): CountryInfo | undefined {
  return COUNTRIES.find((country) => country.code === code);
}

/**
 * Get country by name
 */
export function getCountryByName(name: string): CountryInfo | undefined {
  return COUNTRIES.find(
    (country) => country.name.toLowerCase() === name.toLowerCase()
  );
}

/**
 * Get country by dial code
 */
export function getCountryByDialCode(dialCode: string): CountryInfo | undefined {
  // Normalize dial code (ensure it starts with +)
  const normalized = dialCode.startsWith("+") ? dialCode : `+${dialCode}`;
  return COUNTRIES.find((country) => country.dialCode === normalized);
}

/**
 * Get default country (United States)
 */
export function getDefaultCountry(): CountryInfo {
  return COUNTRIES[0]; // United States
}

/**
 * Get sorted countries for dropdown display
 */
export function getSortedCountries(): CountryInfo[] {
  return [...COUNTRIES].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Validate that a country code exists
 */
export function isValidCountryCode(code: string): boolean {
  return COUNTRIES.some((country) => country.code === code);
}

/**
 * Get country display name from code
 */
export function getCountryName(code: string): string {
  const country = getCountryByCode(code);
  return country?.name || code;
}
