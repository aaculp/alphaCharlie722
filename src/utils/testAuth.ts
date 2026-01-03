import { supabase } from '../lib/supabase';

export class TestAuth {
  // Simple signup without profile creation
  static async simpleSignUp(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('❌ Simple signup failed:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Simple signup successful:', data.user?.id);
      return { success: true, user: data.user };
    } catch (error) {
      console.error('❌ Simple signup error:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  // Test if we can create a profile manually
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
        console.error('❌ Manual profile creation failed:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Manual profile creation successful:', data);
      return { success: true, profile: data };
    } catch (error) {
      console.error('❌ Manual profile creation error:', error);
      return { success: false, error: (error as Error).message };
    }
  }
}