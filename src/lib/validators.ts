/**
 * Shared validation utilities for Spotter authentication forms.
 */

export const ERROR_MESSAGES = {
  REQUIRED: 'This field must not be empty',
  FULL_NAME: 'Enter your first and last name',
  EMAIL_INVALID: 'Enter a valid email address',
  PHONE_INVALID: 'Enter a valid mobile number (e.g. 0801 234 5678)',
  PASSWORD_LENGTH: 'Use at least eight characters.',
  PASSWORDS_DONT_MATCH: 'Passwords do not match',
  PRIVACY_REQUIRED: 'You must accept the privacy notice to proceed',
} as const;

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
 * Validates password length
 */
export function validatePassword(value: string): string | null {
  if (!value || value.length === 0) {
    return ERROR_MESSAGES.REQUIRED;
  }

  if (value.length < 8) {
    return ERROR_MESSAGES.PASSWORD_LENGTH;
  }

  return null;
}

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
 * Validates all fields of the sign up form and returns an errors object.
 * An empty errors object ({}) indicates that all fields are valid.
 */
export function validateSignUp(values: SignUpValues): SignUpErrors {
  const errors: SignUpErrors = {};

  const nameError = validateFullName(values.fullName);
  if (nameError) errors.fullName = nameError;

  const emailError = validateEmail(values.email, false);
  if (emailError) errors.email = emailError;

  const phoneError = validateRequired(values.phone);
  if (phoneError) errors.phone = phoneError;

  if (values.memberNumber !== undefined) {
    const memberNumError = validateRequired(values.memberNumber);
    if (memberNumError) errors.memberNumber = memberNumError;
  }

  const passwordError = validatePassword(values.password);
  if (passwordError) errors.password = passwordError;

  if (values.confirmPassword !== undefined) {
    if (!values.confirmPassword || values.confirmPassword.trim().length === 0) {
      errors.confirmPassword = ERROR_MESSAGES.REQUIRED;
    } else if (values.confirmPassword !== values.password) {
      errors.confirmPassword = ERROR_MESSAGES.PASSWORDS_DONT_MATCH;
    }
  }

  if (!values.privacyAccepted) {
    errors.privacyAccepted = ERROR_MESSAGES.PRIVACY_REQUIRED;
  }

  return errors;
}

/**
 * Derives whether the sign up form is completely valid based on validateSignUp.
 */
export function isSignUpFormValid(values: SignUpValues): boolean {
  return Object.keys(validateSignUp(values)).length === 0;
}

