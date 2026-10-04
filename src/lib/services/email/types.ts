export interface EmailPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
  purpose: string;
  recipientId?: string;
  idempotencyKey?: string;
}

export interface EmailResult {
  success: boolean;
  provider: string;
  providerId?: string;
  error?: string;
}

export interface EmailProvider {
  name: string;
  sendEmail(payload: EmailPayload): Promise<EmailResult>;
}
