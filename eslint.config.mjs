import js from "@eslint/js"

const eslintConfig = [
  js.configs.recommended,
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/out/**",
      "**/dist/**",
      "**/build/**",
    ],
  },
  {
    rules: {
      "no-unused-vars": "off", // TypeScript handles this
      "no-undef": "off", // TypeScript handles this
    },
  },
]

export default eslintConfig
