package com.alphacharlie722

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
    createNotificationChannels()
  }

  private fun createNotificationChannels() {
    // Notification channels are only required for Android 8.0 (API level 26) and above
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val notificationManager = getSystemService(NotificationManager::class.java)

      // Social Notifications Channel - High importance for friend requests, venue shares, etc.
      val socialChannel = NotificationChannel(
        "social_notifications",
        "Social Notifications",
        NotificationManager.IMPORTANCE_HIGH
      ).apply {
        description = "Notifications for friend requests, venue shares, and social interactions"
        enableLights(true)
        enableVibration(true)
        setShowBadge(true)
      }

      // Friend Requests Channel - High importance
      val friendRequestsChannel = NotificationChannel(
        "friend_requests",
        "Friend Requests",
        NotificationManager.IMPORTANCE_HIGH
      ).apply {
        description = "Notifications when someone sends you a friend request"
        enableLights(true)
        enableVibration(true)
        setShowBadge(true)
      }

      // Venue Shares Channel - Default importance
      val venueSharesChannel = NotificationChannel(
        "venue_shares",
        "Venue Shares",
        NotificationManager.IMPORTANCE_DEFAULT
      ).apply {
        description = "Notifications when friends share venues with you"
        enableLights(true)
        enableVibration(true)
        setShowBadge(true)
      }

      // Activity Updates Channel - Default importance
      val activityChannel = NotificationChannel(
        "activity_updates",
        "Activity Updates",
        NotificationManager.IMPORTANCE_DEFAULT
      ).apply {
        description = "Notifications for likes, comments, and other activity"
        enableLights(true)
        enableVibration(false)
        setShowBadge(true)
      }

      // Register all channels
      notificationManager.createNotificationChannel(socialChannel)
      notificationManager.createNotificationChannel(friendRequestsChannel)
      notificationManager.createNotificationChannel(venueSharesChannel)
      notificationManager.createNotificationChannel(activityChannel)
    }
  }
}
