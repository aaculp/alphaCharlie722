/**
 * Tests for ReviewService.reportReview()
 * 
 * Requirements:
 * - 10.4: Create moderation ticket
 * - 10.6: Prevent duplicate reports
 */

import { ReviewService } from '../reviews';
import { supabase } from '../../../lib/supabase';

// Mock Supabase
jest.mock('../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('ReviewService.reportReview', () => {
  const mockReviewId = 'review-123';
  const mockUserId = 'user-456';
  const mockReason = 'spam';
  const mockDetails = 'This review is spam';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully report a review', async () => {
    // Mock successful insert
    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockReturnValue({
      insert: mockInsert,
    });

    await ReviewService.reportReview({
      reviewId: mockReviewId,
      userId: mockUserId,
      reason: mockReason,
      details: mockDetails,
    });

    // Verify insert was called with correct data
    expect(supabase.from).toHaveBeenCalledWith('review_reports');
    expect(mockInsert).toHaveBeenCalledWith({
      review_id: mockReviewId,
      reporter_user_id: mockUserId,
      reason: mockReason,
      details: mockDetails,
    });
  });

  it('should prevent duplicate reports', async () => {
    // Mock duplicate constraint violation
    const mockInsert = jest.fn().mockResolvedValue({
      error: { code: '23505', message: 'duplicate key value violates unique constraint' },
    });
    (supabase.from as jest.Mock).mockReturnValue({
      insert: mockInsert,
    });

    await expect(
      ReviewService.reportReview({
        reviewId: mockReviewId,
        userId: mockUserId,
        reason: mockReason,
      })
    ).rejects.toThrow('You have already reported this review');
  });

  it('should handle database errors', async () => {
    // Mock database error
    const mockInsert = jest.fn().mockResolvedValue({
      error: { code: 'PGRST000', message: 'Database connection failed' },
    });
    (supabase.from as jest.Mock).mockReturnValue({
      insert: mockInsert,
    });

    await expect(
      ReviewService.reportReview({
        reviewId: mockReviewId,
        userId: mockUserId,
        reason: 'offensive',
      })
    ).rejects.toThrow('Failed to report review');
  });

  it('should accept all valid report reasons', async () => {
    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockReturnValue({
      insert: mockInsert,
    });

    const validReasons: Array<'spam' | 'offensive' | 'fake' | 'other'> = [
      'spam',
      'offensive',
      'fake',
      'other',
    ];

    for (const reason of validReasons) {
      await ReviewService.reportReview({
        reviewId: mockReviewId,
        userId: mockUserId,
        reason,
      });
    }

    expect(mockInsert).toHaveBeenCalledTimes(4);
  });

  it('should allow reporting without details', async () => {
    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockReturnValue({
      insert: mockInsert,
    });

    await ReviewService.reportReview({
      reviewId: mockReviewId,
      userId: mockUserId,
      reason: 'spam',
      // No details provided
    });

    expect(mockInsert).toHaveBeenCalledWith({
      review_id: mockReviewId,
      reporter_user_id: mockUserId,
      reason: 'spam',
      details: undefined,
    });
  });
});
