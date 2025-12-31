/**
 * Email templates for Mounjaro Tracker notifications
 * All templates use inline styles for maximum email client compatibility
 */

const baseStyles = {
  container: 'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;',
  header: 'background: linear-gradient(135deg, #0a0a0a 0%, #1a2a3a 100%); padding: 30px; border-radius: 12px 12px 0 0;',
  headerTitle: 'color: #00d4ff; margin: 0; font-size: 24px; font-weight: 600;',
  body: 'background: #1a2a3a; padding: 30px; border-radius: 0 0 12px 12px;',
  text: 'color: #ffffff; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;',
  mutedText: 'color: #9ca3af; font-size: 14px; line-height: 1.5;',
  button: 'display: inline-block; background: #00d4ff; color: #0a0a0a; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;',
  stat: 'background: #0a0a0a; padding: 16px; border-radius: 8px; margin: 8px 0;',
  statLabel: 'color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0;',
  statValue: 'color: #00d4ff; font-size: 24px; font-weight: 600; margin: 4px 0 0 0;',
  footer: 'text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;',
  divider: 'border: none; border-top: 1px solid #2a3a4a; margin: 24px 0;',
};

function wrapTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background: #0a0a0a;">
  <div style="${baseStyles.container}">
    ${content}
    <div style="${baseStyles.footer}">
      <p style="margin: 0;">Mounjaro Tracker</p>
      <p style="margin: 8px 0 0 0;">You're receiving this email because you have notifications enabled.</p>
    </div>
  </div>
</body>
</html>
`;
}

// ============================================================================
// INJECTION REMINDER
// ============================================================================

type InjectionReminderData = {
  daysUntilDue: number;
  dueDate: string;
  currentDose?: string;
};

export function injectionReminderTemplate(data: InjectionReminderData): { subject: string; html: string } {
  const dayText = data.daysUntilDue === 1 ? 'tomorrow' : `in ${data.daysUntilDue} days`;

  return {
    subject: `Injection Reminder - Due ${dayText}`,
    html: wrapTemplate(`
      <div style="${baseStyles.header}">
        <h1 style="${baseStyles.headerTitle}">Injection Reminder</h1>
      </div>
      <div style="${baseStyles.body}">
        <p style="${baseStyles.text}">
          Your next Mounjaro injection is due <strong>${dayText}</strong>.
        </p>

        <div style="${baseStyles.stat}">
          <p style="${baseStyles.statLabel}">Scheduled Date</p>
          <p style="${baseStyles.statValue}">${data.dueDate}</p>
        </div>

        ${data.currentDose ? `
        <div style="${baseStyles.stat}">
          <p style="${baseStyles.statLabel}">Current Dose</p>
          <p style="${baseStyles.statValue}">${data.currentDose}</p>
        </div>
        ` : ''}

        <hr style="${baseStyles.divider}">

        <p style="${baseStyles.mutedText}">
          Prepare your injection site and gather your supplies. Remember to rotate injection sites between abdomen, thigh, and upper arm.
        </p>
      </div>
    `),
  };
}

// ============================================================================
// WEIGHT REMINDER
// ============================================================================

type WeightReminderData = {
  lastWeight?: string;
  lastDate?: string;
};

export function weightReminderTemplate(data: WeightReminderData): { subject: string; html: string } {
  return {
    subject: 'Daily Weight Reminder',
    html: wrapTemplate(`
      <div style="${baseStyles.header}">
        <h1 style="${baseStyles.headerTitle}">Weight Reminder</h1>
      </div>
      <div style="${baseStyles.body}">
        <p style="${baseStyles.text}">
          Don't forget to log your weight today! Consistent tracking helps you see your progress.
        </p>

        ${data.lastWeight && data.lastDate ? `
        <div style="${baseStyles.stat}">
          <p style="${baseStyles.statLabel}">Last Recorded (${data.lastDate})</p>
          <p style="${baseStyles.statValue}">${data.lastWeight}</p>
        </div>
        ` : ''}

        <hr style="${baseStyles.divider}">

        <p style="${baseStyles.mutedText}">
          Tip: Weigh yourself at the same time each day for the most consistent results. Most people prefer first thing in the morning.
        </p>
      </div>
    `),
  };
}

// ============================================================================
// WEEKLY SUMMARY
// ============================================================================

type WeeklySummaryData = {
  weekStartDate: string;
  weekEndDate: string;
  weightEntries: number;
  injectionsCount: number;
  startWeight?: string;
  endWeight?: string;
  weeklyChange?: string;
  changeDirection?: 'up' | 'down' | 'same';
};

export function weeklySummaryTemplate(data: WeeklySummaryData): { subject: string; html: string } {
  const changeColor = data.changeDirection === 'down' ? '#22c55e' : data.changeDirection === 'up' ? '#ef4444' : '#9ca3af';
  const changeIcon = data.changeDirection === 'down' ? '↓' : data.changeDirection === 'up' ? '↑' : '→';

  return {
    subject: `Weekly Summary - ${data.weekStartDate} to ${data.weekEndDate}`,
    html: wrapTemplate(`
      <div style="${baseStyles.header}">
        <h1 style="${baseStyles.headerTitle}">Your Weekly Summary</h1>
      </div>
      <div style="${baseStyles.body}">
        <p style="${baseStyles.text}">
          Here's how your week went from ${data.weekStartDate} to ${data.weekEndDate}.
        </p>

        <div style="display: flex; gap: 16px; flex-wrap: wrap;">
          <div style="${baseStyles.stat} flex: 1; min-width: 120px;">
            <p style="${baseStyles.statLabel}">Weight Entries</p>
            <p style="${baseStyles.statValue}">${data.weightEntries}</p>
          </div>

          <div style="${baseStyles.stat} flex: 1; min-width: 120px;">
            <p style="${baseStyles.statLabel}">Injections</p>
            <p style="${baseStyles.statValue}">${data.injectionsCount}</p>
          </div>
        </div>

        ${data.weeklyChange ? `
        <div style="${baseStyles.stat}">
          <p style="${baseStyles.statLabel}">Weekly Change</p>
          <p style="color: ${changeColor}; font-size: 24px; font-weight: 600; margin: 4px 0 0 0;">
            ${changeIcon} ${data.weeklyChange}
          </p>
        </div>
        ` : ''}

        ${data.startWeight && data.endWeight ? `
        <div style="display: flex; gap: 16px; flex-wrap: wrap;">
          <div style="${baseStyles.stat} flex: 1; min-width: 120px;">
            <p style="${baseStyles.statLabel}">Week Start</p>
            <p style="${baseStyles.statValue}">${data.startWeight}</p>
          </div>

          <div style="${baseStyles.stat} flex: 1; min-width: 120px;">
            <p style="${baseStyles.statLabel}">Week End</p>
            <p style="${baseStyles.statValue}">${data.endWeight}</p>
          </div>
        </div>
        ` : ''}

        <hr style="${baseStyles.divider}">

        <p style="${baseStyles.text}">
          Keep up the great work! Consistency is key to your success.
        </p>
      </div>
    `),
  };
}

// ============================================================================
// INJECTION OVERDUE
// ============================================================================

type InjectionOverdueData = {
  daysOverdue: number;
  lastInjectionDate: string;
};

export function injectionOverdueTemplate(data: InjectionOverdueData): { subject: string; html: string } {
  return {
    subject: `Injection Overdue - ${data.daysOverdue} day${data.daysOverdue > 1 ? 's' : ''} past due`,
    html: wrapTemplate(`
      <div style="${baseStyles.header}">
        <h1 style="color: #ef4444; margin: 0; font-size: 24px; font-weight: 600;">Injection Overdue</h1>
      </div>
      <div style="${baseStyles.body}">
        <p style="${baseStyles.text}">
          Your Mounjaro injection is <strong>${data.daysOverdue} day${data.daysOverdue > 1 ? 's' : ''}</strong> overdue.
        </p>

        <div style="${baseStyles.stat}">
          <p style="${baseStyles.statLabel}">Last Injection</p>
          <p style="${baseStyles.statValue}">${data.lastInjectionDate}</p>
        </div>

        <hr style="${baseStyles.divider}">

        <p style="${baseStyles.mutedText}">
          If you've already taken your injection, please log it in the app. Missing doses can affect your treatment effectiveness.
        </p>
      </div>
    `),
  };
}

// ============================================================================
// PASSWORD RESET
// ============================================================================

type PasswordResetData = {
  resetUrl: string;
  expiryHours: number;
};

export function passwordResetTemplate(data: PasswordResetData): { subject: string; html: string } {
  return {
    subject: 'Reset your Mounjaro Tracker password',
    html: wrapTemplate(`
      <div style="${baseStyles.header}">
        <h1 style="${baseStyles.headerTitle}">Password Reset</h1>
      </div>
      <div style="${baseStyles.body}">
        <p style="${baseStyles.text}">
          You requested to reset your password for Mounjaro Tracker.
        </p>

        <p style="${baseStyles.text}">
          Click the button below to reset your password. This link expires in ${data.expiryHours} hour${data.expiryHours > 1 ? 's' : ''}.
        </p>

        <div style="text-align: center;">
          <a href="${data.resetUrl}" style="${baseStyles.button}">Reset Password</a>
        </div>

        <hr style="${baseStyles.divider}">

        <p style="${baseStyles.mutedText}">
          If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
        </p>

        <p style="${baseStyles.mutedText}">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <span style="color: #00d4ff;">${data.resetUrl}</span>
        </p>
      </div>
    `),
  };
}

// ============================================================================
// MILESTONE REACHED
// ============================================================================

type MilestoneData = {
  milestoneType: 'weight_loss' | 'weeks_on_treatment' | 'total_injections';
  value: string;
  message: string;
};

export function milestoneReachedTemplate(data: MilestoneData): { subject: string; html: string } {
  const titles: Record<string, string> = {
    weight_loss: 'Weight Loss Milestone',
    weeks_on_treatment: 'Treatment Milestone',
    total_injections: 'Injection Milestone',
  };

  return {
    subject: `Congratulations! ${titles[data.milestoneType]}`,
    html: wrapTemplate(`
      <div style="${baseStyles.header}">
        <h1 style="${baseStyles.headerTitle}">${titles[data.milestoneType]}</h1>
      </div>
      <div style="${baseStyles.body}">
        <p style="${baseStyles.text}">
          Congratulations on reaching a major milestone!
        </p>

        <div style="${baseStyles.stat}">
          <p style="${baseStyles.statLabel}">Achievement</p>
          <p style="${baseStyles.statValue}">${data.value}</p>
        </div>

        <p style="${baseStyles.text}">
          ${data.message}
        </p>

        <hr style="${baseStyles.divider}">

        <p style="${baseStyles.mutedText}">
          Keep up the amazing work. Every step forward is progress!
        </p>
      </div>
    `),
  };
}

// ============================================================================
// DOSE ESCALATION REMINDER
// ============================================================================

type DoseEscalationData = {
  currentDose: string;
  weeksOnDose: number;
};

export function doseEscalationReminderTemplate(data: DoseEscalationData): { subject: string; html: string } {
  return {
    subject: 'Dose Review Reminder',
    html: wrapTemplate(`
      <div style="${baseStyles.header}">
        <h1 style="${baseStyles.headerTitle}">Dose Review Reminder</h1>
      </div>
      <div style="${baseStyles.body}">
        <p style="${baseStyles.text}">
          You've been on <strong>${data.currentDose}</strong> for <strong>${data.weeksOnDose} weeks</strong>.
        </p>

        <p style="${baseStyles.text}">
          It may be a good time to consult with your healthcare provider about whether a dose adjustment is appropriate for you.
        </p>

        <hr style="${baseStyles.divider}">

        <p style="${baseStyles.mutedText}">
          Remember: Only your doctor can recommend dose changes. This is just a reminder based on typical treatment schedules.
        </p>
      </div>
    `),
  };
}
