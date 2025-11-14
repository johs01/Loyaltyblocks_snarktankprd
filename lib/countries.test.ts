/**
 * Tests for Countries Data
 *
 * Tests country data structure and lookup functions
 */

import { COUNTRIES, getCountryByCode, getCountryByName, getCountryByDialCode } from "./countries";

describe("Countries Data", () => {
  describe("COUNTRIES array", () => {
    it("should have at least 40 countries", () => {
      expect(COUNTRIES.length).toBeGreaterThanOrEqual(40);
    });

    it("should have unique country codes", () => {
      const codes = COUNTRIES.map((c) => c.code);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(codes.length);
    });

    it("should have unique country names", () => {
      const names = COUNTRIES.map((c) => c.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });

    it("should have valid 2-letter ISO codes", () => {
      COUNTRIES.forEach((country) => {
        expect(country.code).toMatch(/^[A-Z]{2}$/);
      });
    });

    it("should have dial codes starting with +", () => {
      COUNTRIES.forEach((country) => {
        expect(country.dialCode).toMatch(/^\+\d+$/);
      });
    });

    it("should have format patterns", () => {
      COUNTRIES.forEach((country) => {
        expect(country.format).toBeDefined();
        expect(typeof country.format).toBe("string");
      });
    });

    it("should include United States", () => {
      const us = COUNTRIES.find((c) => c.code === "US");
      expect(us).toBeDefined();
      expect(us?.name).toBe("United States");
      expect(us?.dialCode).toBe("+1");
    });

    it("should include Canada", () => {
      const ca = COUNTRIES.find((c) => c.code === "CA");
      expect(ca).toBeDefined();
      expect(ca?.name).toBe("Canada");
      expect(ca?.dialCode).toBe("+1");
    });

    it("should include United Kingdom", () => {
      const gb = COUNTRIES.find((c) => c.code === "GB");
      expect(gb).toBeDefined();
      expect(gb?.name).toBe("United Kingdom");
      expect(gb?.dialCode).toBe("+44");
    });

    it("should have consistent data structure", () => {
      COUNTRIES.forEach((country) => {
        expect(country).toHaveProperty("code");
        expect(country).toHaveProperty("name");
        expect(country).toHaveProperty("dialCode");
        expect(country).toHaveProperty("format");
      });
    });
  });

  describe("getCountryByCode", () => {
    it("should find country by valid code", () => {
      const us = getCountryByCode("US");
      expect(us).toBeDefined();
      expect(us?.name).toBe("United States");
    });

    it("should return undefined for invalid code", () => {
      const invalid = getCountryByCode("XX");
      expect(invalid).toBeUndefined();
    });

    it("should be case-sensitive", () => {
      const lowercase = getCountryByCode("us");
      expect(lowercase).toBeUndefined();
    });

    it("should find all countries by their codes", () => {
      COUNTRIES.forEach((country) => {
        const found = getCountryByCode(country.code);
        expect(found).toBeDefined();
        expect(found?.code).toBe(country.code);
      });
    });
  });

  describe("getCountryByName", () => {
    it("should find country by valid name", () => {
      const us = getCountryByName("United States");
      expect(us).toBeDefined();
      expect(us?.code).toBe("US");
    });

    it("should return undefined for invalid name", () => {
      const invalid = getCountryByName("Invalid Country");
      expect(invalid).toBeUndefined();
    });

    it("should be case-sensitive", () => {
      const lowercase = getCountryByName("united states");
      expect(lowercase).toBeUndefined();
    });

    it("should find all countries by their names", () => {
      COUNTRIES.forEach((country) => {
        const found = getCountryByName(country.name);
        expect(found).toBeDefined();
        expect(found?.name).toBe(country.name);
      });
    });
  });

  describe("getCountryByDialCode", () => {
    it("should find country by valid dial code", () => {
      const countries = getCountryByDialCode("+44");
      expect(countries.length).toBeGreaterThan(0);
      expect(countries.some((c) => c.code === "GB")).toBe(true);
    });

    it("should return empty array for invalid dial code", () => {
      const invalid = getCountryByDialCode("+999");
      expect(invalid).toHaveLength(0);
    });

    it("should handle dial codes shared by multiple countries", () => {
      const northAmerica = getCountryByDialCode("+1");
      expect(northAmerica.length).toBeGreaterThanOrEqual(2);
      expect(northAmerica.some((c) => c.code === "US")).toBe(true);
      expect(northAmerica.some((c) => c.code === "CA")).toBe(true);
    });

    it("should find countries for all unique dial codes", () => {
      const uniqueDialCodes = [...new Set(COUNTRIES.map((c) => c.dialCode))];
      uniqueDialCodes.forEach((dialCode) => {
        const found = getCountryByDialCode(dialCode);
        expect(found.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Phone format patterns", () => {
    it("should have # placeholders in format patterns", () => {
      COUNTRIES.forEach((country) => {
        expect(country.format).toMatch(/#/);
      });
    });

    it("should have valid US format pattern", () => {
      const us = getCountryByCode("US");
      expect(us?.format).toMatch(/\(###\) ###-####/);
    });

    it("should have valid UK format pattern", () => {
      const gb = getCountryByCode("GB");
      expect(gb?.format).toBeDefined();
      expect(gb?.format.length).toBeGreaterThan(0);
    });
  });

  describe("Data integrity", () => {
    it("should not have empty strings", () => {
      COUNTRIES.forEach((country) => {
        expect(country.code.trim()).toBe(country.code);
        expect(country.name.trim()).toBe(country.name);
        expect(country.dialCode.trim()).toBe(country.dialCode);
        expect(country.format.trim()).toBe(country.format);
        expect(country.code).not.toBe("");
        expect(country.name).not.toBe("");
        expect(country.dialCode).not.toBe("");
        expect(country.format).not.toBe("");
      });
    });

    it("should have consistent naming conventions", () => {
      COUNTRIES.forEach((country) => {
        // Country names should start with capital letter
        expect(country.name[0]).toMatch(/[A-Z]/);
      });
    });

    it("should be sorted alphabetically by name", () => {
      const names = COUNTRIES.map((c) => c.name);
      const sortedNames = [...names].sort();
      expect(names).toEqual(sortedNames);
    });
  });
});
