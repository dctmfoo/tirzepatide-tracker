import { Resend } from 'resend';

// Singleton Resend client
let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }

  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }

  return resendClient;
}

export type EmailResult = {
  success: boolean;
  id?: string;
  error?: string;
};

type EmailOptions = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

/**
 * Send an email using Resend.
 * Returns null if Resend is not configured (dev mode).
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult | null> {
  const resend = getResendClient();

  if (!resend) {
    console.log(`[DEV] Would send email to ${options.to}: ${options.subject}`);
    return null;
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Mounjaro Tracker <noreply@resend.dev>';

  try {
    const result = await resend.emails.send({
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (result.error) {
      return {
        success: false,
        error: result.error.message,
      };
    }

    return {
      success: true,
      id: result.data?.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if email sending is configured
 */
export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}
