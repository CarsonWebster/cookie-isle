import prettier from 'eslint-config-prettier';
import { fileURLToPath } from 'node:url';
import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	// Ignore legacy Hugo project (archived, uses Go templates)
	{
		ignores: ['_legacy/**']
	},
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended,
	prettier,
	...svelte.configs.prettier,
	{
		languageOptions: { globals: { ...globals.browser, ...globals.node } },

		rules: {
			// typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
			// see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
			'no-undef': 'off'
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],

		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser,
				svelteConfig
			}
		},

		rules: {
			// Relax Svelte 5 rules that require significant refactoring
			// TODO: Address these in a future refactor pass
			'svelte/no-navigation-without-resolve': 'warn', // Requires resolve() for all href links
			'svelte/require-each-key': 'warn', // Requires key on each blocks
			'svelte/no-useless-mustaches': 'warn', // String interpolation warnings
			'svelte/prefer-svelte-reactivity': 'warn' // SvelteMap/SvelteDate suggestions
		}
	},
	// Relax rules for test files
	{
		files: ['**/*.spec.ts', '**/*.test.ts'],
		rules: {
			'@typescript-eslint/no-explicit-any': 'off', // Allow any in tests for mocking
			'@typescript-eslint/no-unused-vars': 'off', // Allow unused vars in tests (common with destructuring)
			'prefer-const': 'warn' // Relax prefer-const in tests
		}
	}
);
