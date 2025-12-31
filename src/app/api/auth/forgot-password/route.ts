import { NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import crypto from 'crypto';
import { sendEmail, passwordResetTemplate } from '@/lib/email';

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

// Token expires in 1 hour
const TOKEN_EXPIRY_HOURS = 1;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validationResult = forgotPasswordSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const { email } = validationResult.data;

    // Find user by email
    const user = await db.query.users.findFirst({
      where: eq(schema.users.email, email.toLowerCase()),
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: 'If an account exists with this email, a reset link has been sent.',
      });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    // Store token in database
    await db.insert(schema.passwordResetTokens).values({
      userId: user.id,
      token,
      expiresAt,
    });

    // Build reset URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    // Generate email template
    const template = passwordResetTemplate({
      resetUrl,
      expiryHours: TOKEN_EXPIRY_HOURS,
    });

    // Send email via Resend
    const result = await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
    });

    // Log the email result
    if (result !== null) {
      await db.insert(schema.emailLogs).values({
        userId: user.id,
        notificationType: 'password_reset',
        status: result.success ? 'sent' : 'failed',
        resendId: result.id || null,
        errorMessage: result.error || null,
      });

      if (!result.success) {
        console.error('Failed to send reset email:', result.error);
      }
    } else {
      // Development mode - log the reset URL
      console.log('Password reset URL (dev mode):', resetUrl);
    }

    return NextResponse.json({
      message: 'If an account exists with this email, a reset link has been sent.',
    });
  } catch (error) {
    console.error('POST /api/auth/forgot-password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
