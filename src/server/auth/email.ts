/**
 * Welcome Email Service using Nodemailer
 * Background processing for member registration
 */

import nodemailer, { type Transporter } from 'nodemailer';

export interface WelcomeEmailData {
  toEmail: string;
  memberNumber: string;
  firstName: string;
  lastName: string;
  tier?: string;
}

let transporter: Transporter | null = null;

function getEmailTransporter(): Transporter {
  if (transporter) {
    return transporter;
  }

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
  } else {
    // Fallback JSON transport for development/local testing when SMTP is not configured
    transporter = nodemailer.createTransport({
      jsonTransport: true,
    });
  }

  return transporter;
}

/**
 * Sends a welcome email to a newly created gym member.
 * Safe to call; handles errors gracefully without throwing to the caller.
 */
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
  try {
    const transport = getEmailTransporter();
    const fromAddress = process.env.EMAIL_FROM || '"Spotter Gym" <welcome@spotter.gym>';

    const subject = `Welcome to Spotter Gym, ${data.firstName}! (Member #${data.memberNumber})`;
    const textContent = `Hello ${data.firstName} ${data.lastName},

Welcome to Spotter Gym! Your member registration has been processed successfully.

Your Member Number is: ${data.memberNumber}
Tier: ${data.tier || 'BASIC'}

You can use your registered mobile number and member number to access your portal at any time:
- Check your daily attendance
- Check your membership status and balance
- Self-service daily check-in with our rotating 4-digit code

If you have any questions, visit the front desk or ask our staff on duty.

Best regards,
The Spotter Gym Team`;

    const htmlContent = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 8px;">
  <div style="background-color: #0052FF; color: #FFFFFF; font-size: 12px; font-weight: 800; padding: 6px 12px; border-radius: 4px; display: inline-block; text-transform: uppercase;">
    SPOTTER
  </div>
  <h2 style="color: #0F172A; margin-top: 16px;">Welcome to Spotter Gym, ${data.firstName}!</h2>
  <p style="color: #475569; font-size: 14px; line-height: 1.5;">
    Your gym member registration has been completed. Here are your account details:
  </p>
  <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 16px; margin: 20px 0;">
    <p style="margin: 4px 0; font-size: 14px;"><strong>Member Name:</strong> ${data.firstName} ${data.lastName}</p>
    <p style="margin: 4px 0; font-size: 14px;"><strong>Member Number:</strong> <span style="font-family: monospace; font-size: 16px; color: #0052FF; font-weight: bold;">${data.memberNumber}</span></p>
    <p style="margin: 4px 0; font-size: 14px;"><strong>Membership Tier:</strong> ${data.tier || 'BASIC'}</p>
  </div>
  <p style="color: #475569; font-size: 13px; line-height: 1.5;">
    Use your member number and mobile number to sign in, check in during gym hours, and view your private gym records.
  </p>
  <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;" />
  <p style="color: #94A3B8; font-size: 12px;">
    Spotter Gym — Official Member Portal. For assistance, speak to the front desk officer on duty.
  </p>
</div>`;

    const info = await transport.sendMail({
      from: fromAddress,
      to: data.toEmail,
      subject,
      text: textContent,
      html: htmlContent,
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Email] Welcome email dispatched for member #${data.memberNumber} to ${data.toEmail}`);
      if (info.message) {
        console.log(`[Email] Message content preview:`, info.message);
      }
    }

    return true;
  } catch (error) {
    console.error(`[Email Error] Failed to send welcome email for member #${data.memberNumber}:`, error);
    return false;
  }
}

/**
 * Triggers welcome email delivery in the background (fire-and-forget).
 * Does not block the HTTP request and handles errors silently.
 */
export function sendWelcomeEmailInBackground(data: WelcomeEmailData): void {
  // Execute asynchronously in the next event loop tick
  setImmediate(() => {
    sendWelcomeEmail(data).catch((err) => {
      console.error('[Email Error] Background email error:', err);
    });
  });
}

export interface VerificationEmailData {
  toEmail: string;
  code: string;
  firstName?: string;
}

/**
 * Sends a 6-digit email verification code to the member.
 * Safe to call; handles errors gracefully without throwing.
 */
export async function sendVerificationEmail(data: VerificationEmailData): Promise<boolean> {
  try {
    const transport = getEmailTransporter();
    const fromAddress = process.env.EMAIL_FROM || '"Spotter Gym" <welcome@spotter.gym>';

    const subject = `Your Spotter Gym Verification Code: ${data.code}`;
    const textContent = `Hello ${data.firstName || 'Member'},

Thank you for creating your Spotter Gym account!

Your 6-digit email verification code is: ${data.code}

Please enter this code on your Spotter gym dashboard to verify your email address.
This code will expire in 5 minutes.

If you did not create a Spotter Gym account, you can safely ignore this email.

Best regards,
The Spotter Gym Team`;

    const htmlContent = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 8px;">
  <div style="background-color: #0052FF; color: #FFFFFF; font-size: 12px; font-weight: 800; padding: 6px 12px; border-radius: 4px; display: inline-block; text-transform: uppercase;">
    SPOTTER
  </div>
  <h2 style="color: #0F172A; margin-top: 16px;">Verify Your Email Address</h2>
  <p style="color: #475569; font-size: 14px; line-height: 1.5;">
    Hello ${data.firstName || 'Member'}, use the 6-digit code below to verify your email address and activate your Spotter gym account features:
  </p>
  <div style="background-color: #F8FAFC; border: 2px dashed #CBD5E1; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
    <span style="font-family: monospace; font-size: 32px; letter-spacing: 8px; font-weight: 800; color: #0052FF; display: inline-block;">
      ${data.code}
    </span>
    <p style="margin: 8px 0 0 0; font-size: 12px; color: #64748B;">
      Expires in 5 minutes
    </p>
  </div>
  <p style="color: #475569; font-size: 13px; line-height: 1.5;">
    Enter this code into the verification banner on your gym dashboard. If you did not create an account with Spotter, you can ignore this message.
  </p>
  <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;" />
  <p style="color: #94A3B8; font-size: 12px;">
    Spotter Gym — Official Member Portal. For assistance, speak to the front desk officer on duty.
  </p>
</div>`;

    const info = await transport.sendMail({
      from: fromAddress,
      to: data.toEmail,
      subject,
      text: textContent,
      html: htmlContent,
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n======================================================`);
      console.log(`[SPOTTER EMAIL SERVICE] Verification Code for ${data.toEmail}`);
      console.log(`>>> VERIFICATION CODE: ${data.code} <<< (Expires in 5 minutes)`);
      console.log(`======================================================\n`);
      if (info.message) {
        console.log(`[Email] Message content preview:`, info.message);
      }
    }

    return true;
  } catch (error) {
    console.error(`[Email Error] Failed to send verification email to ${data.toEmail}:`, error);
    return false;
  }
}

/**
 * Dispatches verification email asynchronously in the background.
 */
export function sendVerificationEmailInBackground(data: VerificationEmailData): void {
  setImmediate(() => {
    sendVerificationEmail(data).catch((err) => {
      console.error('[Email Error] Background verification email error:', err);
    });
  });
}

export interface PasswordResetEmailData {
  toEmail: string;
  resetToken: string;
  firstName?: string;
}

/**
 * Sends a password reset token/link to the member.
 */
export async function sendPasswordResetEmail(data: PasswordResetEmailData): Promise<boolean> {
  try {
    const transport = getEmailTransporter();
    const fromAddress = process.env.EMAIL_FROM || '"Spotter Gym" <welcome@spotter.gym>';

    const subject = 'Reset Your Spotter Gym Password';
    const textContent = `Hello ${data.firstName || 'Member'},

You recently requested to reset your Spotter Gym password.

Your reset code / token is: ${data.resetToken}

This token will expire in 15 minutes. If you did not request a password reset, you can safely ignore this email.

Best regards,
The Spotter Gym Team`;

    const htmlContent = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 8px;">
  <div style="background-color: #0052FF; color: #FFFFFF; font-size: 12px; font-weight: 800; padding: 6px 12px; border-radius: 4px; display: inline-block; text-transform: uppercase;">
    SPOTTER
  </div>
  <h2 style="color: #0F172A; margin-top: 16px;">Reset Your Password</h2>
  <p style="color: #475569; font-size: 14px; line-height: 1.5;">
    Hello ${data.firstName || 'Member'}, use the reset code below to choose a new password for your Spotter Gym account:
  </p>
  <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">
    <span style="font-family: monospace; font-size: 20px; font-weight: bold; color: #0052FF; word-break: break-all;">
      ${data.resetToken}
    </span>
    <p style="margin: 8px 0 0 0; font-size: 12px; color: #64748B;">
      Expires in 15 minutes
    </p>
  </div>
  <p style="color: #475569; font-size: 13px; line-height: 1.5;">
    If you did not request this password reset, please ignore this email or speak to the front desk officer on duty.
  </p>
  <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;" />
  <p style="color: #94A3B8; font-size: 12px;">
    Spotter Gym — Official Member Portal.
  </p>
</div>`;

    const info = await transport.sendMail({
      from: fromAddress,
      to: data.toEmail,
      subject,
      text: textContent,
      html: htmlContent,
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Email] Password reset email dispatched to ${data.toEmail}`);
      if (info.message) {
        console.log(`[Email] Message content preview:`, info.message);
      }
    }

    return true;
  } catch (error) {
    console.error(`[Email Error] Failed to send password reset email to ${data.toEmail}:`, error);
    return false;
  }
}

/**
 * Dispatches password reset email asynchronously in the background.
 */
export function sendPasswordResetEmailInBackground(data: PasswordResetEmailData): void {
  setImmediate(() => {
    sendPasswordResetEmail(data).catch((err) => {
      console.error('[Email Error] Background password reset email error:', err);
    });
  });
}

