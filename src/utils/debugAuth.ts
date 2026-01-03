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
    
    // Look for theme keys
    const themeKeys = keys.filter(key => 
      key.includes('theme') || 
      key.includes('OTW_theme')
    );
    
    console.log('🔑 Supabase-related keys:', supabaseKeys);
    console.log('🎨 Theme-related keys:', themeKeys);
    
    // Get values for Supabase keys
    for (const key of supabaseKeys) {
      try {
        const value = await AsyncStorage.getItem(key);
        console.log(`📄 ${key}:`, value ? JSON.parse(value) : 'null');
      } catch (error) {
        console.log(`❌ Error reading ${key}:`, error);
      }
    }
    
    // Get values for theme keys
    for (const key of themeKeys) {
      try {
        const value = await AsyncStorage.getItem(key);
        console.log(`🎨 ${key}:`, value || 'null');
      } catch (error) {
        console.log(`❌ Error reading ${key}:`, error);
      }
    }
    
    return { keys, supabaseKeys, themeKeys };
  } catch (error) {
    console.error('❌ Error debugging AsyncStorage:', error);
    return { keys: [], supabaseKeys: [], themeKeys: [] };
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

export const clearThemeStorage = async () => {
  try {
    console.log('🧹 Clearing theme storage...');
    const keys = await AsyncStorage.getAllKeys();
    const themeKeys = keys.filter(key => 
      key.includes('theme') || 
      key.includes('OTW_theme')
    );
    
    await AsyncStorage.multiRemove(themeKeys);
    console.log('✅ Cleared theme keys:', themeKeys);
  } catch (error) {
    console.error('❌ Error clearing theme storage:', error);
  }
};