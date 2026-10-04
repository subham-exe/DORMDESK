import { ConsentLedgerService } from './consent-ledger';

export interface NotificationPreferences {
  EMAIL_REQUEST_NOTIFICATIONS: boolean;
  EMAIL_SLA_NOTIFICATIONS: boolean;
  EMAIL_CAMPUS_ANNOUNCEMENTS: boolean;
}

export class NotificationPreferencesService {
  /**
   * Resolves the current notification preferences for a user derived strictly from the Consent Ledger.
   */
  static async getPreferences(userId: string): Promise<NotificationPreferences> {
    const preferences: NotificationPreferences = {
      EMAIL_REQUEST_NOTIFICATIONS: false,
      EMAIL_SLA_NOTIFICATIONS: false,
      EMAIL_CAMPUS_ANNOUNCEMENTS: false,
    };

    // Optimize by pulling the latest record for each purpose in a single query logic,
    // or just run 3 quick queries which is fine for this scale.
    // Let's use 3 parallel queries for simplicity and safety through the existing ConsentLedgerService boundary.
    const [reqNotif, slaNotif, annNotif] = await Promise.all([
      ConsentLedgerService.hasCurrentConsent(userId, 'EMAIL_REQUEST_NOTIFICATIONS'),
      ConsentLedgerService.hasCurrentConsent(userId, 'EMAIL_SLA_NOTIFICATIONS'),
      ConsentLedgerService.hasCurrentConsent(userId, 'EMAIL_CAMPUS_ANNOUNCEMENTS')
    ]);

    preferences.EMAIL_REQUEST_NOTIFICATIONS = reqNotif;
    preferences.EMAIL_SLA_NOTIFICATIONS = slaNotif;
    preferences.EMAIL_CAMPUS_ANNOUNCEMENTS = annNotif;

    return preferences;
  }
}
