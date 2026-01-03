import { supabase } from '../lib/supabase';

export class SupabaseTest {
  // Test basic connection
  static async testConnection() {
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('count')
        .limit(1);
      
      if (error) {
        console.error('Connection test failed:', error);
        return { success: false, error: error.message };
      }
      
      console.log('✅ Supabase connection successful');
      return { success: true, data };
    } catch (error) {
      console.error('Connection test error:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  // Test table existence
  static async testTables() {
    const tables = ['profiles', 'venues', 'reviews', 'favorites'];
    const results: { [key: string]: boolean } = {};

    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        results[table] = !error;
        if (error) {
          console.error(`❌ Table ${table} error:`, error.message);
        } else {
          console.log(`✅ Table ${table} exists`);
        }
      } catch (error) {
        results[table] = false;
        console.error(`❌ Table ${table} error:`, error);
      }
    }

    return results;
  }

  // Test auth signup without profile creation
  static async testAuthOnly(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('❌ Auth signup failed:', error.message);
        return { success: false, error: error.message };
      }

      console.log('✅ Auth signup successful:', data.user?.id);
      return { success: true, user: data.user };
    } catch (error) {
      console.error('❌ Auth signup error:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  // Test profile creation manually
  static async testProfileCreation(userId: string, email: string, name: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: email,
          name: name,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Profile creation failed:', error.message);
        return { success: false, error: error.message };
      }

      console.log('✅ Profile creation successful:', data);
      return { success: true, profile: data };
    } catch (error) {
      console.error('❌ Profile creation error:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  // Run all tests
  static async runAllTests() {
    console.log('🧪 Starting Supabase diagnostic tests...');
    
    // Test 1: Connection
    const connectionTest = await this.testConnection();
    
    // Test 2: Tables
    const tablesTest = await this.testTables();
    
    // Test 3: Check if we can read venues (should work without auth)
    try {
      const { data: venues, error } = await supabase
        .from('venues')
        .select('*')
        .limit(1);
      
      if (error) {
        console.error('❌ Cannot read venues:', error.message);
      } else {
        console.log('✅ Can read venues:', venues?.length || 0, 'found');
      }
    } catch (error) {
      console.error('❌ Venues read error:', error);
    }

    return {
      connection: connectionTest,
      tables: tablesTest,
    };
  }
}