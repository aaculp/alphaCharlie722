// Root tab navigation types
export type RootTabParamList = {
  Home: undefined;
  Search: undefined;
  Profile: undefined;
  Settings: undefined;
};

// Settings stack navigation types
export type SettingsStackParamList = {
  SettingsList: undefined;
  Favorites: undefined;
  Profile: undefined;
};

// Home stack navigation types
export type HomeStackParamList = {
  HomeList: undefined;
  VenueDetail: { venueId: string; venueName: string };
};

// Search stack navigation types
export type SearchStackParamList = {
  SearchList: undefined;
  VenueDetail: { venueId: string; venueName: string };
};
