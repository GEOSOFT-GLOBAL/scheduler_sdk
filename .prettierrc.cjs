/** @type {import("prettier").Config} */
module.exports = {
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 80,
  tabWidth: 2,
  arrowParens: 'always',

  plugins: ['prettier-plugin-tailwindcss'],

  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 100,
      },
    },
  ],
};
