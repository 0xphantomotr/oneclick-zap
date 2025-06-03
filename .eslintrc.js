module.exports = {
  extends: "next/core-web-vitals",
  rules: {
    "@typescript-eslint/no-unused-vars": "off", // Turn off completely
    "@next/next/no-img-element": "off",
    "react/no-unescaped-entities": "off"
  },
  ignorePatterns: ["node_modules/", ".next/", "out/"]
}; 