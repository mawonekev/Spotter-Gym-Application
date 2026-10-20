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
    .replace(/from 'next\/navigation'/g, "from './mock-navigation.js'");

  const result = ts.transpileModule(adjusted, {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  });
  return result.outputText;
}

// Build mock-navigation and OnboardingFlow for SSR testing
const buildDir = path.resolve('tests/.build');
if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true });

fs.writeFileSync(
  path.join(buildDir, 'mock-navigation.js'),
  `
  export function useRouter() {
    return {
      push: () => {},
      replace: () => {},
      prefetch: () => {},
    };
  }
  `
);

fs.writeFileSync(
  path.join(buildDir, 'OnboardingFlow.js'),
  loadTsx(path.resolve('src/components/OnboardingFlow.tsx'))
);

const { OnboardingFlow } = await import('./.build/OnboardingFlow.js');

test('OnboardingFlow - renders Step 1 of 4 with member portal education', () => {
  const html = renderToString(React.createElement(OnboardingFlow, { initialStep: 1 }));

  // Header and title
  assert.match(html, /Member Onboarding/);
  assert.match(html, /id="onboarding-step-indicator"[^>]*>STEP 1 OF 4</);
  assert.match(html, /Your Member Records in One Place/);

  // Step 1 features: attendance counter and membership tier
  assert.match(html, /0 days this month/);
  assert.match(html, /BASIC TIER/);
  assert.match(html, /ACTIVE/);

  // Controls: Skip button and Next Step button
  assert.match(html, /id="onboarding-skip-button"/);
  assert.match(html, /id="onboarding-next-button"/);
  assert.match(html, /Next Step/);

  // Back button should NOT be rendered on Step 1
  assert.equal(html.includes('id="onboarding-back-button"'), false);
});

test('OnboardingFlow - renders Step 2 of 4 with daily check-in education', () => {
  const html = renderToString(React.createElement(OnboardingFlow, { initialStep: 2 }));

  assert.match(html, /id="onboarding-step-indicator"[^>]*>STEP 2 OF 4</);
  assert.match(html, /Self-Service Daily Check-In/);
  assert.match(html, /Check in quickly each day using the four digit code/);
  assert.match(html, /Checked in\./);

  // Both Back and Next buttons rendered
  assert.match(html, /id="onboarding-back-button"/);
  assert.match(html, /id="onboarding-next-button"/);
  assert.match(html, /Next Step/);
});

test('OnboardingFlow - renders Step 3 of 4 with grounded answers education', () => {
  const html = renderToString(React.createElement(OnboardingFlow, { initialStep: 3 }));

  assert.match(html, /id="onboarding-step-indicator"[^>]*>STEP 3 OF 4</);
  assert.match(html, /Instant Answers from Gym Records/);
  assert.match(html, /What time is the Saturday class\?/);
  assert.match(html, /Weekend Timetable \(Approved Card\)/);

  // Both Back and Next buttons rendered
  assert.match(html, /id="onboarding-back-button"/);
  assert.match(html, /id="onboarding-next-button"/);
  assert.match(html, /Next Step/);
});

test('OnboardingFlow - renders Step 4 of 4 with front desk officer handoff and Go to Dashboard button', () => {
  const html = renderToString(React.createElement(OnboardingFlow, { initialStep: 4 }));

  assert.match(html, /id="onboarding-step-indicator"[^>]*>STEP 4 OF 4</);
  assert.match(html, /Human Support with Front Desk Handoff/);
  assert.match(html, /Ngozi/);
  assert.match(html, /Send this to Ngozi/);

  // Both Back and final Go to Dashboard button rendered
  assert.match(html, /id="onboarding-back-button"/);
  assert.match(html, /id="onboarding-next-button"/);
  assert.match(html, /Go to Dashboard/);
});

test('OnboardingFlow - strictly adheres to no em dash rule in user-visible text', () => {
  for (let step = 1; step <= 4; step++) {
    const html = renderToString(React.createElement(OnboardingFlow, { initialStep: step }));
    // Verify no em dashes exist anywhere in the output
    assert.equal(html.includes('—'), false, `Found forbidden em dash in Step ${step}`);
  }
});
