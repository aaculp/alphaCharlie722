# Notification Reporting - Quick Start Guide

## For Users

### How to Report a Notification

1. **Find the notification** you want to report
2. **Tap the "Report" button** (flag icon)
3. **Select a reason:**
   - Spam - Unwanted or repetitive
   - Harassment - Threatening or abusive
   - Inappropriate - Offensive content
   - Misleading - False information
   - Other - Other reasons
4. **Add details** (optional but helpful)
5. **Tap "Submit Report"**
6. **Done!** Your report has been submitted

### View Your Reports

1. Open **Settings**
2. Scroll to **Support & Legal**
3. Tap **"My Reports"**
4. View all your submitted reports

### What Happens Next?

- Your report is reviewed by our moderation team
- Reports are confidential
- The reported user is not notified
- You may be contacted if more information is needed

## For Developers

### Quick Integration

```typescript
import { NotificationReportModal } from '../../components/social';

// In your component
const [reportModalVisible, setReportModalVisible] = useState(false);
const [selectedNotification, setSelectedNotification] = useState<SocialNotification | null>(null);

// Add report button to your notification item
<TouchableOpacity onPress={() => {
  setSelectedNotification(notification);
  setReportModalVisible(true);
}}>
  <Icon name="flag" size={20} />
</TouchableOpacity>

// Add the modal
<NotificationReportModal
  visible={reportModalVisible}
  notification={selectedNotification}
  onClose={() => setReportModalVisible(false)}
  onReportSubmitted={() => {
    // Optional: refresh notifications or show confirmation
  }}
/>
```

### API Usage

```typescript
// Report a notification
const report = await NotificationService.reportNotification(
  notificationId,
  userId,
  'spam',
  'Optional details here'
);

// Get user's reports
const reports = await NotificationService.getUserReports(userId);

// Track for compliance
ComplianceService.trackNotificationReport(
  report.id,
  notificationId,
  userId,
  reportedUserId,
  notificationType,
  reason,
  details
);
```

### Database Setup

Run the migration:

```bash
# Execute the SQL migration
psql -d your_database -f database/migrations/011_create_notification_reports_table.sql
```

## For Moderators

### Review Reports

1. **Access moderation dashboard** (to be implemented)
2. **Filter reports** by status, reason, or priority
3. **Review report details:**
   - Notification content
   - Reporter information
   - Reported user information
   - Reason and details
4. **Take action:**
   - Dismiss if not a violation
   - Warn the user
   - Suspend or ban if serious
5. **Update report status** and add notes

### Report Statuses

- **Pending** - Awaiting review
- **Reviewing** - Currently being investigated
- **Resolved** - Action taken
- **Dismissed** - No violation found

## Report Reasons Explained

### Spam
Unwanted, repetitive, or unsolicited notifications. Examples:
- Multiple friend requests from the same user
- Repeated venue shares
- Automated or bot-like behavior

### Harassment
Threatening, abusive, or harmful content. Examples:
- Threats of violence
- Bullying or intimidation
- Hate speech
- Personal attacks

### Inappropriate
Offensive or inappropriate content. Examples:
- Sexual content
- Graphic violence
- Discriminatory content
- Profanity or vulgarity

### Misleading
False or deceptive information. Examples:
- Fake venue information
- Impersonation
- Phishing attempts
- Scams or fraud

### Other
Any other reason not covered above. Examples:
- Technical issues
- Privacy concerns
- Other policy violations

## Best Practices

### For Users

✅ **Do:**
- Report genuine violations
- Provide specific details
- Be patient with the review process

❌ **Don't:**
- File false reports
- Report multiple times
- Use reporting as retaliation

### For Developers

✅ **Do:**
- Validate all input
- Handle errors gracefully
- Log for compliance
- Protect user privacy

❌ **Don't:**
- Expose report details
- Skip validation
- Ignore errors
- Notify reported users

### For Moderators

✅ **Do:**
- Review thoroughly
- Be fair and consistent
- Document actions
- Follow up promptly

❌ **Don't:**
- Rush decisions
- Apply policies inconsistently
- Ignore context
- Disclose reporter identity

## Troubleshooting

### "Failed to submit report"
- Check network connection
- Verify you're the notification recipient
- Try again in a few moments

### "You've already reported this"
- You can only report each notification once
- Check "My Reports" to see your previous report

### "Cannot report this notification"
- You can only report notifications sent to you
- Verify you're logged in correctly

## Support

Need help?
- Check the full [Notification Reporting Guide](./NOTIFICATION_REPORTING_GUIDE.md)
- Contact support through Settings > Help & Support
- Email: support@example.com

## Privacy & Security

- Reports are confidential
- Only you and moderators can see your reports
- Reported users are not notified
- Your identity is protected
- Data is encrypted and secure

## Compliance

This feature helps us:
- Maintain a safe community
- Comply with platform guidelines
- Track and prevent abuse
- Provide audit trails
- Protect user privacy

**Requirements Met:**
- ✅ 15.4 - Respect user opt-out preferences
- ✅ 15.5 - Provide clear notification settings
- ✅ 15.9 - Allow users to report inappropriate notifications
