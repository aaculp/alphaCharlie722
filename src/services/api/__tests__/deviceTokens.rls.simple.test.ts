/**
 * Simplified RLS Tests for Device Tokens
 * Tests RLS policies with real authenticated users
 * 
 * To run: Use test-rls-local.ps1 script
 */

jest.unmock('../../../lib/supabase');

import { createClient } from '@supabase/supabase-js';

const isRealSupabase = process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('mock');
const describeRLS = isRealSupabase ? describe : describe.skip;

describeRLS('Device Tokens RLS - Simple Tests', () => {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  // Admin client (bypasses RLS)
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Test users
  let user1: any;
  let user2: any;
  let user1Client: any;
  let user2Client: any;

  beforeAll(async () => {
    // Create test user 1
    const email1 = `test-user-1-${Date.now()}@test.com`;
    const password = 'TestPassword123!';
    
    const { data: authData1, error: authError1 } = await admin.auth.admin.createUser({
      email: email1,
      password: password,
      email_confirm: true,
    });

    if (authError1) {
      console.error('Failed to create user 1:', authError1);
      throw authError1;
    }

    user1 = authData1.user;

    // Create test user 2
    const email2 = `test-user-2-${Date.now()}@test.com`;
    
    const { data: authData2, error: authError2 } = await admin.auth.admin.createUser({
      email: email2,
      password: password,
      email_confirm: true,
    });

    if (authError2) {
      console.error('Failed to create user 2:', authError2);
      throw authError2;
    }

    user2 = authData2.user;

    // Create authenticated clients for each user
    user1Client = createClient(supabaseUrl, supabaseAnonKey);
    await user1Client.auth.signInWithPassword({ email: email1, password });

    user2Client = createClient(supabaseUrl, supabaseAnonKey);
    await user2Client.auth.signInWithPassword({ email: email2, password });
  });

  afterAll(async () => {
    // Cleanup: Delete test users
    if (user1) {
      await admin.auth.admin.deleteUser(user1.id);
    }
    if (user2) {
      await admin.auth.admin.deleteUser(user2.id);
    }
  });

  describe('Property 15: Client Token Access Restriction', () => {
    it('should prevent user1 from reading user2 tokens', async () => {
      const token = `test-token-${Date.now()}`;

      // User 2 inserts their own token
      const { error: insertError } = await user2Client
        .from('device_tokens')
        .insert({
          user_id: user2.id,
          token: token,
          platform: 'ios',
          is_active: true,
        });

      expect(insertError).toBeNull();

      // User 1 tries to read user 2's tokens
      const { data, error } = await user1Client
        .from('device_tokens')
        .select('*')
        .eq('user_id', user2.id);

      // Should return empty (RLS blocks access)
      expect(data).toEqual([]);

      // Cleanup
      await admin
        .from('device_tokens')
        .delete()
        .eq('token', token);
    });

    it('should prevent reading all tokens without filter', async () => {
      // Try to read all tokens (should only see own tokens or none)
      const { data } = await user1Client
        .from('device_tokens')
        .select('*');

      // Should only see user1's tokens (if any)
      const hasOtherUserTokens = data?.some((t: any) => t.user_id !== user1.id);
      expect(hasOtherUserTokens).toBe(false);
    });
  });

  describe('Property 16: User Own Token Access', () => {
    it('should allow users to insert their own tokens', async () => {
      const token = `test-token-insert-${Date.now()}`;

      const { data, error } = await user1Client
        .from('device_tokens')
        .insert({
          user_id: user1.id,
          token: token,
          platform: 'android',
          is_active: true,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.user_id).toBe(user1.id);
      expect(data.token).toBe(token);

      // Cleanup
      await admin
        .from('device_tokens')
        .delete()
        .eq('token', token);
    });

    it('should allow users to read their own tokens', async () => {
      const token = `test-token-read-${Date.now()}`;

      // Insert token as user1
      await user1Client
        .from('device_tokens')
        .insert({
          user_id: user1.id,
          token: token,
          platform: 'ios',
          is_active: true,
        });

      // Read own tokens
      const { data, error } = await user1Client
        .from('device_tokens')
        .select('*')
        .eq('user_id', user1.id);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      
      const foundToken = data?.find((t: any) => t.token === token);
      expect(foundToken).toBeDefined();
      expect(foundToken.user_id).toBe(user1.id);

      // Cleanup
      await admin
        .from('device_tokens')
        .delete()
        .eq('token', token);
    });

    it('should allow users to update their own tokens', async () => {
      const token = `test-token-update-${Date.now()}`;

      // Insert token
      await user1Client
        .from('device_tokens')
        .insert({
          user_id: user1.id,
          token: token,
          platform: 'ios',
          is_active: true,
        });

      // Update token
      const { data, error } = await user1Client
        .from('device_tokens')
        .update({ is_active: false })
        .eq('token', token)
        .eq('user_id', user1.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.is_active).toBe(false);

      // Cleanup
      await admin
        .from('device_tokens')
        .delete()
        .eq('token', token);
    });

    it('should allow users to delete their own tokens', async () => {
      const token = `test-token-delete-${Date.now()}`;

      // Insert token
      await user1Client
        .from('device_tokens')
        .insert({
          user_id: user1.id,
          token: token,
          platform: 'android',
          is_active: true,
        });

      // Delete token
      const { error } = await user1Client
        .from('device_tokens')
        .delete()
        .eq('token', token)
        .eq('user_id', user1.id);

      expect(error).toBeNull();

      // Verify deletion
      const { data } = await admin
        .from('device_tokens')
        .select('*')
        .eq('token', token);

      expect(data).toEqual([]);
    });

    it('should prevent users from inserting tokens for other users', async () => {
      const token = `test-token-forbidden-${Date.now()}`;

      // User 1 tries to insert a token for user 2
      const { error } = await user1Client
        .from('device_tokens')
        .insert({
          user_id: user2.id, // Different user!
          token: token,
          platform: 'ios',
          is_active: true,
        });

      // Should fail due to RLS WITH CHECK clause
      expect(error).toBeDefined();
      expect(error?.message).toContain('new row violates row-level security policy');

      // Verify token was not inserted
      const { data } = await admin
        .from('device_tokens')
        .select('*')
        .eq('token', token);

      expect(data).toEqual([]);
    });
  });
});
