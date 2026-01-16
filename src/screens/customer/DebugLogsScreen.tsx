/**
 * DebugLogsScreen
 * 
 * Screen for viewing and managing debug logs.
 * Allows filtering, exporting, and clearing logs.
 * 
 * Requirements: 13.8
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Share,
} from 'react-native';
import { DebugLogger, LogLevel, LogEntry } from '../../services/DebugLogger';

export const DebugLogsScreen: React.FC = () => {
  const [isDebugMode, setIsDebugMode] = useState<boolean>(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filterLevel, setFilterLevel] = useState<LogLevel | 'ALL'>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  useEffect(() => {
    loadDebugMode();
    loadLogs();
  }, []);

  const loadDebugMode = async () => {
    const enabled = DebugLogger.isEnabled();
    setIsDebugMode(enabled);
  };

  const loadLogs = () => {
    const allLogs = DebugLogger.getLogs();
    setLogs(allLogs);
  };

  const toggleDebugMode = async () => {
    if (isDebugMode) {
      await DebugLogger.disableDebugMode();
      setIsDebugMode(false);
      Alert.alert('Debug Mode', 'Debug mode disabled');
    } else {
      await DebugLogger.enableDebugMode();
      setIsDebugMode(true);
      Alert.alert('Debug Mode', 'Debug mode enabled. All push notification events will be logged.');
    }
  };

  const clearLogs = () => {
    Alert.alert(
      'Clear Logs',
      'Are you sure you want to clear all debug logs?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            DebugLogger.clearLogs();
            setLogs([]);
            Alert.alert('Success', 'Debug logs cleared');
          },
        },
      ]
    );
  };

  const exportLogs = async () => {
    try {
      const logsJson = DebugLogger.exportLogs();
      
      await Share.share({
        message: logsJson,
        title: 'Push Notification Debug Logs',
      });
    } catch (error) {
      console.error('Error exporting logs:', error);
      Alert.alert('Error', 'Failed to export logs');
    }
  };

  const getFilteredLogs = (): LogEntry[] => {
    let filtered = logs;

    if (filterLevel !== 'ALL') {
      filtered = filtered.filter(log => log.level === filterLevel);
    }

    if (filterCategory !== 'ALL') {
      filtered = filtered.filter(log => log.category === filterCategory);
    }

    return filtered;
  };

  const getUniqueCategories = (): string[] => {
    const categories = new Set(logs.map(log => log.category));
    return ['ALL', ...Array.from(categories)];
  };

  const getLevelColor = (level: LogLevel): string => {
    switch (level) {
      case LogLevel.DEBUG:
        return '#9E9E9E';
      case LogLevel.INFO:
        return '#2196F3';
      case LogLevel.WARN:
        return '#FF9800';
      case LogLevel.ERROR:
        return '#F44336';
      default:
        return '#000';
    }
  };

  const getLevelEmoji = (level: LogLevel): string => {
    switch (level) {
      case LogLevel.DEBUG:
        return '🐛';
      case LogLevel.INFO:
        return 'ℹ️';
      case LogLevel.WARN:
        return '⚠️';
      case LogLevel.ERROR:
        return '❌';
      default:
        return '📝';
    }
  };

  const filteredLogs = getFilteredLogs();
  const categories = getUniqueCategories();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Debug Logs</Text>
        <Text style={styles.subtitle}>Push notification event logs</Text>
      </View>

      {/* Debug Mode Toggle */}
      <View style={styles.section}>
        <View style={styles.toggleRow}>
          <View>
            <Text style={styles.toggleLabel}>Debug Mode</Text>
            <Text style={styles.toggleDescription}>
              Enable verbose logging for all push notification events
            </Text>
          </View>
          <Switch
            value={isDebugMode}
            onValueChange={toggleDebugMode}
            trackColor={{ false: '#ccc', true: '#007AFF' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Filters */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Filters</Text>
        
        {/* Level Filter */}
        <Text style={styles.filterLabel}>Log Level:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {(['ALL', LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR] as const).map(level => (
            <TouchableOpacity
              key={level}
              style={[
                styles.filterButton,
                filterLevel === level && styles.filterButtonActive,
              ]}
              onPress={() => setFilterLevel(level)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filterLevel === level && styles.filterButtonTextActive,
                ]}
              >
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Category Filter */}
        <Text style={styles.filterLabel}>Category:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {categories.map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.filterButton,
                filterCategory === category && styles.filterButtonActive,
              ]}
              onPress={() => setFilterCategory(category)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filterCategory === category && styles.filterButtonTextActive,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={loadLogs}>
          <Text style={styles.actionButtonText}>🔄 Refresh</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={exportLogs}>
          <Text style={styles.actionButtonText}>📤 Export</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.actionButtonDanger]} onPress={clearLogs}>
          <Text style={[styles.actionButtonText, styles.actionButtonTextDanger]}>🗑️ Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Logs */}
      <View style={styles.logsContainer}>
        <Text style={styles.logsHeader}>
          Logs ({filteredLogs.length} of {logs.length})
        </Text>
        <ScrollView style={styles.logsList}>
          {filteredLogs.length === 0 ? (
            <Text style={styles.noLogsText}>
              {logs.length === 0
                ? 'No logs yet. Enable debug mode and trigger some push notification events.'
                : 'No logs match the current filters.'}
            </Text>
          ) : (
            filteredLogs.map((log, index) => (
              <View key={`${log.timestamp}-${index}`} style={styles.logEntry}>
                <View style={styles.logHeader}>
                  <Text style={styles.logEmoji}>{getLevelEmoji(log.level)}</Text>
                  <Text style={[styles.logLevel, { color: getLevelColor(log.level) }]}>
                    {log.level}
                  </Text>
                  <Text style={styles.logCategory}>{log.category}</Text>
                  <Text style={styles.logTime}>
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </Text>
                </View>
                <Text style={styles.logMessage}>{log.message}</Text>
                {log.data && (
                  <Text style={styles.logData}>
                    {JSON.stringify(log.data, null, 2)}
                  </Text>
                )}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  section: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 12,
    color: '#666',
    maxWidth: 250,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 8,
    color: '#666',
  },
  filterScroll: {
    marginBottom: 10,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  actionButtonDanger: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtonTextDanger: {
    color: '#fff',
  },
  logsContainer: {
    flex: 1,
    margin: 15,
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logsHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    color: '#333',
  },
  logsList: {
    flex: 1,
  },
  noLogsText: {
    padding: 20,
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
  },
  logEntry: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  logEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  logLevel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 8,
  },
  logCategory: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginRight: 8,
  },
  logTime: {
    fontSize: 11,
    color: '#999',
    marginLeft: 'auto',
  },
  logMessage: {
    fontSize: 13,
    color: '#333',
    marginBottom: 4,
  },
  logData: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'monospace',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 4,
    marginTop: 4,
  },
});
