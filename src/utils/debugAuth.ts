import AsyncStorage from '@react-native-async-storage/async-storage';

export const debugAuthStorage = async () => {
  try {
    console.log('🔍 Debugging AsyncStorage...');
    
    // Get all keys
    const keys = await AsyncStorage.getAllKeys();
    console.log('📋 All AsyncStorage keys:', keys);
    
    // Look for Supabase-related keys
    const supabaseKeys = keys.filter(key => 
      key.includes('supabase') || 
      key.includes('auth') || 
      key.includes('session') ||
      key.includes('sb-')
    );
    
    console.log('🔑 Supabase-related keys:', supabaseKeys);
    
    // Get values for Supabase keys
    for (const key of supabaseKeys) {
      try {
        const value = await AsyncStorage.getItem(key);
        console.log(`📄 ${key}:`, value ? JSON.parse(value) : 'null');
      } catch (error) {
        console.log(`❌ Error reading ${key}:`, error);
      }
    }
    
    return { keys, supabaseKeys };
  } catch (error) {
    console.error('❌ Error debugging AsyncStorage:', error);
    return { keys: [], supabaseKeys: [] };
  }
};

export const clearAuthStorage = async () => {
  try {
    console.log('🧹 Clearing auth storage...');
    const keys = await AsyncStorage.getAllKeys();
    const authKeys = keys.filter(key => 
      key.includes('supabase') || 
      key.includes('auth') || 
      key.includes('session') ||
      key.includes('sb-')
    );
    
    await AsyncStorage.multiRemove(authKeys);
    console.log('✅ Cleared auth keys:', authKeys);
  } catch (error) {
    console.error('❌ Error clearing auth storage:', error);
  }
};