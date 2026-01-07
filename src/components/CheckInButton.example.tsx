// Example usage of the reusable CheckInButton component

import React from 'react';
import { View } from 'react-native';
import CheckInButton from './CheckInButton';

// Example 1: Basic usage in a venue list (like HomeScreen)
const VenueListExample = () => {
  const handleCheckInChange = (isCheckedIn: boolean, newCount: number) => {
    console.log(`Check-in status changed: ${isCheckedIn}, new count: ${newCount}`);
  };

  return (
    <View>
      <CheckInButton
        venueId="venue-123"
        venueName="Cool Coffee Shop"
        venueImage="https://example.com/image.jpg"
        isCheckedIn={false}
        activeCheckIns={5}
        onCheckInChange={handleCheckInChange}
        size="small"
        showModalForCheckout={false} // Quick checkout without modal
      />
    </View>
  );
};

// Example 2: Detailed usage in venue detail page
const VenueDetailExample = () => {
  const handleCheckInChange = (isCheckedIn: boolean, newCount: number) => {
    // Update local state, refresh data, etc.
  };

  return (
    <View>
      <CheckInButton
        venueId="venue-456"
        venueName="Awesome Restaurant"
        venueImage="https://example.com/restaurant.jpg"
        isCheckedIn={true}
        checkInId="checkin-789"
        checkInTime="2024-01-07T10:30:00Z"
        activeCheckIns={12}
        onCheckInChange={handleCheckInChange}
        size="large"
        showModalForCheckout={true} // Show confirmation modal for checkout
      />
    </View>
  );
};

// Example 3: Minimal usage without image
const MinimalExample = () => {
  return (
    <CheckInButton
      venueId="venue-789"
      venueName="Quick Bite"
      isCheckedIn={false}
      activeCheckIns={2}
      onCheckInChange={() => {}}
      size="medium"
    />
  );
};

export { VenueListExample, VenueDetailExample, MinimalExample };