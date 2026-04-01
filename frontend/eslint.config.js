// ============================================================
// ESLINT CONFIG (v9 flat config format)
// Supports TypeScript and JSX/TSX files
// ============================================================

import js from '@eslint/js'
import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'

export default [
    // Base JS recommended rules
    js.configs.recommended,

    // TypeScript + JSX files
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaFeatures: { jsx: true },
            },
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
        },
        rules: {
            // Warn on unused vars but don't fail the build
            '@typescript-eslint/no-unused-vars': 'warn',
            'no-unused-vars': 'off',   // use TS version instead
            'no-console': 'off',
            'no-undef': 'off',         // TypeScript handles this
            'no-empty': 'warn',        // empty blocks are warnings not errors
            'no-useless-escape': 'warn', // escape chars are warnings not errors
            'prefer-catch-error': 'off',
            'preserve-caught-error': 'off',
        },
    },

    // Ignore build output and backend
    {
        ignores: ['dist/**', 'node_modules/**', 'backend/**'],
    },
]
