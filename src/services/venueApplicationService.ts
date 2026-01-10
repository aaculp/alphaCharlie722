import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';

type VenueApplication = Database['public']['Tables']['venue_applications']['Row'];
type VenueApplicationInsert = Database['public']['Tables']['venue_applications']['Insert'];
type VenueApplicationUpdate = Database['public']['Tables']['venue_applications']['Update'];

export interface VenueApplicationData {
  venueName: string;
  venueType: string;
  address: string;
  city: string;
  state: string;
  zipCode?: string;
  phone?: string;
  website?: string;
  ownerName: string;
  ownerEmail: string;
  description?: string;
}

export class VenueApplicationService {
  /**
   * Check if email is available for venue application
   */
  static async checkEmailAvailability(email: string): Promise<{ 
    available: boolean; 
    reason?: string; 
    error?: string 
  }> {
    try {
      // Check venue applications
      const { data: applications, error: appError } = await supabase
        .from('venue_applications')
        .select('id, status, owner_name')
        .eq('owner_email', email);

      if (appError) {
        console.error('❌ Error checking email in applications:', appError);
        return { available: false, error: 'Failed to validate email' };
      }

      if (applications && applications.length > 0) {
        const app = applications[0];
        if (app.status === 'pending' || app.status === 'under_review') {
          return { 
            available: false, 
            reason: 'Email is already associated with a pending venue application' 
          };
        } else if (app.status === 'approved') {
          return { 
            available: false, 
            reason: 'Email is already associated with an approved venue' 
          };
        }
      }

      // Check business accounts
      const { data: businessAccounts, error: businessError } = await supabase
        .from('venue_business_accounts')
        .select('id')
        .eq('billing_email', email);

      if (businessError) {
        console.error('❌ Error checking email in business accounts:', businessError);
        return { available: false, error: 'Failed to validate email' };
      }

      if (businessAccounts && businessAccounts.length > 0) {
        return { 
          available: false, 
          reason: 'Email is already associated with an existing venue business account' 
        };
      }

      return { available: true };
    } catch (error) {
      console.error('❌ Unexpected error checking email availability:', error);
      return { available: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Submit a new venue application
   */
  static async submitApplication(
    applicationData: VenueApplicationData,
    userId: string
  ): Promise<{ success: boolean; application?: VenueApplication; error?: string }> {
    try {
      console.log('🏢 Submitting venue application:', { 
        venueName: applicationData.venueName,
        ownerEmail: applicationData.ownerEmail,
        userId 
      });

      // Check if user already has a pending application
      const { data: existingApplications, error: checkError } = await supabase
        .from('venue_applications')
        .select('id, status')
        .eq('owner_user_id', userId)
        .in('status', ['pending', 'under_review']);

      if (checkError) {
        console.error('❌ Error checking existing applications:', checkError);
        return { success: false, error: 'Failed to check existing applications' };
      }

      if (existingApplications && existingApplications.length > 0) {
        return { 
          success: false, 
          error: 'You already have a pending venue application. Please wait for review.' 
        };
      }

      // Check if email is already used in any venue application
      const { data: emailApplications, error: emailCheckError } = await supabase
        .from('venue_applications')
        .select('id, status, owner_name')
        .eq('owner_email', applicationData.ownerEmail);

      if (emailCheckError) {
        console.error('❌ Error checking email applications:', emailCheckError);
        return { success: false, error: 'Failed to validate email' };
      }

      if (emailApplications && emailApplications.length > 0) {
        const existingApp = emailApplications[0];
        if (existingApp.status === 'pending' || existingApp.status === 'under_review') {
          return { 
            success: false, 
            error: `This email is already associated with a pending venue application. Please use a different email or contact support.` 
          };
        } else if (existingApp.status === 'approved') {
          return { 
            success: false, 
            error: `This email is already associated with an approved venue. Please use a different email or sign in to manage your existing venue.` 
          };
        }
      }

      // Check if email is already used in existing business accounts
      const { data: businessAccounts, error: businessCheckError } = await supabase
        .from('venue_business_accounts')
        .select('id, billing_email')
        .or(`billing_email.eq.${applicationData.ownerEmail}`);

      if (businessCheckError) {
        console.error('❌ Error checking business accounts:', businessCheckError);
        return { success: false, error: 'Failed to validate email' };
      }

      if (businessAccounts && businessAccounts.length > 0) {
        return { 
          success: false, 
          error: `This email is already associated with an existing venue business account. Please use a different email or sign in to manage your existing venue.` 
        };
      }

      // Create the application
      const applicationInsert: VenueApplicationInsert = {
        venue_name: applicationData.venueName,
        venue_type: applicationData.venueType,
        address: applicationData.address,
        city: applicationData.city,
        state: applicationData.state,
        zip_code: applicationData.zipCode || null,
        phone: applicationData.phone || null,
        website: applicationData.website || null,
        owner_name: applicationData.ownerName,
        owner_email: applicationData.ownerEmail,
        owner_user_id: userId,
        description: applicationData.description || null,
        status: 'pending'
      };

      const { data, error } = await supabase
        .from('venue_applications')
        .insert(applicationInsert)
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating venue application:', error);
        return { success: false, error: 'Failed to submit application' };
      }

      console.log('✅ Venue application submitted successfully:', data.id);
      
      // TODO: Send email notification to admin
      // TODO: Send confirmation email to venue owner
      
      return { success: true, application: data };
    } catch (error) {
      console.error('❌ Unexpected error submitting venue application:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Get user's venue applications
   */
  static async getUserApplications(userId: string): Promise<VenueApplication[]> {
    try {
      const { data, error } = await supabase
        .from('venue_applications')
        .select('*')
        .eq('owner_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching user applications:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Unexpected error fetching user applications:', error);
      return [];
    }
  }

  /**
   * Get application by ID (for the owner)
   */
  static async getApplicationById(
    applicationId: string, 
    userId: string
  ): Promise<VenueApplication | null> {
    try {
      const { data, error } = await supabase
        .from('venue_applications')
        .select('*')
        .eq('id', applicationId)
        .eq('owner_user_id', userId)
        .single();

      if (error) {
        console.error('❌ Error fetching application:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ Unexpected error fetching application:', error);
      return null;
    }
  }

  /**
   * Update application (only if pending)
   */
  static async updateApplication(
    applicationId: string,
    userId: string,
    updates: Partial<VenueApplicationData>
  ): Promise<{ success: boolean; application?: VenueApplication; error?: string }> {
    try {
      // First check if application exists and is pending
      const { data: existing, error: fetchError } = await supabase
        .from('venue_applications')
        .select('id, status')
        .eq('id', applicationId)
        .eq('owner_user_id', userId)
        .single();

      if (fetchError || !existing) {
        return { success: false, error: 'Application not found' };
      }

      if (existing.status !== 'pending') {
        return { success: false, error: 'Can only update pending applications' };
      }

      // Prepare update data
      const updateData: VenueApplicationUpdate = {};
      if (updates.venueName) updateData.venue_name = updates.venueName;
      if (updates.venueType) updateData.venue_type = updates.venueType;
      if (updates.address) updateData.address = updates.address;
      if (updates.city) updateData.city = updates.city;
      if (updates.state) updateData.state = updates.state;
      if (updates.zipCode !== undefined) updateData.zip_code = updates.zipCode || null;
      if (updates.phone !== undefined) updateData.phone = updates.phone || null;
      if (updates.website !== undefined) updateData.website = updates.website || null;
      if (updates.ownerName) updateData.owner_name = updates.ownerName;
      if (updates.ownerEmail) updateData.owner_email = updates.ownerEmail;
      if (updates.description !== undefined) updateData.description = updates.description || null;

      const { data, error } = await supabase
        .from('venue_applications')
        .update(updateData)
        .eq('id', applicationId)
        .eq('owner_user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating application:', error);
        return { success: false, error: 'Failed to update application' };
      }

      return { success: true, application: data };
    } catch (error) {
      console.error('❌ Unexpected error updating application:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Cancel application (only if pending)
   */
  static async cancelApplication(
    applicationId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('venue_applications')
        .delete()
        .eq('id', applicationId)
        .eq('owner_user_id', userId)
        .eq('status', 'pending');

      if (error) {
        console.error('❌ Error canceling application:', error);
        return { success: false, error: 'Failed to cancel application' };
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Unexpected error canceling application:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  // Admin methods (for future admin dashboard)
  
  /**
   * Get all applications (admin only)
   */
  static async getAllApplications(
    status?: 'pending' | 'approved' | 'rejected' | 'under_review'
  ): Promise<VenueApplication[]> {
    try {
      let query = supabase
        .from('venue_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching all applications:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Unexpected error fetching all applications:', error);
      return [];
    }
  }

  /**
   * Update application status (admin only)
   */
  static async updateApplicationStatus(
    applicationId: string,
    status: 'pending' | 'approved' | 'rejected' | 'under_review',
    adminUserId: string,
    adminNotes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('venue_applications')
        .update({
          status,
          reviewed_by: adminUserId,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes || null
        })
        .eq('id', applicationId);

      if (error) {
        console.error('❌ Error updating application status:', error);
        return { success: false, error: 'Failed to update application status' };
      }

      console.log(`✅ Application ${applicationId} status updated to ${status}`);
      
      // TODO: Send email notification to venue owner about status change
      
      return { success: true };
    } catch (error) {
      console.error('❌ Unexpected error updating application status:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }
}