/**
 * Shared validation utilities and Zod schemas for Spotter forms and APIs.
 */

import { z } from 'zod';
import {
  checkPwnedPassword,
  validatePasswordNotPwned,
  type PwnedCheckResult,
  type CheckPwnedOptions,
} from './pwned-password.ts';

export const ERROR_MESSAGES = {
  REQUIRED: 'This field must not be empty',
  FULL_NAME: 'Enter your first and last name',
  EMAIL_INVALID: 'Enter a valid email address',
  PHONE_INVALID: 'Enter a valid mobile number (e.g. 0801 234 5678)',
  PASSWORD_LENGTH: 'Use at least eight characters.',
  PASSWORD_COMPLEXITY: 'Your password must include at least one letter and one number.',
  PASSWORD_BREACHED: 'This password has appeared in a data breach. Please choose a different password.',
  PASSWORDS_DONT_MATCH: 'Passwords do not match',
  PRIVACY_REQUIRED: 'You must accept the privacy notice to proceed',
} as const;

export const PASSWORD_MIN_LENGTH = 8;

/**
 * Formats ZodError issues into a field-to-message record.
 */
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0]?.toString() || 'form';
    if (!errors[key]) {
      errors[key] = issue.message;
    }
  }
  return errors;
}

/**
 * Validates that a field is not left blank
 */
export function validateRequired(value: string): string | null {
  if (!value || value.trim().length === 0) {
    return ERROR_MESSAGES.REQUIRED;
  }
  return null;
}

/**
 * Validates full name:
 * - Must not be empty ("This field must not be empty")
 * - Minimum length of 2 characters
 * - Must contain at least two words separated by spaces (e.g. "Jane Doe")
 * - Trims leading/trailing whitespace and collapses multiple spaces
 * - Each name must be at least 1 character
 */
export function validateFullName(value: string): string | null {
  if (!value || value.trim().length === 0) {
    return ERROR_MESSAGES.REQUIRED;
  }

  const trimmed = value.trim();
  if (trimmed.length < 2) {
    return ERROR_MESSAGES.FULL_NAME;
  }

  // Collapse multiple spaces
  const collapsed = trimmed.replace(/\s+/g, ' ');
  const parts = collapsed.split(' ');

  if (parts.length < 2 || parts.some((part) => part.length < 1)) {
    return ERROR_MESSAGES.FULL_NAME;
  }

  return null;
}

/**
 * Normalizes email input to lowercase with leading/trailing whitespace trimmed.
 */
export function normalizeEmail(value?: string | null): string {
  if (!value || typeof value !== 'string') return '';
  return value.trim().toLowerCase();
}

/**
 * Normalizes a mobile number to digits only so that formatting differences
 * (spaces, dashes, brackets, leading +) do not prevent sign-in.
 */
export function normalizePhone(value?: string | null): string {
  if (!value || typeof value !== 'string') return '';
  return value.replace(/[\s\-\(\)\+]/g, '');
}

/**
 * Validates email format:
 * - If empty:
 *   - in real-time (onChange): returns null (empty handled on blur)
 *   - on blur/submit: returns "This field must not be empty"
 * - If non-empty: checks standard pattern ^[^\s@]+@[^\s@]+\.[^\s@]+$
 */
export function validateEmail(value: string, isRealTime = false): string | null {
  if (!value || value.trim().length === 0) {
    return isRealTime ? null : ERROR_MESSAGES.REQUIRED;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value.trim())) {
    return ERROR_MESSAGES.EMAIL_INVALID;
  }

  return null;
}

/**
 * Validates mobile phone number
 */
export function validatePhone(value: string): string | null {
  if (!value || value.trim().length === 0) {
    return ERROR_MESSAGES.REQUIRED;
  }

  const cleaned = value.replace(/[\s\-\(\)\+]/g, '');
  if (!/^\d{10,14}$/.test(cleaned)) {
    return ERROR_MESSAGES.PHONE_INVALID;
  }

  return null;
}

/**
 * Returns the canonical password policy error for a value, or null when valid.
 * The policy is shared by every auth form and every server-side Zod schema so
 * an API/cURL caller cannot bypass the browser rules.
 */
export function validatePassword(value: string): string | null {
  if (!value || value.trim().length === 0) {
    return ERROR_MESSAGES.REQUIRED;
  }

  const trimmed = value.trim();
  if (trimmed.length < PASSWORD_MIN_LENGTH) {
    return ERROR_MESSAGES.PASSWORD_LENGTH;
  }

  if (!/[A-Za-z]/.test(trimmed) || !/\d/.test(trimmed)) {
    return ERROR_MESSAGES.PASSWORD_COMPLEXITY;
  }

  return null;
}

/**
 * Reusable server-side password field. Trims surrounding whitespace (whitespace-only
 * passwords are rejected) but never changes the case of the remaining characters.
 */
export const passwordFieldSchema = z
  .string()
  .trim()
  .min(1, { message: ERROR_MESSAGES.REQUIRED })
  .superRefine((val, ctx) => {
    const err = validatePassword(val);
    if (err) {
      ctx.addIssue({ code: 'custom', message: err });
    }
  });

/**
 * Reusable email field: trims surrounding whitespace and lowercases the address.
 */
export const emailFieldSchema = z
  .string()
  .trim()
  .min(1, { message: ERROR_MESSAGES.REQUIRED })
  .superRefine((val, ctx) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      ctx.addIssue({ code: 'custom', message: ERROR_MESSAGES.EMAIL_INVALID });
    }
  })
  .transform((val) => normalizeEmail(val));

// ==========================================
// ZOD SCHEMAS FOR APPLICATION FORMS & APIS
// ==========================================

/**
 * Zod schema for member sign-in form.
 * Accepts either registered mobile phone number or normalized email address.
 */
export const signInSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(1, { message: ERROR_MESSAGES.REQUIRED })
    .transform((val) => (val.includes('@') ? normalizeEmail(val) : normalizePhone(val)))
    .superRefine((val, ctx) => {
      if (val.length > 0) {
        if (val.includes('@')) {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
            ctx.addIssue({
              code: 'custom',
              message: ERROR_MESSAGES.EMAIL_INVALID,
            });
          }
        } else {
          const cleaned = val.replace(/[\s\-\(\)\+]/g, '');
          if (!/^\d{10,14}$/.test(cleaned)) {
            ctx.addIssue({
              code: 'custom',
              message: ERROR_MESSAGES.PHONE_INVALID,
            });
          }
        }
      }
    }),
  // Email addresses are normalized on every auth flow; passwords are trimmed but
  // remain strictly case-sensitive and must satisfy the same policy as sign up.
  password: passwordFieldSchema,
});

export type SignInValues = z.infer<typeof signInSchema>;
export type SignInErrors = {
  phone?: string;
  password?: string;
};

/**
 * Zod schema for receptionist member registration
 */
export const memberRegistrationSchema = z.object({
  firstName: z.string().trim().min(1, { message: ERROR_MESSAGES.REQUIRED }),
  lastName: z.string().trim().min(1, { message: ERROR_MESSAGES.REQUIRED }),
  email: emailFieldSchema,
  phone: z
    .string()
    .trim()
    .min(1, { message: ERROR_MESSAGES.REQUIRED })
    .superRefine((val, ctx) => {
      if (val.length > 0) {
        const cleaned = val.replace(/[\s\-\(\)\+]/g, '');
        if (!/^\d{10,14}$/.test(cleaned)) {
          ctx.addIssue({
            code: 'custom',
            message: ERROR_MESSAGES.PHONE_INVALID,
          });
        }
      }
    })
    .transform((val) => normalizePhone(val)),
  tier: z
    .any()
    .optional()
    .superRefine((val, ctx) => {
      if (val !== undefined && val !== 'BASIC' && val !== 'PREMIUM') {
        ctx.addIssue({
          code: 'custom',
          message: 'Tier must be BASIC or PREMIUM',
        });
      }
    })
    .transform((val) => (val as 'BASIC' | 'PREMIUM' | undefined) ?? 'BASIC'),
  gymId: z.string().trim().optional(),
  password: passwordFieldSchema.optional(),
});

export type MemberRegistrationInput = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  tier?: 'BASIC' | 'PREMIUM';
  gymId?: string;
  password?: string;
};

/**
 * Zod schema for member create account (sign up) form
 */
export const signUpSchema = z
  .object({
    fullName: z
      .string()
      .superRefine((val, ctx) => {
        const err = validateFullName(val);
        if (err) ctx.addIssue({ code: 'custom', message: err });
      }),
    email: emailFieldSchema,
    phone: z.string().trim().min(1, { message: ERROR_MESSAGES.REQUIRED }),
    memberNumber: z.string().trim().optional(),
    password: passwordFieldSchema,
    confirmPassword: z.string().trim().optional(),
    privacyAccepted: z.boolean().refine((val) => val === true, {
      message: ERROR_MESSAGES.PRIVACY_REQUIRED,
    }),
  })
  .superRefine((val, ctx) => {
    if (val.confirmPassword !== undefined) {
      if (!val.confirmPassword || val.confirmPassword.trim().length === 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['confirmPassword'],
          message: ERROR_MESSAGES.REQUIRED,
        });
      } else if (val.confirmPassword.trim() !== val.password.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['confirmPassword'],
          message: ERROR_MESSAGES.PASSWORDS_DONT_MATCH,
        });
      }
    }
  });

/**
 * Server-side schema for the Create Account API. Unknown properties are stripped
 * by Zod before any controller or database code sees the payload.
 */
export const signUpRequestSchema = z.object({
  fullName: z
    .string()
    .trim()
    .superRefine((val, ctx) => {
      const err = validateFullName(val);
      if (err) ctx.addIssue({ code: 'custom', message: err });
    }),
  email: emailFieldSchema,
  phone: z
    .string()
    .trim()
    .min(1, { message: ERROR_MESSAGES.REQUIRED })
    .superRefine((val, ctx) => {
      const cleaned = val.replace(/[\s\-\(\)\+]/g, '');
      if (!/^\d{10,14}$/.test(cleaned)) {
        ctx.addIssue({ code: 'custom', message: ERROR_MESSAGES.PHONE_INVALID });
      }
    })
    .transform((val) => normalizePhone(val)),
  password: passwordFieldSchema,
  privacyAccepted: z.boolean().optional().default(true),
});

export type SignUpRequestInput = z.infer<typeof signUpRequestSchema>;

export interface SignUpValues {
  fullName: string;
  email: string;
  phone: string;
  memberNumber?: string;
  password: string;
  confirmPassword?: string;
  privacyAccepted: boolean;
}

export type SignUpErrors = {
  fullName?: string;
  email?: string;
  phone?: string;
  memberNumber?: string;
  password?: string;
  confirmPassword?: string;
  privacyAccepted?: string;
};

/**
 * Zod schema for F-3 daily check-in code form
 */
export const checkInSchema = z.object({
  code: z
    .string()
    .trim()
    .length(4, { message: "That is not today's code. Check the board at the desk." })
    .regex(/^\d{4}$/, { message: "That is not today's code. Check the board at the desk." }),
});

export type CheckInInput = z.infer<typeof checkInSchema>;

/**
 * Zod schema for member question (Ask Spotter) form
 */
export const askQuestionSchema = z.object({
  question: z
    .string()
    .trim()
    .min(1, { message: 'Question must not be empty' })
    .max(400, { message: 'Question must not exceed 400 characters' }),
});

export type AskQuestionInput = z.infer<typeof askQuestionSchema>;

/**
 * Zod schema for forgot/reset password form
 */
export const forgotPasswordSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, { message: ERROR_MESSAGES.REQUIRED })
    .transform((val) => (val.includes('@') ? normalizeEmail(val) : normalizePhone(val)))
    .superRefine((val, ctx) => {
      if (val.includes('@')) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
          ctx.addIssue({ code: 'custom', message: ERROR_MESSAGES.EMAIL_INVALID });
        }
      } else if (!/^\d{10,14}$/.test(val)) {
        ctx.addIssue({ code: 'custom', message: ERROR_MESSAGES.PHONE_INVALID });
      }
    }),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

/**
 * Zod schema for completing password reset
 */
export const resetPasswordSchema = z
  .object({
    identifier: z
      .string()
      .trim()
      .min(1, { message: ERROR_MESSAGES.REQUIRED })
      .transform((val) => (val.includes('@') ? normalizeEmail(val) : normalizePhone(val))),
    token: z.string().trim().min(1, { message: ERROR_MESSAGES.REQUIRED }),
    newPassword: passwordFieldSchema,
    confirmPassword: z.string().trim().min(1, { message: ERROR_MESSAGES.REQUIRED }),
  })
  .superRefine((val, ctx) => {
    if (val.newPassword !== val.confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: ERROR_MESSAGES.PASSWORDS_DONT_MATCH,
      });
    }
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/**
 * Zod schema for email verification request
 */
export const verifyEmailSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: ERROR_MESSAGES.REQUIRED })
    .superRefine((val, ctx) => {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        ctx.addIssue({ code: 'custom', message: ERROR_MESSAGES.EMAIL_INVALID });
      }
    })
    .transform((val) => normalizeEmail(val)),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, { message: 'Verification code must be exactly 6 digits.' }),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

/**
 * Zod schema for resending email verification code
 */
export const resendVerificationSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: ERROR_MESSAGES.REQUIRED })
    .superRefine((val, ctx) => {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        ctx.addIssue({ code: 'custom', message: ERROR_MESSAGES.EMAIL_INVALID });
      }
    })
    .transform((val) => normalizeEmail(val)),
  firstName: z.string().trim().optional(),
});

export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;

// ==========================================
// VALIDATION HELPER FUNCTIONS
// ==========================================

export type ValidationResult<T> = {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
};

/**
 * Validates sign-in credentials using Zod schema
 */
export function validateSignIn(values: unknown): ValidationResult<SignInValues> {
  const result = signInSchema.safeParse(values);
  if (!result.success) {
    return {
      success: false,
      errors: formatZodErrors(result.error),
    };
  }
  return { success: true, data: result.data };
}

/**
 * Validates receptionist member registration input using Zod schema
 */
export function validateMemberRegistration(
  values: unknown
): ValidationResult<MemberRegistrationInput> {
  const result = memberRegistrationSchema.safeParse(values);
  if (!result.success) {
    return {
      success: false,
      errors: formatZodErrors(result.error),
    };
  }
  return { success: true, data: result.data as MemberRegistrationInput };
}

/**
 * Validates all fields of the sign up form using Zod schema
 */
export function validateSignUp(values: SignUpValues): SignUpErrors {
  const result = signUpSchema.safeParse(values);
  if (!result.success) {
    return formatZodErrors(result.error);
  }
  return {};
}

/**
 * Derives whether the sign up form is completely valid based on validateSignUp.
 */
export function isSignUpFormValid(values: SignUpValues): boolean {
  return signUpSchema.safeParse(values).success;
}

/**
 * Validates sign-up form fields and verifies password against HIBP breached database.
 */
export async function validateSignUpWithPwnedCheck(
  values: SignUpValues,
  options?: CheckPwnedOptions
): Promise<SignUpErrors> {
  const errors = validateSignUp(values);
  if (errors.password || !values.password) {
    return errors;
  }

  const pwnedError = await validatePasswordNotPwned(values.password, options);
  if (pwnedError) {
    return { ...errors, password: pwnedError };
  }

  return errors;
}

export { checkPwnedPassword, validatePasswordNotPwned };
export type { PwnedCheckResult, CheckPwnedOptions };

/**
 * Validates check-in code input using Zod schema
 */
export function validateCheckIn(values: unknown): ValidationResult<CheckInInput> {
  const result = checkInSchema.safeParse(values);
  if (!result.success) {
    return {
      success: false,
      errors: formatZodErrors(result.error),
    };
  }
  return { success: true, data: result.data };
}

/**
 * Validates ask question input using Zod schema
 */
export function validateAskQuestion(values: unknown): ValidationResult<AskQuestionInput> {
  const result = askQuestionSchema.safeParse(values);
  if (!result.success) {
    return {
      success: false,
      errors: formatZodErrors(result.error),
    };
  }
  return { success: true, data: result.data };
}

/**
 * Validates forgot password input using Zod schema
 */
export function validateForgotPassword(values: unknown): ValidationResult<ForgotPasswordInput> {
  const result = forgotPasswordSchema.safeParse(values);
  if (!result.success) {
    return {
      success: false,
      errors: formatZodErrors(result.error),
    };
  }
  return { success: true, data: result.data };
}

/**
 * Validates reset password completion using Zod schema
 */
export function validateResetPassword(values: unknown): ValidationResult<ResetPasswordInput> {
  const result = resetPasswordSchema.safeParse(values);
  if (!result.success) {
    return {
      success: false,
      errors: formatZodErrors(result.error),
    };
  }
  return { success: true, data: result.data };
}

/**
 * Validates email verification code input using Zod schema
 */
export function validateVerifyEmail(values: unknown): ValidationResult<VerifyEmailInput> {
  const result = verifyEmailSchema.safeParse(values);
  if (!result.success) {
    return {
      success: false,
      errors: formatZodErrors(result.error),
    };
  }
  return { success: true, data: result.data };
}

/**
 * Validates resend verification code input using Zod schema
 */
export function validateResendVerification(values: unknown): ValidationResult<ResendVerificationInput> {
  const result = resendVerificationSchema.safeParse(values);
  if (!result.success) {
    return {
      success: false,
      errors: formatZodErrors(result.error),
    };
  }
  return { success: true, data: result.data };
}
