import { Resend } from 'resend';
import { EmailProvider, EmailPayload, EmailResult } from './types';

export class ResendEmailProvider implements EmailProvider {
  name = 'RESEND';
  private resend: Resend | null = null;
  private fromAddress: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.fromAddress = process.env.DORMDESK_EMAIL_FROM || '';

    // Initialize only if keys exist. The calling service will handle fallback.
    if (apiKey && this.fromAddress) {
      this.resend = new Resend(apiKey);
    }
  }

  isConfigured(): boolean {
    return this.resend !== null;
  }

  async sendEmail(payload: EmailPayload): Promise<EmailResult> {
    if (!this.resend) {
      return {
        success: false,
        provider: this.name,
        error: 'Resend provider is not configured (missing API key or sender address).'
      };
    }

    try {
      const response = await this.resend.emails.send({
        from: this.fromAddress,
        to: payload.to,
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
      });

      if (response.error) {
        // Return normalized error without exposing internal Resend HTTP traces
        return {
          success: false,
          provider: this.name,
          error: response.error.message || 'Unknown Resend error'
        };
      }

      return {
        success: true,
        provider: this.name,
        providerId: response.data?.id
      };
    } catch (e: unknown) {
      // Safely catch thrown errors (e.g. network failure)
      return {
        success: false,
        provider: this.name,
        error: (e as Error).message || 'Network or internal provider error'
      };
    }
  }
}
