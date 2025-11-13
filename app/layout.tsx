import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "LoyaltyBlocks",
  description: "Multi-tenant customer database and loyalty program management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Check if we have valid Clerk keys
  const hasClerkKeys =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== "pk_test_placeholder" &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_");

  // If we have valid Clerk keys, wrap with ClerkProvider
  if (hasClerkKeys) {
    return (
      <ClerkProvider>
        <html lang="en">
          <body>{children}</body>
        </html>
      </ClerkProvider>
    );
  }

  // Otherwise, render without Clerk for development/build
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
