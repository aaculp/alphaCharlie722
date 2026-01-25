/**
 * Query Refresh Control Component
 * 
 * Provides pull-to-refresh functionality for React Query queries.
 * Wraps ScrollView or FlatList with RefreshControl.
 */

import React from 'react';
import { RefreshControl } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface QueryRefreshControlProps {
  isRefetching: boolean;
  onRefresh: () => void;
}

/**
 * QueryRefreshControl Component
 * 
 * Creates a RefreshControl component configured for React Query
 * 
 * @param isRefetching - Whether the query is currently refetching
 * @param onRefresh - Callback function to trigger refetch
 * 
 * @example
 * ```tsx
 * const { data, isRefetching, refetch } = useVenuesQuery();
 * 
 * <ScrollView
 *   refreshControl={
 *     <QueryRefreshControl
 *       isRefetching={isRefetching}
 *       onRefresh={refetch}
 *     />
 *   }
 * >
 *   {data.map(item => <Item key={item.id} {...item} />)}
 * </ScrollView>
 * ```
 */
export const QueryRefreshControl: React.FC<QueryRefreshControlProps> = ({
  isRefetching,
  onRefresh,
}) => {
  const { theme } = useTheme();

  return (
    <RefreshControl
      refreshing={isRefetching}
      onRefresh={onRefresh}
      tintColor={theme.colors.primary}
      colors={[theme.colors.primary]}
      progressBackgroundColor={theme.colors.surface}
    />
  );
};
