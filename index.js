/**
 * @format
 */

import { AppRegistry } from 'react-native';
import { enableScreens } from 'react-native-screens';
import App from './App';
import { name as appName } from './app.json';

// Enable react-native-screens for better performance and proper safe area handling
// Call this before any navigation components are rendered
enableScreens(true);

AppRegistry.registerComponent(appName, () => App);
