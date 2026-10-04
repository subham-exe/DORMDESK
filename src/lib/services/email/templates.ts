/**
 * Central Typed Email Templates
 */

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function baseTemplate(title: string, contentHtml: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
  .header { border-bottom: 1px solid #eaeaea; padding-bottom: 10px; margin-bottom: 20px; }
  .footer { margin-top: 30px; border-top: 1px solid #eaeaea; padding-top: 10px; font-size: 12px; color: #666; }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>${escapeHtml(title)}</h2>
    </div>
    <div>
      ${contentHtml}
    </div>
    <div class="footer">
      <p>This is an automated message from DORMDESK. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export const EmailTemplates = {
  verification: (verificationUrl: string) => {
    const url = escapeHtml(verificationUrl);
    return {
      subject: 'DORMDESK: Verify your email address',
      text: `Click the link to verify your email: ${verificationUrl}`,
      html: baseTemplate(
        'Verify Your Email',
        `<p>Please verify your email address by clicking the link below:</p>
         <p><a href="${url}">${url}</a></p>`
      )
    };
  },

  requestSubmitted: (ticketNumber: string, category: string) => {
    return {
      subject: `DORMDESK: Request ${ticketNumber} Submitted`,
      text: `Your request (${ticketNumber}) for ${category} has been submitted successfully.`,
      html: baseTemplate(
        `Request Submitted: ${escapeHtml(ticketNumber)}`,
        `<p>Your request has been submitted successfully.</p>
         <ul>
           <li><strong>Ticket:</strong> ${escapeHtml(ticketNumber)}</li>
           <li><strong>Category:</strong> ${escapeHtml(category)}</li>
         </ul>`
      )
    };
  },

  assignment: (ticketNumber: string, assigneeName: string) => {
    return {
      subject: `DORMDESK: Request ${ticketNumber} Assigned`,
      text: `Request ${ticketNumber} has been assigned to ${assigneeName}.`,
      html: baseTemplate(
        `Request Assigned: ${escapeHtml(ticketNumber)}`,
        `<p>Your request has been assigned to <strong>${escapeHtml(assigneeName)}</strong>.</p>`
      )
    };
  },

  requestUpdate: (ticketNumber: string, newStatus: string, notes?: string) => {
    return {
      subject: `DORMDESK: Request ${ticketNumber} Updated`,
      text: `Request ${ticketNumber} status is now ${newStatus}. ${notes ? `Notes: ${notes}` : ''}`,
      html: baseTemplate(
        `Request Updated: ${escapeHtml(ticketNumber)}`,
        `<p>Your request status is now <strong>${escapeHtml(newStatus)}</strong>.</p>
         ${notes ? `<p><strong>Notes:</strong> ${escapeHtml(notes)}</p>` : ''}`
      )
    };
  },

  slaWarning: (ticketNumber: string, remainingHours: number) => {
    return {
      subject: `DORMDESK - SLA warning for Request ${ticketNumber}`,
      text: `Request ${ticketNumber} will breach SLA in ${remainingHours} hours.`,
      html: baseTemplate(
        `SLA Warning: ${escapeHtml(ticketNumber)}`,
        `<p>Request <strong>${escapeHtml(ticketNumber)}</strong> will breach its SLA in <strong>${remainingHours} hours</strong>.</p>`
      )
    };
  },

  slaEscalation: (ticketNumber: string, level: number) => {
    return {
      subject: `DORMDESK - SLA escalated for Request ${ticketNumber}`,
      text: `Request ${ticketNumber} has breached SLA and escalated to Level ${level}.`,
      html: baseTemplate(
        `SLA Escalated: ${escapeHtml(ticketNumber)}`,
        `<p>Request <strong>${escapeHtml(ticketNumber)}</strong> has breached its SLA and been escalated to <strong>Level ${level}</strong>.</p>`
      )
    };
  },

  resolution: (ticketNumber: string) => {
    return {
      subject: `DORMDESK - Request resolved for ${ticketNumber}`,
      text: `Request ${ticketNumber} has been resolved. Please verify in the portal.`,
      html: baseTemplate(
        `Request Resolved: ${escapeHtml(ticketNumber)}`,
        `<p>Your request <strong>${escapeHtml(ticketNumber)}</strong> has been marked as resolved.</p>
         <p>Please log in to the portal to verify or reopen the request.</p>`
      )
    };
  },

  seriousRequest: (ticketNumber: string, category: string) => {
    return {
      subject: `DORMDESK: Serious Request Escalation - ${ticketNumber}`,
      text: `A serious request (${ticketNumber}) categorized as ${category} requires your immediate attention.`,
      html: baseTemplate(
        `Immediate Attention Required: ${escapeHtml(ticketNumber)}`,
        `<p>A serious request has been filed.</p>
         <ul>
           <li><strong>Ticket:</strong> ${escapeHtml(ticketNumber)}</li>
           <li><strong>Category:</strong> ${escapeHtml(category)}</li>
         </ul>
         <p>Please log in immediately to review.</p>`
      )
    };
  },

  campusAnnouncement: (title: string, message: string) => {
    return {
      subject: `DORMDESK Announcement: ${title}`,
      text: `${title}\n\n${message}`,
      html: baseTemplate(
        escapeHtml(title),
        `<p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>`
      )
    };
  }
};
