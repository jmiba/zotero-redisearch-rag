import tseslint from 'typescript-eslint';
import obsidianmd from '/tmp/obsidian-eslint-plugin/dist/lib/index.js';

export default [
  ...obsidianmd.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: process.cwd(),
      },
    },
    rules: {
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/await-thenable': 'off',
      'obsidianmd/ui/sentence-case': ['error', { enforceCamelCaseLower: true, allowAutoFix: true }],
    },
  },
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'main.js',
      'src/toolAssets.ts',
      'tools/**',
      'docs/**'
    ],
  },
];
