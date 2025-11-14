/**
 * Tests for CountrySelector Component
 *
 * Tests country dropdown component
 */

import { render, screen, fireEvent } from "@testing-library/react";
import CountrySelector from "./CountrySelector";

// Mock the countries module
jest.mock("@/lib/countries", () => ({
  COUNTRIES: [
    { code: "US", name: "United States", dialCode: "+1", format: "(###) ###-####" },
    { code: "CA", name: "Canada", dialCode: "+1", format: "(###) ###-####" },
    { code: "GB", name: "United Kingdom", dialCode: "+44", format: "#### ### ####" },
    { code: "AU", name: "Australia", dialCode: "+61", format: "#### ### ###" },
    { code: "FR", name: "France", dialCode: "+33", format: "## ## ## ## ##" },
  ],
}));

describe("CountrySelector Component", () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render country selector dropdown", () => {
    render(<CountrySelector value="United States" onChange={mockOnChange} />);

    const label = screen.getByText("Default Country");
    expect(label).toBeInTheDocument();

    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();
  });

  it("should display current selected value", () => {
    render(<CountrySelector value="United States" onChange={mockOnChange} />);

    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("United States");
  });

  it("should render all countries in dropdown", () => {
    render(<CountrySelector value="United States" onChange={mockOnChange} />);

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(5);
  });

  it("should display countries with dial codes", () => {
    render(<CountrySelector value="United States" onChange={mockOnChange} />);

    expect(screen.getByText(/United States \(\+1\)/)).toBeInTheDocument();
    expect(screen.getByText(/Canada \(\+1\)/)).toBeInTheDocument();
    expect(screen.getByText(/United Kingdom \(\+44\)/)).toBeInTheDocument();
  });

  it("should display countries in alphabetical order", () => {
    render(<CountrySelector value="United States" onChange={mockOnChange} />);

    const options = screen.getAllByRole("option");
    const countryNames = options.map((option) => option.textContent);

    // Should be: Australia, Canada, France, United Kingdom, United States
    expect(countryNames[0]).toContain("Australia");
    expect(countryNames[1]).toContain("Canada");
    expect(countryNames[2]).toContain("France");
    expect(countryNames[3]).toContain("United Kingdom");
    expect(countryNames[4]).toContain("United States");
  });

  it("should call onChange when selection changes", () => {
    render(<CountrySelector value="United States" onChange={mockOnChange} />);

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "Canada" } });

    expect(mockOnChange).toHaveBeenCalledWith("Canada");
  });

  it("should be disabled when disabled prop is true", () => {
    render(<CountrySelector value="United States" onChange={mockOnChange} disabled={true} />);

    const select = screen.getByRole("combobox");
    expect(select).toBeDisabled();
  });

  it("should not be disabled by default", () => {
    render(<CountrySelector value="United States" onChange={mockOnChange} />);

    const select = screen.getByRole("combobox");
    expect(select).not.toBeDisabled();
  });

  it("should display error message when provided", () => {
    render(
      <CountrySelector
        value="United States"
        onChange={mockOnChange}
        error="Invalid country selected"
      />
    );

    expect(screen.getByText("Invalid country selected")).toBeInTheDocument();
  });

  it("should apply error styling when error is provided", () => {
    render(
      <CountrySelector
        value="United States"
        onChange={mockOnChange}
        error="Invalid country"
      />
    );

    const select = screen.getByRole("combobox");
    expect(select).toHaveClass("border-red-300");
  });

  it("should display help text", () => {
    render(<CountrySelector value="United States" onChange={mockOnChange} />);

    const helpText = screen.getByText(
      /This setting determines the default phone number format/
    );
    expect(helpText).toBeInTheDocument();
  });

  it("should apply disabled styling when disabled", () => {
    render(<CountrySelector value="United States" onChange={mockOnChange} disabled={true} />);

    const select = screen.getByRole("combobox");
    expect(select).toHaveClass("bg-gray-100");
    expect(select).toHaveClass("cursor-not-allowed");
  });

  it("should handle selection of different countries", () => {
    render(<CountrySelector value="United States" onChange={mockOnChange} />);

    const select = screen.getByRole("combobox");

    fireEvent.change(select, { target: { value: "United Kingdom" } });
    expect(mockOnChange).toHaveBeenCalledWith("United Kingdom");

    fireEvent.change(select, { target: { value: "Australia" } });
    expect(mockOnChange).toHaveBeenCalledWith("Australia");

    expect(mockOnChange).toHaveBeenCalledTimes(2);
  });

  it("should have proper accessibility attributes", () => {
    render(<CountrySelector value="United States" onChange={mockOnChange} />);

    const select = screen.getByRole("combobox");
    expect(select).toHaveAttribute("id", "country");

    const label = screen.getByText("Default Country");
    expect(label).toHaveAttribute("for", "country");
  });

  it("should maintain selected value after re-render", () => {
    const { rerender } = render(
      <CountrySelector value="United States" onChange={mockOnChange} />
    );

    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("United States");

    rerender(<CountrySelector value="Canada" onChange={mockOnChange} />);

    expect(select.value).toBe("Canada");
  });
});
