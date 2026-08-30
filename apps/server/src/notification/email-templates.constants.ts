export interface EmailVerificationContext {
  name: string;
  verificationUrl: string;
}

export interface PasswordResetContext {
  name: string;
  resetUrl: string;
}

export interface EmailTemplateContextMap {
  'email-verification': EmailVerificationContext;
  'password-reset': PasswordResetContext;
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
};
