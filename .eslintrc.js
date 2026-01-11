module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    // Allow inline styles for dynamic theming and conditional styling
    'react-native/no-inline-styles': 'off',
    // Allow component definitions in render for simple cases (render props, etc.)
    'react/no-unstable-nested-components': 'off',
  },
};
