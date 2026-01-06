# Logo Assets

## Available OTW Logos

The project now includes multiple logo variants:

1. **OTW_Full_Logo.png** - Complete colorful OTW logo
2. **OTW_Block_O.png** - Just the block "O" logo
3. **Text version** - Themed text fallback

## Usage

The OTWLogo component supports three variants:

```tsx
// Full colorful logo (default)
<OTWLogo size={150} variant="full" />

// Just the block O
<OTWLogo size={80} variant="block" />

// Text version with theme colors
<OTWLogo size={120} variant="text" />
```

## Logo Colors in Theme

The logo colors are available throughout the app:
- `theme.colors.logoRed` - #DC2626
- `theme.colors.logoYellow` - #F59E0B  
- `theme.colors.logoGreen` - #059669

## Current Implementation

- **Splash Screen**: Uses full logo (`variant="full"`)
- **Size**: Responsive based on `size` prop
- **Fallback**: Text version if images fail to load