/**
 * @format
 */

import { AppRegistry } from 'react-native';
import { enableScreens } from 'react-native-screens';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import 'react-native-reanimated';
import App from './App';
import { name as appName } from './app.json';
import { NotificationHandler } from './src/services/NotificationHandler';

// Enable react-native-screens for better performance and proper safe area handling
// Call this before any navigation components are rendered
enableScreens(true);

// Register background message handler using modular API
// This must be done outside of the application lifecycle
// Requirements: 7.5, 7.6
setBackgroundMessageHandler(getMessaging(), async (remoteMessage) => {
  console.log('📭 Background message received:', remoteMessage);
  
  // Handle the background notification
  await NotificationHandler.handleBackgroundNotification(remoteMessage);
});

AppRegistry.registerComponent(appName, () => App);
