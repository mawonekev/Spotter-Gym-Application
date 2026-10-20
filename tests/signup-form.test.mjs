import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import React from 'react';
import { renderToString } from 'react-dom/server';

function loadTsx(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const adjusted = content
    .replace(/from '@\/lib\/validators'/g, "from '../../src/lib/validators.ts'")
    .replace(/from '\.\.\/FormField'/g, "from './FormField.js'");

  const result = ts.transpileModule(adjusted, {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  });
  return result.outputText;
}

// Transpile FormField and SignUpForm to temporary build directory for test import
const buildDir = path.resolve('tests/.build');
if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true });
fs.writeFileSync(path.join(buildDir, 'FormField.js'), loadTsx(path.resolve('src/components/FormField.tsx')));
fs.writeFileSync(path.join(buildDir, 'SignUpForm.js'), loadTsx(path.resolve('src/components/auth/SignUpForm.tsx')));

const { SignUpForm } = await import('./.build/SignUpForm.js');

const isButtonDisabled = (html) => /<button[^>]*id="signup-submit-button"[^>]*\sdisabled(=|\s|>)/i.test(html);

test('SignUpForm component - rendered and disabled on load with no initial error messages', () => {
  const html = renderToString(React.createElement(SignUpForm, { onSwitchView: () => {} }));

  // Button is rendered
  assert.match(html, /id="signup-submit-button"/);
  assert.match(html, />Create Account<\/button>/);

  // Button is disabled on load
  assert.equal(isButtonDisabled(html), true);
  assert.match(html, /aria-disabled="true"/);
  assert.match(html, /cursor:not-allowed/);

  // No error messages shown on first load
  assert.equal(html.includes('role="alert"'), false);

  // Password hint is not shown by default on empty password
  assert.equal(html.includes('Use at least eight characters.'), false);
});

test('SignUpForm component - becomes enabled once the form is valid', () => {
  const validValues = {
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    phone: '08012345678',
    memberNumber: '1042',
    password: 'password123',
    privacyAccepted: true,
  };

  const html = renderToString(React.createElement(SignUpForm, {
    initialValues: validValues,
    onSwitchView: () => {},
  }));

  // Button is enabled immediately
  assert.equal(isButtonDisabled(html), false);
  assert.match(html, /aria-disabled="false"/);
  assert.match(html, /cursor:pointer/);
});

test('SignUpForm component - returns to disabled when a field is broken', () => {
  const baseValid = {
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    phone: '08012345678',
    memberNumber: '1042',
    password: 'password123',
    privacyAccepted: true,
  };

  // 1. Broken email
  const brokenEmailHtml = renderToString(React.createElement(SignUpForm, {
    initialValues: { ...baseValid, email: 'broken-email' },
    onSwitchView: () => {},
  }));
  assert.equal(isButtonDisabled(brokenEmailHtml), true);
  assert.match(brokenEmailHtml, /aria-disabled="true"/);

  // 2. Broken full name (only one name)
  const brokenNameHtml = renderToString(React.createElement(SignUpForm, {
    initialValues: { ...baseValid, fullName: 'SingleName' },
    onSwitchView: () => {},
  }));
  assert.equal(isButtonDisabled(brokenNameHtml), true);
  assert.match(brokenNameHtml, /aria-disabled="true"/);

  // 3. Broken password (too short)
  const brokenPasswordHtml = renderToString(React.createElement(SignUpForm, {
    initialValues: { ...baseValid, password: '123' },
    onSwitchView: () => {},
  }));
  assert.equal(isButtonDisabled(brokenPasswordHtml), true);
  assert.match(brokenPasswordHtml, /aria-disabled="true"/);

  // 4. Broken privacy (unchecked)
  const uncheckedPrivacyHtml = renderToString(React.createElement(SignUpForm, {
    initialValues: { ...baseValid, privacyAccepted: false },
    onSwitchView: () => {},
  }));
  assert.equal(isButtonDisabled(uncheckedPrivacyHtml), true);
  assert.match(uncheckedPrivacyHtml, /aria-disabled="true"/);
});

test('SignUpForm component - normalizes email input to lowercase and disables autocapitalize', () => {
  const html = renderToString(React.createElement(SignUpForm, {
    initialValues: {
      fullName: 'Chioma Adeyemi',
      email: 'Chioma.Adeyemi@EXAMPLE.COM',
      phone: '08012345678',
      memberNumber: '1042',
      password: 'password123',
      privacyAccepted: true,
    },
    onSwitchView: () => {},
  }));

  // Email value rendered in input is normalized to lowercase
  assert.match(html, /value="chioma\.adeyemi@example\.com"/);

  // Email field has autocapitalize="none" attribute to prevent mobile capitalization
  assert.match(html, /id="signup-email"[^>]*autocapitalize="none"/i);
});

test('SignUpForm component - trims password and rejects whitespace-only password', () => {
  const baseValid = {
    fullName: 'Chioma Adeyemi',
    email: 'chioma@example.com',
    phone: '08012345678',
    memberNumber: '1042',
    privacyAccepted: true,
  };

  // Whitespace-only password keeps submit disabled
  const whitespacePasswordHtml = renderToString(React.createElement(SignUpForm, {
    initialValues: {
      ...baseValid,
      password: '        ', // 8 spaces
    },
    onSwitchView: () => {},
  }));
  assert.equal(isButtonDisabled(whitespacePasswordHtml), true);

  // Password with surrounding whitespace is trimmed to valid length
  const trimmedPasswordHtml = renderToString(React.createElement(SignUpForm, {
    initialValues: {
      ...baseValid,
      password: '  password123  ',
    },
    onSwitchView: () => {},
  }));
  assert.equal(isButtonDisabled(trimmedPasswordHtml), false);
  assert.match(trimmedPasswordHtml, /value="password123"/);
});
