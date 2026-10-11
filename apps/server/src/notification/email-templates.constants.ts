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
  unsubscribeUrl?: string;
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
  background: '#ffffff',
  rule: '#e4e4e7',
  text: '#18181b',
  body: '#3f3f46',
  muted: '#71717a',
  link: '#1d4ed8',
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#b42318',
  high: '#b54708',
  medium: '#854d0e',
  low: '#52525b',
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

const capitalize = (value: string): string => {
  const trimmed = value.trim().toLowerCase();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

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
}: LayoutOptions): string => {
  const fallbackLogo = process.env.FRONTEND_URL
    ? `${process.env.FRONTEND_URL}/favicon.ico`
    : '';
  const logo = logoUrl || fallbackLogo;
  const mark = logo
    ? `<img src="${escapeHtml(logo)}" alt="" width="24" height="24" style="display:inline-block;vertical-align:middle;margin-right:8px;border:0;">`
    : '';

  return `<!DOCTYPE html>
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
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:520px;">
          <tr>
            <td style="padding:0 0 28px;font-family:${FONT_STACK};font-size:15px;font-weight:600;color:${COLORS.text};">${mark}<span style="vertical-align:middle;">${BRAND_NAME}</span></td>
          </tr>
          <tr>
            <td style="font-family:${FONT_STACK};font-size:15px;line-height:1.65;color:${COLORS.body};">
${body}
            </td>
          </tr>
          <tr>
            <td style="padding:28px 0 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-top:1px solid ${COLORS.rule};padding:16px 0 0;font-family:${FONT_STACK};font-size:12px;line-height:1.6;color:${COLORS.muted};">
${footer}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

const heading = (text: string): string =>
  `<h1 style="margin:0 0 20px;font-size:20px;line-height:1.35;font-weight:600;color:${COLORS.text};">${text}</h1>`;

const paragraph = (html: string, marginBottom = 16): string =>
  `<p style="margin:0 0 ${marginBottom}px;">${html}</p>`;

const link = (href: string, label: string): string =>
  `<a href="${href}" style="color:${COLORS.link};text-decoration:underline;">${label}</a>`;

/** Shows the full address once, in muted text, so the destination is always visible. */
const rawUrl = (url: string): string =>
  `<p style="margin:0 0 16px;font-size:13px;line-height:1.5;color:${COLORS.muted};word-break:break-all;">${url}</p>`;

const detailRow = (label: string, valueHtml: string): string =>
  `<tr>
  <td valign="top" style="padding:0 20px 6px 0;font-size:14px;color:${COLORS.muted};white-space:nowrap;">${label}</td>
  <td valign="top" style="padding:0 0 6px;font-size:14px;color:${COLORS.text};">${valueHtml}</td>
</tr>`;

const severityText = (severity: string): string => {
  const color =
    SEVERITY_COLORS[severity.trim().toLowerCase()] ?? SEVERITY_COLORS.low;
  return `<span style="font-weight:600;color:${color};">${escapeHtml(capitalize(severity))}</span>`;
};

export const EMAIL_TEMPLATES: {
  [K in EmailTemplateName]: (context: EmailTemplateContextMap[K]) => string;
} = {
  'email-verification': (context) => {
    const name = escapeHtml(context.name.trim());
    const url = escapeHtml(context.verificationUrl);

    return layout({
      title: 'Confirm your email address',
      preheader: `Confirm the email address for your ${BRAND_NAME} account.`,
      body: [
        heading('Confirm your email address'),
        paragraph(name ? `Hi ${name},` : 'Hello,'),
        paragraph(
          `Thanks for creating a ${BRAND_NAME} account. To finish setting it up, ${link(url, 'confirm this email address')}.`,
        ),
        rawUrl(url),
        paragraph('The link is valid for 24 hours.', 0),
      ].join('\n'),
      footer: `You received this message because this address was used to create a ${BRAND_NAME} account. If that wasn't you, no action is needed and the account will not be activated.`,
    });
  },

  'password-reset': (context) => {
    const name = escapeHtml(context.name.trim());
    const url = escapeHtml(context.resetUrl);

    return layout({
      title: 'Reset your password',
      preheader: `Choose a new password for your ${BRAND_NAME} account.`,
      body: [
        heading('Reset your password'),
        paragraph(name ? `Hi ${name},` : 'Hello,'),
        paragraph(
          `We received a request to change the password on your ${BRAND_NAME} account. You can ${link(url, 'choose a new password here')}.`,
        ),
        rawUrl(url),
        paragraph('The link is valid for 1 hour.', 0),
      ].join('\n'),
      footer:
        "If you didn't request this, you can ignore this message. Your password will stay the same.",
    });
  },

  'incident-created': (context) => {
    const organizationName = escapeHtml(context.organizationName);
    const monitorName = escapeHtml(context.monitorName);
    const incidentTitle = escapeHtml(context.incidentTitle);
    const summary = escapeHtml(context.summary);
    const detectedAt = escapeHtml(context.detectedAt);
    const incidentUrl = escapeHtml(context.incidentUrl);

    return layout({
      title: `Incident: ${context.incidentTitle}`,
      preheader: `${context.monitorName} in ${context.organizationName}: ${context.incidentTitle}`,
      logoUrl: context.logoUrl,
      body: [
        heading(incidentTitle),
        paragraph(
          `A monitor in <strong style="color:${COLORS.text};">${organizationName}</strong> reported an incident.`,
          20,
        ),
        `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">`,
        detailRow('Monitor', monitorName),
        detailRow('Severity', severityText(context.severity)),
        detailRow('Detected', detectedAt),
        `</table>`,
        paragraph(summary, 20),
        paragraph(
          `Full details are on the ${link(incidentUrl, 'incident page')}.`,
          0,
        ),
      ].join('\n'),
      footer: context.unsubscribeUrl
        ? `You are receiving this because you subscribed to status updates for ${organizationName}. ${link(escapeHtml(context.unsubscribeUrl), 'Unsubscribe')}`
        : `You are receiving this because you are an owner of ${organizationName} on ${BRAND_NAME}.`,
    });
  },
};
