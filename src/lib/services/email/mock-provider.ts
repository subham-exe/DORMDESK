import { EmailProvider, EmailPayload, EmailResult } from './types';

export class MockEmailProvider implements EmailProvider {
  name = 'MOCK';
  private sentEmails: Array<EmailPayload & { sentAt: Date }> = [];
  public shouldFail = false;

  async sendEmail(payload: EmailPayload): Promise<EmailResult> {
    if (this.shouldFail) {
      return {
        success: false,
        provider: this.name,
        error: 'Mock provider simulated failure'
      };
    }

    const entry = {
      ...payload,
      sentAt: new Date()
    };
    this.sentEmails.push(entry);

    console.log(`[MockEmail] ${payload.purpose} email to ${payload.to}: ${payload.subject}`);

    return {
      success: true,
      provider: this.name,
      providerId: `mock-${Date.now()}`
    };
  }

  getSentEmails() {
    return [...this.sentEmails];
  }

  clearSentEmails() {
    this.sentEmails = [];
    this.shouldFail = false;
  }
}
