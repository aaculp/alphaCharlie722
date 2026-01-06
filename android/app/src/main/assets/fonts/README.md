# Font Installation Guide

## Required Font Files

To complete the font setup, download and add these font files to this directory:

### Poppins (Primary Font - Headings, Branding)
Download from: https://fonts.google.com/specimen/Poppins

Required files:
- `Poppins-Regular.ttf`
- `Poppins-Medium.ttf`
- `Poppins-SemiBold.ttf`
- `Poppins-Bold.ttf`

### Inter (Secondary Font - Body Text, UI)
Download from: https://fonts.google.com/specimen/Inter

Required files:
- `Inter-Regular.ttf`
- `Inter-Medium.ttf`
- `Inter-SemiBold.ttf`
- `Inter-Bold.ttf`

## Installation Steps

### Android:
1. Download the .ttf files from Google Fonts
2. Place all 8 font files in this directory: `android/app/src/main/assets/fonts/`

### iOS:
1. Copy the same 8 font files to: `ios/alphaCharlie722/Fonts/`
2. Add font references to `ios/alphaCharlie722/Info.plist`:

```xml
<key>UIAppFonts</key>
<array>
    <string>Poppins-Regular.ttf</string>
    <string>Poppins-Medium.ttf</string>
    <string>Poppins-SemiBold.ttf</string>
    <string>Poppins-Bold.ttf</string>
    <string>Inter-Regular.ttf</string>
    <string>Inter-Medium.ttf</string>
    <string>Inter-SemiBold.ttf</string>
    <string>Inter-Bold.ttf</string>
</array>
```

## Usage in Code

The fonts are now available in your theme:

```tsx
// Poppins (Primary) - for headings, branding
fontFamily: theme.fonts.primary.regular    // Poppins-Regular
fontFamily: theme.fonts.primary.medium     // Poppins-Medium
fontFamily: theme.fonts.primary.semiBold   // Poppins-SemiBold
fontFamily: theme.fonts.primary.bold       // Poppins-Bold

// Inter (Secondary) - for body text, UI
fontFamily: theme.fonts.secondary.regular  // Inter-Regular
fontFamily: theme.fonts.secondary.medium   // Inter-Medium
fontFamily: theme.fonts.secondary.semiBold // Inter-SemiBold
fontFamily: theme.fonts.secondary.bold     // Inter-Bold
```

## Font Hierarchy

- **Poppins**: Headings, titles, branding, emphasis text
- **Inter**: Body text, navigation, buttons, form inputs, general UI

After adding the font files, restart the app to see the new typography!