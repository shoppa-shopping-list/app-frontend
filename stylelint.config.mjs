/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard-scss'],
  overrides: [
    {
      files: ['**/*.scss'],
      customSyntax: 'postcss-scss',
    },
  ],
  rules: {
    'selector-class-pattern': null,
  },
};
