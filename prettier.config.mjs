/** @type {import("prettier").Config} */
export default {
  // Maximum line width for better readability
  printWidth: 100,

  // Number of spaces per indentation level
  tabWidth: 2,

  // Use spaces instead of tabs
  useTabs: false,

  // Add semicolons at the end of statements (reduces diff noise)
  semi: true,

  // Use single quotes instead of double quotes
  singleQuote: true,

  // Only add quotes around object properties when required
  quoteProps: 'as-needed',

  // Use double quotes in JSX (consistent with HTML)
  jsxSingleQuote: false,

  // Add trailing commas where valid in ES5 (objects, arrays, etc.)
  trailingComma: 'es5',

  // Add spaces inside object literals
  bracketSpacing: true,

  // Place the closing bracket of JSX elements on a new line
  bracketSameLine: false,

  // Always include parentheses around arrow function parameters
  arrowParens: 'always',

  // Use LF for line endings (consistent across OS)
  endOfLine: 'lf',

  // Automatically format embedded code (e.g., JS inside HTML)
  embeddedLanguageFormatting: 'auto',

  // Respect CSS display property when formatting HTML
  htmlWhitespaceSensitivity: 'css',

  // Don't indent <script> and <style> tags in Vue files
  vueIndentScriptAndStyle: false,

  // Put each attribute on its own line for better readability
  singleAttributePerLine: true,
};
