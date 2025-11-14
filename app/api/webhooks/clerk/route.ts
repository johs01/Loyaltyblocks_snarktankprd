/**
 * Clerk Webhook Handler
 *
 * Handles user.created events from Clerk to auto-create internal user records
 * POST /api/webhooks/clerk
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { Webhook } from "svix";
import { db } from "@/lib/db";
import { isFirstUserInOrganization } from "@/lib/auth";

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

export async function POST(request: Request) {
  if (!webhookSecret) {
    console.error("CLERK_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  try {
    // Get headers
    const headersList = await headers();
    const svixId = headersList.get("svix-id");
    const svixTimestamp = headersList.get("svix-timestamp");
    const svixSignature = headersList.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
    }

    // Get body
    const payload = await request.json();
    const body = JSON.stringify(payload);

    // Verify webhook
    const wh = new Webhook(webhookSecret);
    let evt: {
      type: string;
      data: {
        id: string;
        email_addresses?: Array<{ email_address: string }>;
        first_name?: string;
        last_name?: string;
        public_metadata?: { organizationSlug?: string };
      };
    };

    try {
      evt = wh.verify(body, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as typeof evt;
    } catch (err) {
      console.error("Webhook verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Handle user.created event
    if (evt.type === "user.created") {
      const { id: clerkUserId, email_addresses, first_name, last_name, public_metadata } = evt.data;

      const email = email_addresses?.[0]?.email_address;
      const firstName = first_name || email?.split("@")[0] || "User";
      const lastName = last_name || "";

      // Get organization ID from metadata (if set during signup)
      const organizationSlug = public_metadata?.organizationSlug;

      if (!organizationSlug || !email) {
        console.log("Skipping user creation - no organization or email");
        return NextResponse.json({ received: true });
      }

      // Find organization
      const organization = await db.organization.findUnique({
        where: { slug: organizationSlug },
      });

      if (!organization) {
        console.error(`Organization not found: ${organizationSlug}`);
        return NextResponse.json({ received: true });
      }

      // Check if this is the first user
      const isFirstUser = await isFirstUserInOrganization(organization.id);
      const role = isFirstUser ? "SUPER_ADMIN" : "VIEWER";

      // Create internal user record
      try {
        await db.user.create({
          data: {
            clerkUserId,
            email,
            firstName,
            lastName,
            role,
            organizationId: organization.id,
          },
        });

        console.log(`Created internal user: ${email} as ${role}`);
      } catch (error) {
        console.error("Error creating internal user:", error);
        // Don't fail the webhook if user already exists
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
