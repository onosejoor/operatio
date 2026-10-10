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
  logoUrl: string;
}

export interface EmailTemplateContextMap {
  'email-verification': EmailVerificationContext;
  'password-reset': PasswordResetContext;
  'incident-created': IncidentCreatedContext;
}

export type EmailTemplateName = keyof EmailTemplateContextMap;

const BRAND_NAME = 'Operatio';
const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

const COLORS = {
  background: '#f3f4f6',
  card: '#ffffff',
  border: '#e5e7eb',
  text: '#111827',
  body: '#374151',
  muted: '#6b7280',
  accent: '#2563eb',
};

const SEVERITY_STYLES: Record<string, { color: string; background: string }> = {
  critical: { color: '#b42318', background: '#fef3f2' },
  high: { color: '#b54708', background: '#fffaeb' },
  medium: { color: '#854d0e', background: '#fefce8' },
  low: { color: '#344054', background: '#f2f4f7' },
};

const escapeHtml = (value: string): string =>
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

interface LayoutOptions {
  title: string;
  preheader: string;
  logoUrl?: string;
  /** Trusted HTML. Interpolate only escaped values. */
  body: string;
  /** Trusted HTML. Interpolate only escaped values. */
  footer: string;
}

const layout = ({
  title,
  preheader,
  logoUrl,
  body,
  footer,
}: LayoutOptions): string => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:${COLORS.background};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLORS.background};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;">
          <tr>
            <td style="padding:0 4px 16px;font-family:${FONT_STACK};font-size:16px;font-weight:600;color:${COLORS.text};">${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="" width="28" height="28" style="display:inline-block;vertical-align:middle;margin-right:8px;border:0;">` : ''}<span style="vertical-align:middle;">${BRAND_NAME}</span></td>
          </tr>
          <tr>
            <td style="background-color:${COLORS.card};border:1px solid ${COLORS.border};border-radius:8px;padding:32px;font-family:${FONT_STACK};font-size:15px;line-height:1.6;color:${COLORS.body};">
${body}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 4px 0;font-family:${FONT_STACK};font-size:12px;line-height:1.5;color:${COLORS.muted};">
${footer}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const heading = (text: string): string =>
  `<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;font-weight:600;color:${COLORS.text};">${text}</h1>`;

const paragraph = (html: string, marginBottom = 16): string =>
  `<p style="margin:0 0 ${marginBottom}px;">${html}</p>`;

const button = (
  href: string,
  label: string,
): string => `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;">
  <tr>
    <td bgcolor="${COLORS.accent}" style="border-radius:6px;">
      <a href="${href}" style="display:inline-block;padding:12px 20px;font-family:${FONT_STACK};font-size:15px;font-weight:600;line-height:1;color:#ffffff;text-decoration:none;border-radius:6px;">${label}</a>
    </td>
  </tr>
</table>`;

const fallbackLink = (url: string): string =>
  `<p style="margin:0 0 16px;font-size:13px;color:${COLORS.muted};">If the button doesn't work, paste this link into your browser:<br><a href="${url}" style="color:${COLORS.accent};word-break:break-all;">${url}</a></p>`;

const detailRow = (
  label: string,
  valueHtml: string,
  isLast = false,
): string => {
  const border = isLast ? '' : `border-bottom:1px solid ${COLORS.border};`;
  return `<tr>
  <td style="padding:10px 0;${border}font-size:14px;color:${COLORS.muted};">${label}</td>
  <td align="right" style="padding:10px 0;${border}font-size:14px;color:${COLORS.text};">${valueHtml}</td>
</tr>`;
};

const severityBadge = (severity: string): string => {
  const style =
    SEVERITY_STYLES[severity.trim().toLowerCase()] ?? SEVERITY_STYLES.low;
  return `<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:${style.color};background-color:${style.background};">${escapeHtml(severity)}</span>`;
};

export const EMAIL_TEMPLATES: {
  [K in EmailTemplateName]: (context: EmailTemplateContextMap[K]) => string;
} = {
  'email-verification': (context) => {
    const name = escapeHtml(context.name.trim());
    const url = escapeHtml(context.verificationUrl);

    return layout({
      title: 'Verify your email address',
      preheader: `Confirm your email address to finish setting up your ${BRAND_NAME} account.`,
      body: [
        heading('Verify your email address'),
        paragraph(name ? `Hi ${name},` : 'Hello,'),
        paragraph(
          `Confirm your email address to finish setting up your ${BRAND_NAME} account.`,
        ),
        button(url, 'Verify email address'),
        paragraph('This link expires in 24 hours.', 16),
        fallbackLink(url),
      ].join('\n'),
      footer: `If you didn't create a ${BRAND_NAME} account, you can ignore this email.`,
    });
  },

  'password-reset': (context) => {
    const name = escapeHtml(context.name.trim());
    const url = escapeHtml(context.resetUrl);

    return layout({
      title: 'Reset your password',
      preheader: `Use this link to choose a new ${BRAND_NAME} password.`,
      body: [
        heading('Reset your password'),
        paragraph(name ? `Hi ${name},` : 'Hello,'),
        paragraph(
          `We received a request to reset the password for your ${BRAND_NAME} account. Use the button below to choose a new one.`,
        ),
        button(url, 'Reset password'),
        paragraph('This link expires in 1 hour.', 16),
        fallbackLink(url),
      ].join('\n'),
      footer:
        "If you didn't request a password reset, you can ignore this email. Your password will not be changed.",
    });
  },

  'incident-created': (context) => {
    const organizationName = escapeHtml(context.organizationName);
    const monitorName = escapeHtml(context.monitorName);
    const incidentTitle = escapeHtml(context.incidentTitle);
    const summary = escapeHtml(context.summary);
    const detectedAt = escapeHtml(context.detectedAt);
    const incidentUrl = escapeHtml(context.incidentUrl);
    const logoUrl = context.logoUrl;

    return layout({
      title: `Incident detected: ${context.incidentTitle}`,
      preheader: `${context.monitorName} in ${context.organizationName}: ${context.incidentTitle}`,
      logoUrl,
      body: [
        heading(incidentTitle),
        paragraph(
          `A monitor in <strong style="color:${COLORS.text};">${organizationName}</strong> has detected an issue.`,
          20,
        ),
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;border-top:1px solid ${COLORS.border};">`,
        detailRow('Monitor', `<strong>${monitorName}</strong>`),
        detailRow('Severity', severityBadge(context.severity)),
        detailRow('Detected', detectedAt, true),
        `</table>`,
        paragraph(summary, 8),
        button(incidentUrl, 'View incident'),
      ].join('\n'),
      footer: `You are receiving this alert because you are an owner of ${organizationName} on ${BRAND_NAME}.`,
    });
  },
};
