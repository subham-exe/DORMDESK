import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GmailEmailProvider } from '../gmail-provider';

vi.mock('nodemailer', () => {
  const sendMailMock = vi.fn().mockResolvedValue({ messageId: 'mock-123' });
  return {
    createTransport: vi.fn().mockReturnValue({
      sendMail: sendMailMock,
    }),
    sendMailMock // Exported for inspection
  };
});

describe('GmailEmailProvider - UTF-8 Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GMAIL_SMTP_USER = 'test@gmail.com';
    process.env.GMAIL_SMTP_APP_PASSWORD = 'password';
    process.env.DORMDESK_EMAIL_FROM = 'DORMDESK <test@gmail.com>';
  });

  it('preserves UTF-8 em dash and exact phrasing in payloads sent to Nodemailer', async () => {
    const provider = new GmailEmailProvider();
    
    // Exact requested payload
    const payload = {
      to: 'recipient@test.local',
      subject: 'DORMDESK \u2014 Final Stage', // \u2014 is EM DASH
      text: `To Snigdhha Mishra,\n\nMost esteemed lady, it is with solemn gladness that I make known unto thee that this undertaking hath reached its final stage. I render thee my deepest gratitude for thy patience, which hath been a faithful pillar of support throughout the long course of this labour.\n\nShould any imperfection yet remain, I shall attend to it with due diligence ere the work be presented complete. Thy forbearance shall be held in lasting honour.\n\nWith profound respect,\n\n~001\nSUBHAM TRIPATHY\nDORMDESK\nEarth`,
      purpose: 'SYSTEM_NOTICE'
    };

    const result = await provider.sendEmail(payload);

    expect(result.success).toBe(true);

    // Retrieve the exact object passed to sendMail
    const mockedNodemailer = await import('nodemailer');
    // @ts-expect-error NodeMailer mocked method
    const sendMailCallArgs = mockedNodemailer.sendMailMock.mock.calls[0][0];

    // Assert exact preservation
    expect(sendMailCallArgs.subject).toBe('DORMDESK \u2014 Final Stage');
    expect(sendMailCallArgs.subject).toContain('\u2014'); // Explicit EM DASH check
    
    expect(sendMailCallArgs.text).toContain('Most esteemed lady');
    expect(sendMailCallArgs.text).toContain('~001');
    expect(sendMailCallArgs.text).toContain('DORMDESK');
    expect(sendMailCallArgs.text).toContain('Earth');

    // Assert explicit UTF-8 encodings are applied
    expect(sendMailCallArgs.textEncoding).toBe('base64');
  });
});
