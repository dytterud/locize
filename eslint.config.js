import neostandard from 'neostandard'
import importPlugin from 'eslint-plugin-import'

export default [
  ...neostandard({
    ignores: [
      'dist/**/*',
      'debuggingApps/**/*',
      'examples/**/*',
      '**/*.min.*',
      'locize.js',
      'locize.min.js',
      '**/*.d.ts',
      '**/*.d.mts'
    ]
  }),

  // type definitions and their tsd assertions
  ...neostandard({
    ts: true,
    files: ['*.d.ts', '*.d.mts', 'test/types/**/*.test-d.ts']
  }),
  {
    files: ['*.d.ts', '*.d.mts', 'test/types/**/*.test-d.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      // overload interfaces legitimately export the same name more than once
      'import/export': 'off'
    }
  },
  {
    files: ['test/types/**/*.test-d.ts'],
    rules: {
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off'
    }
  },

  {
    files: ['**/*.{js,mjs,ts}'],
    plugins: { import: importPlugin },
    settings: {
      'import/resolver': {
        node: { extensions: ['.js', '.mjs', '.ts'], moduleDirectory: ['node_modules'] }
      }
    }
  }
]
