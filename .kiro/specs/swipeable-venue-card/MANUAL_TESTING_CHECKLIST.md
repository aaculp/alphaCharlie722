# Manual Testing Checklist: Swipeable Venue Card

## Overview
This document provides a comprehensive checklist for manually testing the Swipeable Venue Card feature on physical devices. Complete each section and mark items as tested.

**Testing Date**: _____________  
**Tester Name**: _____________  
**App Version**: _____________

---

## 16.1 iOS Device Testing

### Device Information
- **Device Model**: _____________
- **iOS Version**: _____________
- **Test Date**: _____________

### Swipe Gesture Feel
- [ ] **Left swipe feels natural and responsive**
  - Drag a venue card left slowly
  - Drag a venue card left quickly
  - Card follows finger smoothly without lag
  - Green background appears progressively
  - "Arriving" label and check icon appear at correct thresholds

- [ ] **Right swipe feels natural and responsive**
  - Drag a venue card right slowly
  - Drag a venue card right quickly
  - Card follows finger smoothly without lag
  - Red background appears progressively
  - "Leaving" label and logout icon appear at correct thresholds

- [ ] **Snap-back animation feels smooth**
  - Release card before threshold (< 120px)
  - Card springs back to center naturally
  - No jarring or abrupt movements
  - Spring animation feels bouncy but controlled

- [ ] **Action completion animation feels smooth**
  - Swipe past threshold to trigger action
  - Card animates off-screen smoothly
  - Card resets and returns to center
  - No visual glitches or stuttering

### Haptic Feedback
- [ ] **Success haptic triggers on check-in**
  - Swipe left past threshold
  - Feel medium impact vibration
  - Haptic feels appropriate for success action

- [ ] **Success haptic triggers on check-out**
  - Swipe right past threshold
  - Feel medium impact vibration
  - Haptic feels appropriate for success action

- [ ] **Error haptic triggers on failure**
  - Trigger a check-in error (e.g., no network)
  - Feel error notification vibration
  - Haptic feels distinct from success

- [ ] **Warning haptic on invalid swipe**
  - Try swiping right when not checked in
  - Feel light impact vibration
  - Haptic provides subtle feedback

### VoiceOver Testing
- [ ] **Enable VoiceOver** (Settings > Accessibility > VoiceOver)

- [ ] **Card announces correctly**
  - Focus on venue card
  - Hear: "Test Venue, button, swipe left to check in, swipe right to check out"
  - Announcement is clear and informative

- [ ] **Swipe actions are announced**
  - Perform check-in swipe
  - Hear: "Checked in to [Venue Name]"
  - Announcement confirms action

- [ ] **Button interaction still works**
  - Double-tap check-in button with VoiceOver
  - Action completes successfully
  - Announcement confirms action

- [ ] **Error messages are announced**
  - Trigger an error (e.g., network failure)
  - Hear error message announced
  - Message is clear and actionable

- [ ] **Navigation remains accessible**
  - Swipe through screen with VoiceOver
  - All elements are reachable
  - Focus order is logical

### Animation Smoothness
- [ ] **60fps during swipe gestures**
  - Enable "Show Frame Rate" in Xcode
  - Perform multiple swipes
  - Frame rate stays at or near 60fps
  - No dropped frames during gesture

- [ ] **Smooth during scroll + swipe**
  - Scroll venue list
  - Swipe a card while scrolling
  - No stuttering or lag
  - Gestures don't conflict

- [ ] **Smooth on older devices**
  - Test on iPhone 8 or older if available
  - Animations remain smooth
  - No performance degradation

### Edge Cases
- [ ] **Rapid swipes in succession**
  - Swipe left, then immediately right
  - Swipe multiple cards quickly
  - No crashes or visual glitches
  - Each action completes correctly

- [ ] **Swipe during network request**
  - Start a check-in swipe
  - Immediately swipe another card
  - First action completes or cancels gracefully
  - No race conditions

- [ ] **Diagonal swipe**
  - Swipe diagonally (45-degree angle)
  - System detects dominant direction
  - Either swipe or scroll activates, not both

---

## 16.2 Android Device Testing

### Device Information
- **Device Model**: _____________
- **Android Version**: _____________
- **Test Date**: _____________

### Swipe Gesture Feel
- [ ] **Left swipe feels natural and responsive**
  - Drag a venue card left slowly
  - Drag a venue card left quickly
  - Card follows finger smoothly without lag
  - Green background appears progressively

- [ ] **Right swipe feels natural and responsive**
  - Drag a venue card right slowly
  - Drag a venue card right quickly
  - Card follows finger smoothly without lag
  - Red background appears progressively

- [ ] **Snap-back animation feels smooth**
  - Release card before threshold
  - Card springs back to center naturally
  - Animation matches iOS feel

- [ ] **Action completion animation feels smooth**
  - Swipe past threshold to trigger action
  - Card animates off-screen smoothly
  - No visual glitches

### Haptic Feedback
- [ ] **Success haptic triggers on check-in**
  - Swipe left past threshold
  - Feel vibration (may vary by device)
  - Haptic provides feedback

- [ ] **Success haptic triggers on check-out**
  - Swipe right past threshold
  - Feel vibration
  - Haptic provides feedback

- [ ] **Error haptic triggers on failure**
  - Trigger a check-in error
  - Feel error vibration
  - Haptic feels distinct from success

- [ ] **Haptic works on various manufacturers**
  - Test on Samsung device
  - Test on Google Pixel device
  - Test on other Android device
  - Haptic feedback works consistently

### TalkBack Testing
- [ ] **Enable TalkBack** (Settings > Accessibility > TalkBack)

- [ ] **Card announces correctly**
  - Focus on venue card
  - Hear accessibility label
  - Announcement is clear

- [ ] **Swipe actions are announced**
  - Perform check-in swipe
  - Hear action confirmation
  - Announcement is clear

- [ ] **Button interaction still works**
  - Double-tap check-in button with TalkBack
  - Action completes successfully
  - Announcement confirms action

- [ ] **Error messages are announced**
  - Trigger an error
  - Hear error message
  - Message is clear

- [ ] **Navigation remains accessible**
  - Swipe through screen with TalkBack
  - All elements are reachable
  - Focus order is logical

### Animation Smoothness
- [ ] **60fps during swipe gestures**
  - Enable "Profile GPU Rendering" in Developer Options
  - Perform multiple swipes
  - Frame rate stays at or near 60fps
  - Green bars stay below 16ms line

- [ ] **Smooth during scroll + swipe**
  - Scroll venue list
  - Swipe a card while scrolling
  - No stuttering or lag

- [ ] **Smooth on various screen sizes**
  - Test on phone (< 6 inches)
  - Test on large phone (> 6 inches)
  - Test on tablet if available
  - Animations scale appropriately

### Low-End Device Testing
- [ ] **Test on low-end Android device**
  - Device with < 2GB RAM if available
  - Older Android version (8.0 or 9.0)
  - Swipe gestures still work
  - Animations may be slightly slower but functional
  - No crashes or freezes

- [ ] **Performance under load**
  - Open multiple apps in background
  - Return to app and test swipes
  - Gestures still responsive
  - No memory issues

### Edge Cases
- [ ] **Rapid swipes in succession**
  - Swipe left, then immediately right
  - Swipe multiple cards quickly
  - No crashes or visual glitches

- [ ] **Swipe during network request**
  - Start a check-in swipe
  - Immediately swipe another card
  - First action completes or cancels gracefully

- [ ] **Diagonal swipe**
  - Swipe diagonally
  - System detects dominant direction
  - Either swipe or scroll activates

---

## 16.3 Edge Case Testing

### Rapid Swipes in Succession
- [ ] **Swipe same card multiple times**
  - Swipe left to check in
  - Immediately swipe right to check out
  - Immediately swipe left again
  - Each action completes correctly
  - No state corruption

- [ ] **Swipe different cards rapidly**
  - Swipe card 1 left
  - Immediately swipe card 2 left
  - Immediately swipe card 3 left
  - All actions queue or cancel appropriately
  - No crashes

- [ ] **Swipe during animation**
  - Start a swipe gesture
  - While card is animating back, start another swipe
  - Gesture system handles gracefully
  - No visual glitches

### Swipe During Network Request
- [ ] **Swipe while previous request pending**
  - Swipe to check in (slow network)
  - Immediately swipe another card
  - First request completes or cancels
  - Second request proceeds correctly
  - No race conditions

- [ ] **Cancel swipe during network request**
  - Swipe past threshold to trigger action
  - While request is pending, swipe back
  - Request completes but UI doesn't update incorrectly
  - State remains consistent

### Slow Network (3G Throttling)
- [ ] **Enable network throttling**
  - iOS: Xcode > Debug > Network Link Conditioner > 3G
  - Android: Developer Options > Networking > Mobile data always active

- [ ] **Check-in with slow network**
  - Swipe left to check in
  - Wait for request to complete (may take 3-5 seconds)
  - Loading state is shown
  - Success feedback appears when complete
  - No timeout errors

- [ ] **Check-out with slow network**
  - Swipe right to check out
  - Wait for request to complete
  - Loading state is shown
  - Success feedback appears when complete

- [ ] **Multiple swipes with slow network**
  - Swipe multiple cards with 3G throttling
  - Each request queues appropriately
  - No UI freezing
  - All actions eventually complete

### No Network Connection
- [ ] **Enable Airplane Mode**

- [ ] **Attempt check-in with no network**
  - Swipe left to check in
  - Error message appears: "No connection. Please try again."
  - Card snaps back to center
  - Error haptic feedback triggers
  - Visual state doesn't change

- [ ] **Attempt check-out with no network**
  - Swipe right to check out
  - Error message appears
  - Card snaps back to center
  - Error haptic feedback triggers

- [ ] **Retry after network restored**
  - Disable Airplane Mode
  - Swipe to check in again
  - Action completes successfully
  - Success feedback appears

### Switching Between Venues Quickly
- [ ] **Check in to venue A**
  - Swipe left on venue A
  - Check-in completes successfully

- [ ] **Immediately check in to venue B**
  - Swipe left on venue B
  - System shows confirmation: "Check out from Venue A first?"
  - Confirm check-out
  - Check-in to venue B completes

- [ ] **Cancel venue switch**
  - While checked in to venue A
  - Swipe left on venue B
  - System shows confirmation
  - Cancel action
  - Remain checked in to venue A

- [ ] **Rapid venue switching**
  - Check in to venue A
  - Check out from venue A
  - Check in to venue B
  - Check out from venue B
  - Check in to venue C
  - All actions complete correctly
  - State remains consistent

---

## Additional Test Scenarios

### Visual Feedback
- [ ] **Icon visibility thresholds**
  - Swipe to 50% of threshold (60px)
  - Icon should appear
  - Swipe to 75% of threshold (90px)
  - Label should appear

- [ ] **Opacity interpolation**
  - Swipe slowly from 0 to threshold
  - Background opacity increases smoothly
  - No sudden jumps or flickers

- [ ] **Color accuracy**
  - Green background for check-in is correct shade
  - Red background for check-out is correct shade
  - Colors match design specifications

### State Management
- [ ] **Check-in state persists**
  - Check in to a venue
  - Navigate away from screen
  - Return to screen
  - Check-in state is preserved

- [ ] **Check-in count updates**
  - Note current check-in count
  - Swipe to check in
  - Count increases by 1
  - Count is accurate

- [ ] **Recent check-ins updates**
  - Swipe to check out
  - Check "Recent Check-Ins" section
  - New check-out appears in history
  - History is accurate

### Accessibility
- [ ] **Touch target sizes**
  - Check-in button is at least 44x44 points
  - Card has sufficient height for touch
  - All interactive elements are easily tappable

- [ ] **Color contrast**
  - Green background has sufficient contrast with white text
  - Red background has sufficient contrast with white text
  - Icons are clearly visible

- [ ] **Reduced motion**
  - Enable "Reduce Motion" in accessibility settings
  - Swipe gestures still work
  - Animations are simplified or disabled
  - Functionality is preserved

---

## Bug Tracking

### Bugs Found

#### Bug #1
- **Description**: _____________
- **Steps to Reproduce**: _____________
- **Expected Behavior**: _____________
- **Actual Behavior**: _____________
- **Severity**: [ ] Critical [ ] High [ ] Medium [ ] Low
- **Device**: _____________
- **OS Version**: _____________
- **Status**: [ ] Open [ ] In Progress [ ] Fixed [ ] Closed

#### Bug #2
- **Description**: _____________
- **Steps to Reproduce**: _____________
- **Expected Behavior**: _____________
- **Actual Behavior**: _____________
- **Severity**: [ ] Critical [ ] High [ ] Medium [ ] Low
- **Device**: _____________
- **OS Version**: _____________
- **Status**: [ ] Open [ ] In Progress [ ] Fixed [ ] Closed

#### Bug #3
- **Description**: _____________
- **Steps to Reproduce**: _____________
- **Expected Behavior**: _____________
- **Actual Behavior**: _____________
- **Severity**: [ ] Critical [ ] High [ ] Medium [ ] Low
- **Device**: _____________
- **OS Version**: _____________
- **Status**: [ ] Open [ ] In Progress [ ] Fixed [ ] Closed

---

## Test Summary

### Overall Results
- **Total Tests**: _____________
- **Passed**: _____________
- **Failed**: _____________
- **Blocked**: _____________
- **Pass Rate**: _____________%

### Platform-Specific Results
- **iOS Pass Rate**: _____________%
- **Android Pass Rate**: _____________%

### Critical Issues
- [ ] No critical issues found
- [ ] Critical issues found (list below):
  1. _____________
  2. _____________
  3. _____________

### Recommendations
- _____________
- _____________
- _____________

### Sign-Off
- **Tester**: _____________ **Date**: _____________
- **Reviewer**: _____________ **Date**: _____________
- **Approved for Release**: [ ] Yes [ ] No

---

## Notes

Use this section for any additional observations, comments, or feedback:

_____________________________________________________________________________
_____________________________________________________________________________
_____________________________________________________________________________
_____________________________________________________________________________
_____________________________________________________________________________
