#!/usr/bin/env node

/**
 * ====================================================================
 * Design System Token to CSS Variables Converter
 * ====================================================================
 * 
 * Converts `tokens.json` into production-ready CSS Custom Properties (variables).
 * 
 * COLOR SYSTEM ARCHITECTURAL RULE:
 * 1. Primitive Colors (--color-primitive-*):
 *    - Represent raw tonal palettes (e.g. primary-40, neutral-10).
 *    - Defined globally on :root as fixed palette references.
 *    - THESE MUST NEVER BE USED DIRECTLY IN UI COMPONENT CODE.
 * 
 * 2. Color Roles (--color-*):
 *    - Represent functional, context-aware semantic roles (e.g. surface,
 *      primary, on-primary, surface-container, outline, error).
 *    - THESE ARE THE OFFICIAL CONTRACT USED DIRECTLY IN UI CODE.
 *    - Dynamically switch between Light and Dark modes.
 * 
 * 3. Component Tokens (--button-*, --input-*, --card-*, etc.):
 *    - Specific component properties referencing semantic color roles.
 * 
 * Usage:
 *   node scripts/convert-tokens-to-css.js [inputPath] [outputPath]
 *   node scripts/convert-tokens-to-css.js --watch
 * 
 * Defaults:
 *   Input:  ./tokens.json
 *   Output: ./tokens.css
 */

const fs = require('fs');
const path = require('path');

/**
 * Converts camelCase and dot.separated keys into kebab-case.
 * Handles digits and compound names cleanly.
 */
function toKebabCase(str) {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\._]/g, '-')
    .toLowerCase();
}

/**
 * Maps any token path in tokens.json to its official CSS variable name.
 */
function mapTokenPathToCssVar(tokenPath) {
  // 1. Primitives: Color Palettes (Private/Internal swatches)
  if (tokenPath.startsWith('primitives.color.')) {
    const sub = tokenPath.replace('primitives.color.', '');
    return `--color-primitive-${toKebabCase(sub)}`;
  }

  // 2. Primitives: Spacing, Radius, Borders, Typography, Layout, etc.
  if (tokenPath.startsWith('primitives.spacing.')) {
    const sub = tokenPath.replace('primitives.spacing.', '');
    return `--spacing-${sub}`;
  }
  if (tokenPath.startsWith('primitives.radius.')) {
    const sub = tokenPath.replace('primitives.radius.', '');
    return `--radius-${toKebabCase(sub)}`;
  }
  if (tokenPath.startsWith('primitives.border.') || tokenPath.startsWith('primitives.borderWidth.')) {
    const sub = tokenPath.replace(/^primitives\.(border|borderWidth)\./, '');
    return `--border-width-${toKebabCase(sub)}`;
  }
  if (tokenPath.startsWith('primitives.typography.')) {
    const sub = tokenPath.replace('primitives.typography.', '');
    return `--${toKebabCase(sub)}`;
  }
  if (tokenPath.startsWith('primitives.elevation.')) {
    const sub = tokenPath.replace('primitives.elevation.', '');
    return `--${toKebabCase(sub)}`;
  }
  if (tokenPath.startsWith('primitives.icon.')) {
    const sub = tokenPath.replace('primitives.icon.', '');
    return `--icon-size-${toKebabCase(sub)}`;
  }
  if (tokenPath.startsWith('primitives.motion.')) {
    const sub = tokenPath.replace('primitives.motion.', '');
    return `--motion-${toKebabCase(sub)}`;
  }
  if (tokenPath.startsWith('primitives.breakpoint.')) {
    const sub = tokenPath.replace('primitives.breakpoint.', '');
    return `--breakpoint-${toKebabCase(sub)}`;
  }
  if (tokenPath.startsWith('primitives.layout.touchTarget.')) {
    const sub = tokenPath.replace('primitives.layout.touchTarget.', '');
    return `--touch-target-${toKebabCase(sub)}`;
  }
  if (tokenPath.startsWith('primitives.layout.content.')) {
    const sub = tokenPath.replace('primitives.layout.content.', '');
    return `--layout-content-${toKebabCase(sub)}`;
  }
  if (tokenPath.startsWith('primitives.zIndex.')) {
    const sub = tokenPath.replace('primitives.zIndex.', '');
    return `--z-index-${toKebabCase(sub)}`;
  }

  // 3. Semantic Tokens: Color Roles (Public Semantic API)
  if (tokenPath.startsWith('semantic.color.')) {
    const sub = tokenPath.replace('semantic.color.', '');
    return `--color-${toKebabCase(sub)}`;
  }
  if (tokenPath.startsWith('semantic.border.color.')) {
    const sub = tokenPath.replace('semantic.border.color.', '');
    return `--border-color-${toKebabCase(sub)}`;
  }
  if (tokenPath.startsWith('semantic.border.width.')) {
    const sub = tokenPath.replace('semantic.border.width.', '');
    return `--border-width-${toKebabCase(sub)}`;
  }
  if (tokenPath.startsWith('semantic.border.radius.')) {
    const sub = tokenPath.replace('semantic.border.radius.', '');
    return `--radius-${toKebabCase(sub)}`;
  }
  if (tokenPath.startsWith('semantic.border.')) {
    const sub = tokenPath.replace('semantic.border.', '');
    return `--border-color-${toKebabCase(sub)}`;
  }
  if (tokenPath.startsWith('semantic.elevation.')) {
    const sub = tokenPath.replace('semantic.elevation.', '');
    return `--elevation-${toKebabCase(sub)}`;
  }
  if (tokenPath.startsWith('semantic.state.')) {
    const sub = tokenPath.replace('semantic.state.', '');
    return `--state-${toKebabCase(sub)}`;
  }

  // 4. Component Tokens
  if (tokenPath.startsWith('components.')) {
    const sub = tokenPath.replace('components.', '');
    return `--${toKebabCase(sub)}`;
  }

  return `--${toKebabCase(tokenPath)}`;
}

/**
 * Builds an index of all token paths to their CSS variable name.
 */
function buildTokenMap(tokens) {
  const map = {};

  function traverse(obj, prefix = '') {
    for (const [key, value] of Object.entries(obj)) {
      const fullPath = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        traverse(value, fullPath);
      } else {
        map[fullPath] = mapTokenPathToCssVar(fullPath);
      }
    }
  }

  if (tokens.primitives) traverse(tokens.primitives, 'primitives');
  if (tokens.semantic) traverse(tokens.semantic, 'semantic');
  if (tokens.components) traverse(tokens.components, 'components');

  return map;
}

/**
 * Helper to retrieve raw value from token AST by path.
 */
function getRawValue(tokens, pathStr) {
  const parts = pathStr.split('.');
  let curr = tokens;
  for (const p of parts) {
    if (curr === undefined || curr === null) return undefined;
    curr = curr[p];
  }
  return curr;
}

/**
 * Resolves references formatted as `{path.to.token}` to `var(--mapped-var)`.
 * Detects and prevents circular / self-referencing definitions.
 */
function resolveTokenValue(rawVal, tokenMap, currentVarName, tokens) {
  if (typeof rawVal !== 'string') return String(rawVal);

  return rawVal.replace(/\{([^}]+)\}/g, (match, refPath) => {
    const targetVar = tokenMap[refPath] || mapTokenPathToCssVar(refPath);

    // Guard against self-reference (e.g. --x: var(--x))
    if (currentVarName && targetVar === currentVarName) {
      if (tokens) {
        let rawTarget = getRawValue(tokens, refPath);
        // If rawTarget is itself a reference, follow it once
        if (typeof rawTarget === 'string' && rawTarget.startsWith('{') && rawTarget.endsWith('}')) {
          const innerPath = rawTarget.slice(1, -1);
          rawTarget = getRawValue(tokens, innerPath);
        }
        if (rawTarget && typeof rawTarget !== 'object') {
          return String(rawTarget);
        }
      }
    }

    return `var(${targetVar})`;
  });
}

/**
 * Formats a block of key-value pairs into indented CSS rules.
 */
function formatCssBlock(entries, indent = '  ') {
  return entries
    .map(({ name, value, comment }) => {
      const line = `${indent}${name}: ${value};`;
      return comment ? `${indent}/* ${comment} */\n${line}` : line;
    })
    .join('\n');
}

/**
 * Main conversion function: transforms tokens.json AST into CSS.
 */
function convertTokensToCss(tokens) {
  const tokenMap = buildTokenMap(tokens);
  const sections = [];

  // Metadata banner
  const meta = tokens.metadata || {};
  sections.push(`/**
 * ====================================================================
 * ${meta.name ? meta.name.toUpperCase() : 'DESIGN SYSTEM'} - CSS TOKENS
 * Version: ${meta.version || '1.0.0'}
 * Description: ${meta.description || 'Design Tokens compiled to CSS Custom Properties'}
 * Primary Brand: Deep Indigo (#4F46E5)
 * ====================================================================
 * 
 * ARCHITECTURAL RULE:
 * 1. PRIMITIVE COLORS (--color-primitive-*):
 *    - Internal color swatches representing raw tonal palettes (0-100).
 *    - DO NOT USE DIRECTLY ON THE UI.
 * 
 * 2. COLOR ROLES (--color-*):
 *    - Theme-aware, semantic color roles (Material 3 contract).
 *    - ALWAYS USE THESE DIRECTLY IN UI COMPONENTS.
 *    - They dynamically re-map between Light and Dark themes.
 * 
 * 3. COMPONENT TOKENS (--button-*, --input-*, --card-*, etc.):
 *    - Contextual tokens for UI elements bound to semantic color roles.
 */`);

  // --- 1. GLOBAL ROOT: PRIMITIVES & UNCHANGING SCALES ---
  const rootEntries = [];

  // 1A. Primitive Color Palettes
  rootEntries.push({ comment: '=== 1. PRIMITIVE COLOR PALETTES (DO NOT USE DIRECTLY IN UI) ===' });

  const colorPalettes = ['primary', 'secondary', 'tertiary', 'neutral', 'neutralVariant', 'success', 'warning', 'error', 'information'];
  for (const pal of colorPalettes) {
    if (tokens.primitives.color && tokens.primitives.color[pal]) {
      rootEntries.push({ comment: `Tonal Palette: ${pal}` });
      for (const [tone, hex] of Object.entries(tokens.primitives.color[pal])) {
        if (tone.includes('Tonal')) continue;
        const varName = mapTokenPathToCssVar(`primitives.color.${pal}.${tone}`);
        rootEntries.push({ name: varName, value: hex });
      }
    }
  }

  // 1B. Primitive Static Colors
  if (tokens.primitives.color && tokens.primitives.color.static) {
    rootEntries.push({ comment: 'Static Colors' });
    for (const [name, val] of Object.entries(tokens.primitives.color.static)) {
      const varName = mapTokenPathToCssVar(`primitives.color.static.${name}`);
      rootEntries.push({ name: varName, value: val });
    }
  }

  // 1C. Spacing Primitives
  if (tokens.primitives.spacing) {
    rootEntries.push({ comment: '=== 2. SPACING SCALE (4px BASE UNIT) ===' });
    for (const [key, val] of Object.entries(tokens.primitives.spacing)) {
      rootEntries.push({ name: mapTokenPathToCssVar(`primitives.spacing.${key}`), value: val });
    }
  }

  // 1D. Border Radii
  if (tokens.primitives.radius) {
    rootEntries.push({ comment: '=== 3. BORDER RADII ===' });
    for (const [key, val] of Object.entries(tokens.primitives.radius)) {
      rootEntries.push({ name: mapTokenPathToCssVar(`primitives.radius.${key}`), value: val });
    }
  }

  // 1E. Border Widths
  if (tokens.primitives.border) {
    rootEntries.push({ comment: '=== 4. BORDER WIDTHS ===' });
    for (const [key, val] of Object.entries(tokens.primitives.border)) {
      const varName = `--border-width-${toKebabCase(key)}`;
      const resolved = resolveTokenValue(val, tokenMap, varName, tokens);
      rootEntries.push({ name: varName, value: resolved });
    }
  }

  // 1F. Typography Primitives
  if (tokens.primitives.typography) {
    rootEntries.push({ comment: '=== 5. TYPOGRAPHY PRIMITIVES ===' });
    const typo = tokens.primitives.typography;
    if (typo.fontFamily) {
      for (const [k, v] of Object.entries(typo.fontFamily)) {
        rootEntries.push({ name: `--font-family-${toKebabCase(k)}`, value: v });
      }
    }
    if (typo.fontWeight) {
      for (const [k, v] of Object.entries(typo.fontWeight)) {
        rootEntries.push({ name: `--font-weight-${toKebabCase(k)}`, value: String(v) });
      }
    }
    if (typo.fontSize) {
      for (const [k, v] of Object.entries(typo.fontSize)) {
        rootEntries.push({ name: `--font-size-${toKebabCase(k)}`, value: v });
      }
    }
    if (typo.lineHeight) {
      for (const [k, v] of Object.entries(typo.lineHeight)) {
        rootEntries.push({ name: `--line-height-${toKebabCase(k)}`, value: v });
      }
    }
    if (typo.letterSpacing) {
      for (const [k, v] of Object.entries(typo.letterSpacing)) {
        rootEntries.push({ name: `--letter-spacing-${toKebabCase(k)}`, value: v });
      }
    }
  }

  // 1G. Motion
  if (tokens.primitives.motion) {
    rootEntries.push({ comment: '=== 6. MOTION (DURATION & EASING) ===' });
    if (tokens.primitives.motion.duration) {
      for (const [k, v] of Object.entries(tokens.primitives.motion.duration)) {
        rootEntries.push({ name: `--motion-duration-${toKebabCase(k)}`, value: v });
      }
    }
    if (tokens.primitives.motion.easing) {
      for (const [k, v] of Object.entries(tokens.primitives.motion.easing)) {
        rootEntries.push({ name: `--motion-easing-${toKebabCase(k)}`, value: v });
      }
    }
  }

  // 1H. Breakpoints
  if (tokens.primitives.breakpoint) {
    rootEntries.push({ comment: '=== 7. RESPONSIVE BREAKPOINTS ===' });
    for (const [k, v] of Object.entries(tokens.primitives.breakpoint)) {
      rootEntries.push({ name: `--breakpoint-${toKebabCase(k)}`, value: v });
    }
  }

  // 1I. Layout & Accessibility
  if (tokens.primitives.layout) {
    rootEntries.push({ comment: '=== 8. LAYOUT & ACCESSIBILITY TARGETS ===' });
    if (tokens.primitives.layout.content) {
      for (const [k, v] of Object.entries(tokens.primitives.layout.content)) {
        rootEntries.push({ name: `--layout-content-${toKebabCase(k)}`, value: v });
      }
    }
    if (tokens.primitives.layout.touchTarget) {
      for (const [k, v] of Object.entries(tokens.primitives.layout.touchTarget)) {
        rootEntries.push({ name: `--touch-target-${toKebabCase(k)}`, value: v });
      }
    }
  }

  // 1J. Z-Index
  if (tokens.primitives.zIndex) {
    rootEntries.push({ comment: '=== 9. Z-INDEX LAYERING ===' });
    for (const [k, v] of Object.entries(tokens.primitives.zIndex)) {
      rootEntries.push({ name: `--z-index-${toKebabCase(k)}`, value: String(v) });
    }
  }

  // 1K. Icons
  if (tokens.primitives.icon) {
    rootEntries.push({ comment: '=== 10. ICON SIZES ===' });
    for (const [k, v] of Object.entries(tokens.primitives.icon)) {
      const varName = `--icon-size-${toKebabCase(k)}`;
      const resolved = resolveTokenValue(v, tokenMap, varName, tokens);
      rootEntries.push({ name: varName, value: resolved });
    }
  }

  // 1L. States
  if (tokens.semantic && tokens.semantic.state) {
    rootEntries.push({ comment: '=== 11. INTERACTION STATES ===' });
    function flattenState(obj, prefix = 'state') {
      for (const [k, v] of Object.entries(obj)) {
        if (typeof v === 'object' && v !== null) {
          flattenState(v, `${prefix}-${toKebabCase(k)}`);
        } else {
          const varName = `--${prefix}-${toKebabCase(k)}`;
          const resolved = resolveTokenValue(v, tokenMap, varName, tokens);
          rootEntries.push({ name: varName, value: resolved });
        }
      }
    }
    flattenState(tokens.semantic.state);
  }

  sections.push(`:root {\n${formatCssBlock(rootEntries.filter(e => e.name))}\n}`);

  // --- 2. LIGHT THEME (COLOR ROLES & SEMANTIC TOKENS) ---
  const lightEntries = [];
  const lightTheme = (tokens.themes && tokens.themes.light) || tokens.semantic;

  lightEntries.push({ comment: 'Material 3 Color Roles (Light Mode)' });
  if (lightTheme.color) {
    for (const [role, refVal] of Object.entries(lightTheme.color)) {
      const varName = `--color-${toKebabCase(role)}`;
      const resolved = resolveTokenValue(refVal, tokenMap, varName, tokens);
      lightEntries.push({ name: varName, value: resolved });
    }
  }

  lightEntries.push({ comment: 'Semantic Borders (Light Mode)' });
  if (lightTheme.border) {
    const borders = lightTheme.border.color || lightTheme.border;
    for (const [bName, refVal] of Object.entries(borders)) {
      if (typeof refVal === 'string') {
        const varName = `--border-color-${toKebabCase(bName)}`;
        const resolved = resolveTokenValue(refVal, tokenMap, varName, tokens);
        lightEntries.push({ name: varName, value: resolved });
      }
    }
  }

  lightEntries.push({ comment: 'Semantic Elevation (Light Mode)' });
  if (lightTheme.elevation) {
    for (const [lvl, refVal] of Object.entries(lightTheme.elevation)) {
      const varName = `--elevation-${toKebabCase(lvl)}`;
      const resolved = resolveTokenValue(refVal, tokenMap, varName, tokens);
      lightEntries.push({ name: varName, value: resolved });
    }
  }

  sections.push(`/**
 * ====================================================================
 * COLOR ROLES: LIGHT THEME (DEFAULT)
 * Always use these role variables in UI styling.
 * ====================================================================
 */
:root,
[data-theme="light"] {
${formatCssBlock(lightEntries.filter(e => e.name))}
}`);

  // --- 3. DARK THEME (COLOR ROLES & SEMANTIC TOKENS) ---
  const darkEntries = [];
  const darkTheme = (tokens.themes && tokens.themes.dark) || {};

  darkEntries.push({ comment: 'Material 3 Color Roles (Dark Mode - Elevated Surfaces)' });
  if (darkTheme.color) {
    for (const [role, refVal] of Object.entries(darkTheme.color)) {
      const varName = `--color-${toKebabCase(role)}`;
      const resolved = resolveTokenValue(refVal, tokenMap, varName, tokens);
      darkEntries.push({ name: varName, value: resolved });
    }
  }

  darkEntries.push({ comment: 'Semantic Borders (Dark Mode)' });
  if (darkTheme.border) {
    const borders = darkTheme.border.color || darkTheme.border;
    for (const [bName, refVal] of Object.entries(borders)) {
      if (typeof refVal === 'string') {
        const varName = `--border-color-${toKebabCase(bName)}`;
        const resolved = resolveTokenValue(refVal, tokenMap, varName, tokens);
        darkEntries.push({ name: varName, value: resolved });
      }
    }
  }

  darkEntries.push({ comment: 'Semantic Elevation (Dark Mode - Deep Ambient Shadows)' });
  if (darkTheme.elevation) {
    for (const [lvl, refVal] of Object.entries(darkTheme.elevation)) {
      const varName = `--elevation-${toKebabCase(lvl)}`;
      const resolved = resolveTokenValue(refVal, tokenMap, varName, tokens);
      darkEntries.push({ name: varName, value: resolved });
    }
  }

  const darkCssBlock = formatCssBlock(darkEntries.filter(e => e.name));
  sections.push(`/**
 * ====================================================================
 * COLOR ROLES: DARK THEME
 * Automatically re-maps the color roles to dark elevated tones.
 * ====================================================================
 */
[data-theme="dark"] {
${darkCssBlock}
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
${darkCssBlock}
  }
}`);

  // --- 4. COMPONENT TOKENS ---
  const componentEntries = [];
  if (tokens.components) {
    function flattenComponent(obj, prefix) {
      for (const [key, val] of Object.entries(obj)) {
        const fullPrefix = prefix ? `${prefix}-${toKebabCase(key)}` : toKebabCase(key);
        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
          flattenComponent(val, fullPrefix);
        } else {
          const varName = `--${fullPrefix}`;
          const resolved = resolveTokenValue(val, tokenMap, varName, tokens);
          componentEntries.push({ name: varName, value: resolved });
        }
      }
    }

    for (const [compName, compTokens] of Object.entries(tokens.components)) {
      componentEntries.push({ comment: `Component: ${compName}` });
      flattenComponent(compTokens, compName);
    }
  }

  sections.push(`/**
 * ====================================================================
 * COMPONENT-LEVEL TOKENS
 * Scoped tokens consuming the semantic color roles and dimension tokens.
 * ====================================================================
 */
:root {
${formatCssBlock(componentEntries.filter(e => e.name))}
}`);

  // --- 5. COMPOSITE TYPOGRAPHY UTILITY CLASSES ---
  if (tokens.semantic && tokens.semantic.typography) {
    const typoClasses = [];
    for (const [name, def] of Object.entries(tokens.semantic.typography)) {
      const className = `.type-${toKebabCase(name)}`;
      const rules = [
        `  font-family: ${resolveTokenValue(def.fontFamily, tokenMap, '', tokens)};`,
        `  font-size: ${resolveTokenValue(def.fontSize, tokenMap, '', tokens)};`,
        `  font-weight: ${resolveTokenValue(def.fontWeight, tokenMap, '', tokens)};`,
        `  line-height: ${resolveTokenValue(def.lineHeight, tokenMap, '', tokens)};`,
        `  letter-spacing: ${resolveTokenValue(def.letterSpacing, tokenMap, '', tokens)};`
      ].join('\n');
      typoClasses.push(`${className} {\n${rules}\n}`);
    }

    sections.push(`/**
 * ====================================================================
 * COMPOSITE TYPOGRAPHY STYLES
 * Ready-to-use utility classes adhering to the typography hierarchy.
 * ====================================================================
 */
${typoClasses.join('\n\n')}`);
  }

  return sections.join('\n\n');
}

/**
 * File I/O runner.
 */
function buildCss(inputPath, outputPath) {
  const resolvedInput = path.resolve(process.cwd(), inputPath);
  const resolvedOutput = path.resolve(process.cwd(), outputPath);

  console.log(`[Tokens->CSS] Reading design tokens: ${resolvedInput}`);
  if (!fs.existsSync(resolvedInput)) {
    console.error(`[Tokens->CSS] Error: Input file does not exist: ${resolvedInput}`);
    process.exit(1);
  }

  const rawJson = fs.readFileSync(resolvedInput, 'utf8');
  let tokens;
  try {
    tokens = JSON.parse(rawJson);
  } catch (err) {
    console.error(`[Tokens->CSS] Error parsing JSON in ${resolvedInput}:`, err.message);
    process.exit(1);
  }

  const css = convertTokensToCss(tokens);

  // Ensure target directory exists
  const outDir = path.dirname(resolvedOutput);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(resolvedOutput, css, 'utf8');
  console.log(`[Tokens->CSS] Successfully compiled CSS tokens: ${resolvedOutput} (${(css.length / 1024).toFixed(2)} KB)`);
}

// CLI Execution Support
if (require.main === module) {
  const args = process.argv.slice(2);
  const isWatch = args.includes('--watch') || args.includes('-w');

  const cleanArgs = args.filter(a => a !== '--watch' && a !== '-w');
  const inputPath = cleanArgs[0] || 'tokens.json';
  const outputPath = cleanArgs[1] || 'tokens.css';

  buildCss(inputPath, outputPath);

  if (isWatch) {
    const resolvedInput = path.resolve(process.cwd(), inputPath);
    console.log(`[Tokens->CSS] Watching for changes in ${resolvedInput}...`);
    fs.watchFile(resolvedInput, { interval: 500 }, () => {
      console.log(`[Tokens->CSS] Detected change in ${inputPath}, recompiling...`);
      buildCss(inputPath, outputPath);
    });
  }
}

module.exports = {
  convertTokensToCss,
  buildCss,
  mapTokenPathToCssVar
};
