// .eslintrc.js
module.exports = {
  root: true,
  extends: ["next", "next/core-web-vitals", "plugin:@typescript-eslint/recommended"],
  rules: {
    "@typescript-eslint/no-explicit-any": "off", // ✅ allow 'any'
    "@typescript-eslint/no-unused-vars": "off",  // ✅ allow unused vars
    "react-hooks/exhaustive-deps": "warn",       // 👁 optional but safe
    "@next/next/no-img-element": "warn"          // 👁 Next wants you to use <Image /> instead of <img>
  }
};
