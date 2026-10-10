export interface EmailVerificationContext {
  name: string;
  verificationUrl: string;
}

export interface PasswordResetContext {
  name: string;
  resetUrl: string;
}

export interface IncidentCreatedContext {
  organizationName: string;
  monitorName: string;
  incidentTitle: string;
  severity: string;
  summary: string;
  detectedAt: string;
  incidentUrl: string;
}

export interface EmailTemplateContextMap {
  'email-verification': EmailVerificationContext;
  'password-reset': PasswordResetContext;
  'incident-created': IncidentCreatedContext;
}

export type EmailTemplateName = keyof EmailTemplateContextMap;

export const EMAIL_TEMPLATES: {
  [K in EmailTemplateName]: (context: EmailTemplateContextMap[K]) => string;
} = {
  'email-verification': (context) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body>
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1>Verify Your Email</h1>
    <p>Thank you for signing up for operatio! Please verify your email address by clicking the button below:</p>
    <p>
      <a href="${context.verificationUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify Email</a>
    </p>
    <p>Or copy and paste this link into your browser:</p>
    <p>${context.verificationUrl}</p>
    <p>This link will expire in 24 hours.</p>
    <p>If you didn't create an account with operatio, you can safely ignore this email.</p>
  </div>
</body>
</html>`,
  'password-reset': (context) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body>
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1>Reset Your Password</h1>
    <p>We received a request to reset your password. Click the button below to reset it:</p>
    <p>
      <a href="${context.resetUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
    </p>
    <p>Or copy and paste this link into your browser:</p>
    <p>${context.resetUrl}</p>
    <p>This link will expire in 1 hour.</p>
    <p>If you didn't request a password reset, you can safely ignore this email.</p>
  </div>
</body>
</html>`,
  'incident-created': (context) => {
    const escapeHtml = (value: string) =>
      value.replace(/[&<>"']/g, (character) => {
        const entities: Record<string, string> = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        };
        return entities[character];
      });
    const organizationName = escapeHtml(context.organizationName);
    const monitorName = escapeHtml(context.monitorName);
    const incidentTitle = escapeHtml(context.incidentTitle);
    const severity = escapeHtml(context.severity);
    const summary = escapeHtml(context.summary);
    const detectedAt = escapeHtml(context.detectedAt);
    const incidentUrl = escapeHtml(context.incidentUrl);

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Incident detected: ${incidentTitle}</title>
</head>
<body style="margin:0;background:#f4f6f8;font-family:Arial,sans-serif;color:#17202a;">
  <div style="max-width:600px;margin:0 auto;padding:32px 20px;">
    <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:32px;">
      <p style="margin:0 0 8px;color:#b42318;font-size:12px;font-weight:bold;letter-spacing:.08em;text-transform:uppercase;">Incident detected</p>
      <h1 style="margin:0 0 20px;font-size:24px;line-height:1.3;">${incidentTitle}</h1>
      <p style="margin:0 0 24px;color:#475467;">Operatio detected an issue affecting a monitored service in <strong>${organizationName}</strong>.</p>
      <table role="presentation" style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr><td style="padding:10px 0;color:#667085;border-bottom:1px solid #eaecf0;">Monitor</td><td style="padding:10px 0;text-align:right;font-weight:bold;border-bottom:1px solid #eaecf0;">${monitorName}</td></tr>
        <tr><td style="padding:10px 0;color:#667085;border-bottom:1px solid #eaecf0;">Severity</td><td style="padding:10px 0;text-align:right;font-weight:bold;border-bottom:1px solid #eaecf0;">${severity}</td></tr>
        <tr><td style="padding:10px 0;color:#667085;">Detected</td><td style="padding:10px 0;text-align:right;">${detectedAt}</td></tr>
      </table>
      <p style="margin:0 0 24px;color:#475467;">${summary}</p>
      <a href="${incidentUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 18px;border-radius:6px;text-decoration:none;font-weight:bold;">View incidents</a>
      <p style="margin:28px 0 0;color:#98a2b3;font-size:12px;">You are receiving this alert because you are an owner of ${organizationName} in Operatio.</p>
    </div>
  </div>
</body>
</html>`;
  },
};
