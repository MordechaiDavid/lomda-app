import sgMail from '@sendgrid/mail';
import { config } from '../config/index.js';

sgMail.setApiKey(config.email.sendgrid.apiKey);

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(opts: EmailOptions): Promise<void> {
  if (!config.email.sendgrid.apiKey) {
    console.warn(`[email] No SENDGRID_API_KEY — skipping send to ${opts.to}`);
    return;
  }

  await sgMail.send({
    to: opts.to,
    from: { email: config.email.from, name: config.email.fromName },
    subject: opts.subject,
    html: opts.html,
    text: opts.text ?? opts.html.replace(/<[^>]+>/g, '')
  });
}

export function buildCampaignEmail(opts: {
  recipientName: string;
  courseTitle: string;
  orgName: string;
  learnUrl: string;
  dueDate: string | null;
}): string {
  const due = opts.dueDate
    ? `<p style="color:#ef4444;">יש להשלים עד: <strong>${new Date(opts.dueDate).toLocaleDateString('he-IL')}</strong></p>`
    : '';

  return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="UTF-8"><title>לומדה חדשה</title></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1);">
    <div style="background:#2563eb;padding:24px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;">${opts.orgName}</h1>
    </div>
    <div style="padding:32px;">
      <p style="font-size:16px;">שלום ${opts.recipientName || ''},</p>
      <p>הוקצתה לך לומדה חדשה:</p>
      <h2 style="color:#2563eb;">${opts.courseTitle}</h2>
      ${due}
      <p>לחץ על הכפתור להתחיל:</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${opts.learnUrl}"
           style="background:#2563eb;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-size:16px;font-weight:bold;">
          התחל לומדה
        </a>
      </div>
      <p style="color:#6b7280;font-size:13px;">אם הכפתור לא עובד, העתק את הקישור: ${opts.learnUrl}</p>
    </div>
  </div>
</body>
</html>`;
}

export function buildReminderEmail(opts: {
  recipientName: string;
  courseTitle: string;
  orgName: string;
  learnUrl: string;
  dueDate: string | null;
  daysLeft: number;
}): string {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="UTF-8"><title>תזכורת: לומדה לא הושלמה</title></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1);">
    <div style="background:#f59e0b;padding:24px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;">תזכורת — ${opts.orgName}</h1>
    </div>
    <div style="padding:32px;">
      <p style="font-size:16px;">שלום ${opts.recipientName || ''},</p>
      <p>עדיין לא השלמת את הלומדה:</p>
      <h2 style="color:#f59e0b;">${opts.courseTitle}</h2>
      ${opts.daysLeft <= 1 ? '<p style="color:#ef4444;font-weight:bold;">⚠️ יום אחרון להשלמה!</p>' : `<p style="color:#ef4444;">נותרו <strong>${opts.daysLeft} ימים</strong> להשלמה.</p>`}
      <div style="text-align:center;margin:32px 0;">
        <a href="${opts.learnUrl}"
           style="background:#f59e0b;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-size:16px;font-weight:bold;">
          המשך לומדה
        </a>
      </div>
    </div>
  </div>
</body>
</html>`;
}
