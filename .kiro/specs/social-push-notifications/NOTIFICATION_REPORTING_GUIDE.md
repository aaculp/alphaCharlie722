# Notification Reporting Guide

## Overview

The notification reporting system allows users to report inappropriate notifications, helping maintain a safe and respectful community. This feature fulfills **Requirement 15.9: Allow users to report inappropriate notifications**.

## Features

### User Reporting

Users can report notifications for the following reasons:

1. **Spam** - Unwanted or repetitive notifications
2. **Harassment** - Threatening or abusive content
3. **Inappropriate** - Offensive or inappropriate content
4. **Misleading** - False or deceptive information
5. **Other** - Other reasons not listed above

### Report Submission

When a user reports a notification:

1. **Verification** - System verifies the user is the recipient of the notification
2. **Report Creation** - Creates a record in the `notification_reports` table
3. **Compliance Tracking** - Logs the report for compliance monitoring
4. **Confirmation** - Shows success message to the user

### Report Data

Each report includes:

- **Notification ID** - ID of the reported notification
- **Reporter ID** - ID of the user filing the report
- **Reported User ID** - ID of the user who sent the notification
- **Notification Type** - Type of notification (friend_request, venue_share, etc.)
- **Reason** - Selected reason for reporting
- **Details** - Optional additional information
- **Notification Content** - Snapshot of the notification at time of report
- **Status** - Current status (pending, reviewing, resolved, dismissed)
- **Timestamps** - Created and updated timestamps

## Database Schema

### notification_reports Table

```sql
CREATE TABLE notification_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_id UUID NOT NULL REFERENCES social_notifications(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL,
  reason VARCHAR(50) NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'misleading', 'other')),
  details TEXT,
  notification_content JSONB NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Indexes

- `idx_notification_reports_notification` - Fast lookup by notification ID
- `idx_notification_reports_reporter` - Fast lookup by reporter ID
- `idx_notification_reports_reported_user` - Fast lookup by reported user ID
- `idx_notification_reports_status` - Fast lookup by status
- `idx_notification_reports_created_at` - Fast lookup by creation date
- `idx_notification_reports_unique` - Prevents duplicate reports (same notification + reporter)

### Row Level Security (RLS)

- **Select** - Users can view their own reports
- **Insert** - Users can create reports for notifications they received
- **Update** - Users can update their own pending reports (add details)

## API Methods

### NotificationService.reportNotification()

Report an inappropriate notification.

```typescript
static async reportNotification(
  notificationId: string,
  reporterId: string,
  reason: 'spam' | 'harassment' | 'inappropriate' | 'misleading' | 'other',
  details?: string
): Promise<{ id: string; status: string }>
```

**Parameters:**
- `notificationId` - ID of the notification being reported
- `reporterId` - ID of the user reporting the notification
- `reason` - Reason for reporting
- `details` - Optional additional details

**Returns:**
- Report ID and status

**Throws:**
- Error if notification not found
- Error if user is not the recipient
- Error if report creation fails

**Example:**

```typescript
try {
  const report = await NotificationService.reportNotification(
    'notification-123',
    'user-456',
    'spam',
    'This user keeps sending me unwanted friend requests'
  );
  
  console.log('Report submitted:', report.id);
} catch (error) {
  console.error('Failed to submit report:', error);
}
```

### NotificationService.getUserReports()

Get reports filed by a user.

```typescript
static async getUserReports(
  userId: string,
  options?: PaginationOptions
): Promise<any[]>
```

**Parameters:**
- `userId` - ID of the user who filed the reports
- `options` - Pagination options (limit, offset)

**Returns:**
- Array of reports with notification and reported user details

**Example:**

```typescript
const reports = await NotificationService.getUserReports('user-123', {
  limit: 20,
  offset: 0,
});

console.log(`User has filed ${reports.length} reports`);
```

### ComplianceService.trackNotificationReport()

Track a notification report for compliance monitoring.

```typescript
static trackNotificationReport(
  reportId: string,
  notificationId: string,
  reporterId: string,
  reportedUserId: string,
  notificationType: NotificationType,
  reason: string,
  details?: string
): void
```

**Parameters:**
- `reportId` - ID of the report
- `notificationId` - ID of the notification being reported
- `reporterId` - ID of the user filing the report
- `reportedUserId` - ID of the user who sent the notification
- `notificationType` - Type of notification
- `reason` - Reason for reporting
- `details` - Optional additional details

**Example:**

```typescript
ComplianceService.trackNotificationReport(
  report.id,
  notification.id,
  user.id,
  notification.actor_id,
  notification.type,
  'spam',
  'Repeated unwanted notifications'
);
```

## UI Components

### NotificationReportModal

Modal component for reporting notifications.

**Props:**
- `visible` - Whether the modal is visible
- `notification` - The notification being reported
- `onClose` - Callback when modal is closed
- `onReportSubmitted` - Optional callback when report is submitted

**Usage:**

```typescript
import { NotificationReportModal } from '../../components/social';

const [reportModalVisible, setReportModalVisible] = useState(false);
const [selectedNotification, setSelectedNotification] = useState<SocialNotification | null>(null);

const handleReportPress = (notification: SocialNotification) => {
  setSelectedNotification(notification);
  setReportModalVisible(true);
};

return (
  <>
    {/* Your notification list */}
    <TouchableOpacity onPress={() => handleReportPress(notification)}>
      <Text>Report</Text>
    </TouchableOpacity>

    {/* Report modal */}
    <NotificationReportModal
      visible={reportModalVisible}
      notification={selectedNotification}
      onClose={() => setReportModalVisible(false)}
      onReportSubmitted={() => {
        console.log('Report submitted');
        // Optionally refresh notifications
      }}
    />
  </>
);
```

## User Flow

### Reporting a Notification

1. **User sees inappropriate notification**
   - Notification appears in notification center or as push notification

2. **User opens report modal**
   - Taps "Report" button on notification
   - Modal displays notification preview

3. **User selects reason**
   - Chooses from predefined reasons
   - Optionally adds additional details

4. **User submits report**
   - System validates the report
   - Creates report record
   - Logs for compliance tracking
   - Shows success confirmation

5. **Report is reviewed**
   - Moderation team reviews the report
   - Takes appropriate action
   - Updates report status

### Viewing Reports

1. **User opens Settings**
   - Navigates to Settings screen

2. **User taps "My Reports"**
   - Views list of reports they've filed
   - Sees status of each report

3. **User views report details**
   - Taps on a report
   - Sees full details and status

## Compliance Tracking

### Logging

All reports are logged for compliance monitoring:

```typescript
console.log('🚨 Notification Report Filed:', {
  reportId,
  notificationId,
  reporterId,
  reportedUserId,
  type: notificationType,
  reason,
  timestamp: new Date().toISOString(),
});
```

### High-Priority Reports

Reports for harassment or spam trigger warnings:

```typescript
if (reason === 'harassment' || reason === 'spam') {
  console.warn('⚠️ High-priority report filed:', {
    reportId,
    reason,
    reportedUserId,
  });
}
```

### Audit Trail

Reports are tracked in the compliance audit system:

```typescript
DebugLogger.logFCMEvent('notification_reported', {
  reportId,
  notificationId,
  reporterId,
  reportedUserId,
  notificationType,
  reason,
  details,
  timestamp: new Date().toISOString(),
});
```

## Moderation Workflow

### Report Review Process

1. **Report Submitted**
   - Status: `pending`
   - Appears in moderation queue

2. **Under Review**
   - Status: `reviewing`
   - Moderator investigates the report
   - Reviews notification content
   - Checks user history

3. **Action Taken**
   - Status: `resolved` or `dismissed`
   - Moderator adds notes
   - User may be warned or banned
   - Reporter is notified (optional)

### Admin Actions

Admins can:
- View all reports
- Filter by status, reason, or user
- Update report status
- Add admin notes
- Take action on reported users

## Privacy & Security

### User Privacy

- Reports are confidential
- Only the reporter and moderation team can see report details
- Reported users are not notified of reports (to prevent retaliation)

### Data Protection

- Report data is encrypted at rest
- Access is restricted to authorized personnel
- Reports are retained according to data retention policy

### Abuse Prevention

- Users cannot report the same notification multiple times (unique constraint)
- Users can only report notifications sent to them
- Excessive false reports may result in action against the reporter

## Best Practices

### For Users

1. **Be Specific** - Provide clear details about why you're reporting
2. **Be Honest** - Only report genuine violations
3. **Be Patient** - Reports are reviewed by humans and may take time

### For Developers

1. **Validate Input** - Always validate report data before submission
2. **Handle Errors** - Gracefully handle report submission failures
3. **Log Everything** - Comprehensive logging for compliance and debugging
4. **Protect Privacy** - Never expose report details to unauthorized users

### For Moderators

1. **Review Thoroughly** - Investigate each report carefully
2. **Be Fair** - Apply policies consistently
3. **Document Actions** - Add clear admin notes
4. **Follow Up** - Update report status promptly

## Testing

### Manual Testing

1. **Submit Report**
   - Create a test notification
   - Report it with each reason type
   - Verify report is created

2. **View Reports**
   - Check "My Reports" in settings
   - Verify reports are displayed correctly

3. **Duplicate Prevention**
   - Try reporting the same notification twice
   - Verify error is shown

### Automated Testing

```typescript
describe('Notification Reporting', () => {
  it('should create a report', async () => {
    const report = await NotificationService.reportNotification(
      notificationId,
      userId,
      'spam',
      'Test report'
    );
    
    expect(report.id).toBeDefined();
    expect(report.status).toBe('pending');
  });

  it('should prevent duplicate reports', async () => {
    // First report succeeds
    await NotificationService.reportNotification(
      notificationId,
      userId,
      'spam'
    );
    
    // Second report fails
    await expect(
      NotificationService.reportNotification(
        notificationId,
        userId,
        'spam'
      )
    ).rejects.toThrow();
  });

  it('should only allow recipient to report', async () => {
    await expect(
      NotificationService.reportNotification(
        notificationId,
        'different-user-id',
        'spam'
      )
    ).rejects.toThrow('You can only report notifications sent to you');
  });
});
```

## Troubleshooting

### Common Issues

**Report submission fails**
- Check network connection
- Verify user is the notification recipient
- Check for duplicate reports

**Reports not appearing in "My Reports"**
- Verify RLS policies are correct
- Check user authentication
- Verify report was created successfully

**Duplicate report error**
- User has already reported this notification
- Check unique constraint on notification_id + reporter_id

## Future Enhancements

### Phase 2 Features

1. **Report Status Notifications**
   - Notify users when their reports are reviewed
   - Show resolution details

2. **Report Analytics**
   - Dashboard for moderation team
   - Trends and patterns
   - User reputation scores

3. **Automated Moderation**
   - AI-powered content analysis
   - Automatic flagging of high-risk content
   - Pattern detection for repeat offenders

4. **Appeal System**
   - Allow reported users to appeal
   - Review process for appeals
   - Transparency in moderation decisions

## Conclusion

The notification reporting system provides users with a clear, easy way to report inappropriate notifications while maintaining privacy and security. The system integrates seamlessly with the existing notification infrastructure and provides comprehensive compliance tracking for audit purposes.

**Key Benefits:**
- ✅ User safety and control
- ✅ Compliance with platform guidelines
- ✅ Comprehensive audit trail
- ✅ Privacy protection
- ✅ Abuse prevention
- ✅ Moderation workflow support

**Requirements Met:**
- ✅ 15.4 - Respect user opt-out preferences
- ✅ 15.5 - Provide clear notification settings
- ✅ 15.9 - Allow users to report inappropriate notifications
