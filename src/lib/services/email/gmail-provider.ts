import * as nodemailer from 'nodemailer';
import { EmailPayload, EmailProvider, EmailResult } from './types';

export class GmailEmailProvider implements EmailProvider {
  name = 'GMAIL';
  private transporter: nodemailer.Transporter | null = null;
  private fromAddress: string;

  constructor() {
    const user = process.env.GMAIL_SMTP_USER;
    const pass = process.env.GMAIL_SMTP_APP_PASSWORD;
    this.fromAddress = process.env.DORMDESK_EMAIL_FROM || user || '';

    if (user && pass && this.fromAddress) {
      this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user,
          pass,
        },
      });
    }
  }

  isConfigured(): boolean {
    return this.transporter !== null;
  }

  async sendEmail(payload: EmailPayload): Promise<EmailResult> {
    if (!this.transporter) {
      return {
        success: false,
        provider: this.name,
        error: 'Gmail provider is not configured. Missing credentials.',
      };
    }

    try {
      const htmlContent = payload.html 
        ? `<meta charset="UTF-8">\n${payload.html}`
        : undefined;

      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to: payload.to,
        subject: payload.subject,
        text: payload.text,
        html: htmlContent,
        textEncoding: 'base64', // Guarantee 8-bit characters aren't downgraded by SMTP relays
      });

      return {
        success: true,
        provider: this.name,
        providerId: info.messageId,
      };
    } catch (error: unknown) {
      // Do not log the raw error if it contains credentials. 
      // The error message itself should be safe, but we should be careful.
      const errorMessage = error instanceof Error ? error.message : 'Unknown Gmail SMTP Error';
      return {
        success: false,
        provider: this.name,
        error: errorMessage,
      };
    }
  }
}
