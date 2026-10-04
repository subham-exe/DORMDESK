import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { EmailVerificationService } from "@/lib/services/email-verification";
import { EmailService } from "@/lib/services/email/email-service";
import { EmailTemplates } from "@/lib/services/email/templates";

/**
 * POST /api/auth/verify-email
 * Request: authenticated user requests email verification for themselves.
 * Response: success (token is sent via email, never in response body).
 */
export async function POST() {
  try {
    const actor = await requireAuth(); // Allow even if mustChangePassword

    const { token, expiresAt } = await EmailVerificationService.requestVerification(actor.id);

    // Build verification URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${token}&userId=${actor.id}`;

    const template = EmailTemplates.verification(verificationUrl);

    // Send via email service abstraction (enforces limits and tracking)
    await EmailService.sendEmail({
      to: actor.email,
      ...template,
      purpose: 'EMAIL_VERIFICATION', // Not an optional purpose, bypasses Phase 4 checks
      recipientId: actor.id
    });

    // NEVER return the token in the API response
    return NextResponse.json({
      message: "Verification email sent",
      expiresAt: expiresAt.toISOString()
    }, { status: 200 });
  } catch (error) {
    if (((error as Error)?.message || 'Unknown error') === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    if (((error as Error)?.message || 'Unknown error') === "MUST_CHANGE_PASSWORD") {
      return NextResponse.json({ error: "MUST_CHANGE_PASSWORD" }, { status: 403 });
    }
    if (((error as Error)?.message || 'Unknown error') === "Email already verified") {
      return NextResponse.json({ error: "Email already verified" }, { status: 409 });
    }
    if (((error as Error)?.message || 'Unknown error') === "Account is not active") {
      return NextResponse.json({ error: "Account is not active" }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/auth/verify-email?token=...&userId=...
 * Complete email verification by consuming the token.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const userId = url.searchParams.get("userId");

    if (!token || !userId) {
      return NextResponse.json({ error: "Missing token or userId" }, { status: 400 });
    }

    await EmailVerificationService.verifyEmail(token, userId);

    return NextResponse.json({ message: "Email verified successfully" }, { status: 200 });
  } catch (error) {
    if (((error as Error)?.message || 'Unknown error') === "INVALID_TOKEN") {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }
    if (((error as Error)?.message || 'Unknown error') === "TOKEN_ALREADY_USED") {
      return NextResponse.json({ error: "Token has already been used" }, { status: 400 });
    }
    if (((error as Error)?.message || 'Unknown error') === "TOKEN_EXPIRED") {
      return NextResponse.json({ error: "Token has expired" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
