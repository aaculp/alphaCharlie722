# alphaCharlie722

A React Native app with bottom tab navigation featuring venue discovery and user settings.

## Navigation Structure

### Bottom Tab Navigator
- **Home (Feed)**: Displays a feed of featured venues with images, ratings, and descriptions
- **Search**: Search and browse all venues with detailed filtering
- **Settings**: User settings and experimental features

### Search Stack
- **Search List**: Main search interface with search bar and venue list
- **Venue Detail**: Detailed venue information including contact info, hours, and amenities

## Features

### Home Screen
- Feed of featured venues
- Venue cards with images, ratings, and descriptions
- Smooth scrolling interface

### Search Screen
- Real-time search functionality
- Filter by venue name, category, or location
- Venue list with ratings and distance
- Navigation to detailed venue pages

### Venue Detail Screen
- Comprehensive venue information
- Contact details with direct calling and website links
- Operating hours
- Amenities and features
- Google Maps integration for directions

### Settings Screen
- User profile management
- Notification preferences
- Location services toggle
- Dark mode support
- Experimental features section
- Support and legal information
- Account management

## Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Install iOS Dependencies (iOS only)

For iOS, install CocoaPods dependencies:

```bash
bundle install
bundle exec pod install
```

### Step 3: Start Metro

```bash
npm start
```

### Step 4: Run the App

#### Quick Start (Recommended)
```bash
npm run dev:full
```
This command starts the emulator, Metro bundler, and builds/installs the app all at once.

#### Individual Commands
```bash
# Start emulator only
npm run emulator

# Start Metro bundler only  
npm start

# Build and install app (after emulator and Metro are running)
npm run android

# For iOS
npm run ios
```

#### Development Scripts
```bash
# Start emulator + Metro (you'll need to run android separately)
npm run dev

# Clean build and fresh start (if you have build issues)
npm run fresh-start

# Clean build cache only
npm run clean
```

## Dependencies

- React Navigation v6 (Bottom Tabs & Native Stack)
- React Native Vector Icons (Ionicons)
- React Native Safe Area Context
- React Native Screens

## Project Structure

```
src/
├── navigation/
│   └── AppNavigator.tsx    # Main navigation configuration
├── screens/
│   ├── HomeScreen.tsx      # Feed/Home screen
│   ├── SearchScreen.tsx    # Venue search screen
│   ├── VenueDetailScreen.tsx # Individual venue details
│   ├── SettingsScreen.tsx  # User settings
│   └── index.ts           # Screen exports
```

## Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.