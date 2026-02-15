// utils/email.js - Email notification system using Resend

/**
 * Send review completion email
 * @param {Object} params
 * @param {string} params.to - Recipient email
 * @param {string} params.studentName - Student name
 * @param {string} params.fileName - Original file name
 * @param {string} params.reviewType - 'quicklook' or 'full'
 * @param {string} params.downloadLink - Link to download the review (optional)
 * @param {Buffer} params.attachment - Word document buffer (optional)
 */
export async function sendReviewCompletionEmail({
  to,
  studentName = '',
  fileName,
  reviewType = 'full',
  downloadLink = '',
  attachment = null,
}) {
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured');
    throw new Error('Email service not configured');
  }

  const isQuickLook = reviewType.toLowerCase().includes('quick');
  const subject = isQuickLook
    ? `Your QuickLook Review is Ready! - ${fileName}`
    : `Your Full HAIST© Review is Ready! - ${fileName}`;

  const greeting = studentName ? `Hi ${studentName},` : 'Hello,';

  const reviewTypeText = isQuickLook ? 'QuickLook Review' : 'Full HAIST© Review';

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #374151;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
      padding: 30px 20px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
    }
    .content {
      background: #ffffff;
      padding: 30px 20px;
      border: 1px solid #e5e7eb;
      border-top: none;
      border-radius: 0 0 8px 8px;
    }
    .button {
      display: inline-block;
      background: #6366f1;
      color: white;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .button:hover {
      background: #4f46e5;
    }
    .info-box {
      background: #f3f4f6;
      border-left: 4px solid #6366f1;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 14px;
      color: #6b7280;
    }
    .footer a {
      color: #6366f1;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>✅ Your Review is Ready!</h1>
  </div>

  <div class="content">
    <p>${greeting}</p>

    <p>Great news! Your <strong>${reviewTypeText}</strong> has been completed and is ready for download.</p>

    <div class="info-box">
      <strong>📄 Document:</strong> ${fileName}<br>
      <strong>📊 Review Type:</strong> ${reviewTypeText}<br>
      <strong>📅 Completed:</strong> ${new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}
    </div>

    ${
      downloadLink
        ? `
    <div style="text-align: center;">
      <a href="${downloadLink}" class="button">Download Your Review</a>
    </div>
    `
        : attachment
        ? `
    <p><strong>Your review is attached to this email as a Word document.</strong></p>
    `
        : ''
    }

    <h3 style="color: #6366f1; margin-top: 30px;">What's in Your Review?</h3>
    <ul>
      ${
        isQuickLook
          ? `
      <li>🎯 Top 5 critical dimensions analyzed</li>
      <li>⚠️ Defense blockers identified (if any)</li>
      <li>📝 Priority recommendations</li>
      <li>⏱️ Estimated revision timeline</li>
      `
          : `
      <li>📊 Complete 10-dimensional HAIST© analysis</li>
      <li>⭐ Ratings for each dimension</li>
      <li>✅ Strengths and areas for development</li>
      <li>🎯 Specific, actionable recommendations</li>
      <li>📍 Evidence-based critiques with page citations</li>
      <li>📋 Prioritized action plan</li>
      `
      }
    </ul>

    <h3 style="color: #6366f1;">Next Steps</h3>
    <ol>
      <li>Download and review your HAIST© report</li>
      <li>Address any "Defense Blockers" immediately</li>
      <li>Follow the prioritized action plan</li>
      <li>Return for a follow-up QuickLook after revisions</li>
    </ol>

    ${
      isQuickLook
        ? `
    <div class="info-box">
      <strong>💡 Want a deeper analysis?</strong><br>
      Consider upgrading to a Full Review for comprehensive feedback across all 10 dimensions with detailed recommendations.
      <br><br>
      <a href="https://doctordissertation.com" style="color: #6366f1; font-weight: 600;">Learn More →</a>
    </div>
    `
        : ''
    }

    <h3 style="color: #6366f1;">Need Help?</h3>
    <p>Have questions about your review? Want to discuss the recommendations?</p>
    <p>Reply to this email or visit <a href="https://doctordissertation.com/contact.html" style="color: #6366f1;">our contact page</a>.</p>

    <p style="margin-top: 30px;">Best of luck with your revisions!</p>
    <p style="margin: 0;"><strong>The Dr. Dissertation Team</strong></p>
    <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">Powered by the HAIST© Framework</p>
  </div>

  <div class="footer">
    <p>
      <a href="https://doctordissertation.com">Dr. Dissertation</a> •
      <a href="https://beta.doctordissertation.com">Beta App</a> •
      <a href="https://doctordissertation.com/contact.html">Contact</a>
    </p>
    <p style="font-size: 12px; color: #9ca3af;">
      HAIST© is a registered trademark. All reviews are confidential and automatically deleted after 30 days.
    </p>
  </div>
</body>
</html>
  `.trim();

  const textBody = `
${greeting}

Great news! Your ${reviewTypeText} has been completed and is ready for download.

Document: ${fileName}
Review Type: ${reviewTypeText}
Completed: ${new Date().toLocaleString()}

${downloadLink ? `Download your review here: ${downloadLink}` : attachment ? 'Your review is attached to this email as a Word document.' : ''}

What's in Your Review?
${
  isQuickLook
    ? `
- Top 5 critical dimensions analyzed
- Defense blockers identified (if any)
- Priority recommendations
- Estimated revision timeline
`
    : `
- Complete 10-dimensional HAIST© analysis
- Ratings for each dimension
- Strengths and areas for development
- Specific, actionable recommendations
- Evidence-based critiques with page citations
- Prioritized action plan
`
}

Next Steps:
1. Download and review your HAIST© report
2. Address any "Defense Blockers" immediately
3. Follow the prioritized action plan
4. Return for a follow-up QuickLook after revisions

Need Help?
Reply to this email or visit: https://doctordissertation.com/contact.html

Best of luck with your revisions!

The Dr. Dissertation Team
Powered by the HAIST© Framework

---
Dr. Dissertation
https://doctordissertation.com
  `.trim();

  // Prepare email payload
  const emailPayload = {
    from: 'Dr. Dissertation <reviews@doctordissertation.com>',
    to: [to],
    subject,
    html: htmlBody,
    text: textBody,
    reply_to: 'drchick@doctordissertation.com',
  };

  // Add attachment if provided
  if (attachment) {
    emailPayload.attachments = [
      {
        filename: `${fileName.replace(/\.[^/.]+$/, '')}_HAIST_Review.docx`,
        content: attachment.toString('base64'),
      },
    ];
  }

  // Send via Resend API
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify(emailPayload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Resend API error:', response.status, errorData);
    throw new Error(`Failed to send email: ${response.status}`);
  }

  const result = await response.json();
  console.log('✅ Email sent:', result.id);

  return result;
}

/**
 * Send beta tester welcome email
 */
export async function sendBetaWelcomeEmail({
  to,
  betaCode,
  testerName = '',
}) {
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured');
    throw new Error('Email service not configured');
  }

  const subject = 'Welcome to Dr. Dissertation Beta Testing! 🎓';
  const greeting = testerName ? `Hi ${testerName},` : 'Hello,';

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #374151;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
      padding: 30px 20px;
      border-radius: 8px;
      text-align: center;
    }
    .code-box {
      background: #f3f4f6;
      border: 2px dashed #6366f1;
      padding: 20px;
      margin: 20px 0;
      border-radius: 8px;
      text-align: center;
    }
    .code {
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 24px;
      font-weight: 700;
      color: #6366f1;
      letter-spacing: 2px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 Welcome to Beta Testing!</h1>
  </div>

  <p>${greeting}</p>

  <p>Congratulations! You're one of our <strong>20 beta testers</strong> for Dr. Dissertation.</p>

  <div class="code-box">
    <p style="margin: 0 0 10px 0; font-weight: 600;">Your Beta Access Code:</p>
    <div class="code">${betaCode}</div>
  </div>

  <h3>What You Get (FREE):</h3>
  <ul>
    <li>✓ 3 QuickLook Rapid Reviews (~10 minutes each)</li>
    <li>✓ 1 Full Review (comprehensive, 3-day turnaround)</li>
    <li>✓ Professional HAIST© framework analysis</li>
    <li>✓ Expert feedback on your dissertation</li>
  </ul>

  <h3>How to Use:</h3>
  <ol>
    <li>Visit: <a href="https://beta.doctordissertation.com">beta.doctordissertation.com</a></li>
    <li>Enter your beta code: <strong>${betaCode}</strong></li>
    <li>Upload your dissertation (PDF or Word)</li>
    <li>Select review type (QuickLook or Full)</li>
    <li>Receive your HAIST© review!</li>
  </ol>

  <p><strong>QuickLook</strong> = Fast check for critical issues (~10 min)<br>
  <strong>Full Review</strong> = Complete 10-dimensional analysis (3 days)</p>

  <h3>Your Feedback Matters:</h3>
  <p>After each review, please complete our 2-minute survey. Your input directly shapes Dr. Dissertation's future!</p>

  <h3>Beta Tester Benefits:</h3>
  <ul>
    <li>✓ Free reviews during beta period</li>
    <li>✓ 25% discount code for 12 months after launch</li>
    <li>✓ Early access to new features</li>
    <li>✓ Direct line to the development team</li>
  </ul>

  <p><strong>Beta Period:</strong> Now through March 31, 2026</p>

  <p>Questions? Issues? Feedback? Reply to this email anytime.</p>

  <p>We're excited to help you succeed!</p>

  <p><strong>Best regards,</strong><br>
  Dr. John Chick<br>
  Dr. Dissertation Team</p>

  <p style="font-size: 12px; color: #6b7280; margin-top: 30px;">
    P.S. Your unique code (${betaCode}) is for your use only. Please don't share it, as we have limited beta capacity.
  </p>
</body>
</html>
  `.trim();

  const emailPayload = {
    from: 'Dr. Dissertation <reviews@doctordissertation.com>',
    to: [to],
    subject,
    html: htmlBody,
    reply_to: 'drchick@doctordissertation.com',
  };

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify(emailPayload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Failed to send email: ${response.status}`);
  }

  return await response.json();
}
