/**
 * Tests for PhoneInput Component
 *
 * Tests phone input component with validation and availability checking
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PhoneInput from "./PhoneInput";

// Mock the countries module
jest.mock("@/lib/countries", () => ({
  getCountryByName: jest.fn((name) => {
    if (name === "United States") {
      return { code: "US", name: "United States", dialCode: "+1", format: "(###) ###-####" };
    }
    return null;
  }),
}));

// Mock fetch for API calls
global.fetch = jest.fn();

describe("PhoneInput Component", () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it("should render phone input field", () => {
    render(
      <PhoneInput
        value=""
        onChange={mockOnChange}
        defaultCountry="United States"
        tenantId="test-tenant"
      />
    );

    const input = screen.getByRole("textbox");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "tel");
    expect(input).toHaveAttribute("placeholder", "(555) 123-4567");
  });

  it("should display current value", () => {
    render(
      <PhoneInput
        value="1234567890"
        onChange={mockOnChange}
        defaultCountry="United States"
        tenantId="test-tenant"
      />
    );

    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("1234567890");
  });

  it("should call onChange when value changes", () => {
    render(
      <PhoneInput
        value=""
        onChange={mockOnChange}
        defaultCountry="United States"
        tenantId="test-tenant"
      />
    );

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "5551234567" } });

    expect(mockOnChange).toHaveBeenCalledWith("5551234567", true);
  });

  it("should validate phone number with API", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ success: true }),
    });

    render(
      <PhoneInput
        value=""
        onChange={mockOnChange}
        defaultCountry="United States"
        tenantId="test-tenant"
      />
    );

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "5551234567" } });

    await waitFor(
      () => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/test-tenant/customers/validate-phone",
          expect.objectContaining({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              phone: "5551234567",
              countryCode: "US",
            }),
          })
        );
      },
      { timeout: 1000 }
    );
  });

  it("should show loading spinner during validation", async () => {
    (global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ json: async () => ({ success: true }) }), 100)
        )
    );

    render(
      <PhoneInput
        value=""
        onChange={mockOnChange}
        defaultCountry="United States"
        tenantId="test-tenant"
      />
    );

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "5551234567" } });

    // Check for spinner (animated SVG)
    await waitFor(() => {
      const spinner = document.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });
  });

  it("should show success checkmark for available phone", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ success: true }),
    });

    render(
      <PhoneInput
        value=""
        onChange={mockOnChange}
        defaultCountry="United States"
        tenantId="test-tenant"
      />
    );

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "5551234567" } });

    await waitFor(() => {
      const checkmark = document.querySelector(".text-green-500");
      expect(checkmark).toBeInTheDocument();
    });
  });

  it("should display error message for invalid phone", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ success: false, error: "Invalid phone number" }),
    });

    render(
      <PhoneInput
        value=""
        onChange={mockOnChange}
        defaultCountry="United States"
        tenantId="test-tenant"
      />
    );

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "invalid" } });

    await waitFor(() => {
      expect(screen.getByText("Invalid phone number")).toBeInTheDocument();
    });
  });

  it("should skip availability check when skipAvailabilityCheck is true", async () => {
    render(
      <PhoneInput
        value="5551234567"
        onChange={mockOnChange}
        defaultCountry="United States"
        tenantId="test-tenant"
        skipAvailabilityCheck={true}
      />
    );

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "5559876543" } });

    // Wait to ensure no API call is made
    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  it("should show custom error message when provided", () => {
    render(
      <PhoneInput
        value=""
        onChange={mockOnChange}
        defaultCountry="United States"
        tenantId="test-tenant"
        error="Custom error message"
      />
    );

    expect(screen.getByText("Custom error message")).toBeInTheDocument();
  });

  it("should not validate phone numbers that are too short", async () => {
    render(
      <PhoneInput
        value=""
        onChange={mockOnChange}
        defaultCountry="United States"
        tenantId="test-tenant"
      />
    );

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "123" } });

    // Wait and ensure no API call for short numbers
    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  it("should debounce validation requests", async () => {
    jest.useFakeTimers();

    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({ success: true }),
    });

    render(
      <PhoneInput
        value=""
        onChange={mockOnChange}
        defaultCountry="United States"
        tenantId="test-tenant"
      />
    );

    const input = screen.getByRole("textbox");

    // Type multiple characters quickly
    fireEvent.change(input, { target: { value: "555123456" } });
    fireEvent.change(input, { target: { value: "5551234567" } });

    // Should not call API immediately
    expect(global.fetch).not.toHaveBeenCalled();

    // Fast forward time to trigger debounced function
    jest.advanceTimersByTime(500);

    await waitFor(() => {
      // Should only call API once after debounce
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    jest.useRealTimers();
  });
});
