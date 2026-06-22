const sendEmail = require('./sendEmail');

const sendMeetingEmail = async ({ to, userName, meetingTitle, meetingTime, roomId, hostName, isScheduled }) => {
  const meetingLink = `${process.env.FRONTEND_URL}/meeting/${roomId}`;
  const date = new Date(meetingTime);
  const formattedDate = date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #1f2937;
          background-color: #f3f4f6;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .header {
          background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
          padding: 32px 24px;
          text-align: center;
        }
        .header h1 {
          color: white;
          margin: 0;
          font-size: 24px;
          font-weight: 700;
        }
        .content {
          padding: 32px 24px;
        }
        .meeting-details {
          background-color: #f9fafb;
          border-radius: 12px;
          padding: 20px;
          margin: 20px 0;
          border: 1px solid #e5e7eb;
        }
        .detail-row {
          display: flex;
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e5e7eb;
        }
        .detail-label {
          font-weight: 600;
          width: 100px;
          color: #4b5563;
        }
        .detail-value {
          flex: 1;
          color: #1f2937;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
          color: white !important;
          text-decoration: none;
          padding: 12px 32px;
          border-radius: 8px;
          font-weight: 600;
          margin: 20px 0;
          text-align: center;
          transition: transform 0.2s;
        }
        .button:hover {
          transform: translateY(-2px);
        }
        .footer {
          background-color: #f9fafb;
          padding: 20px 24px;
          text-align: center;
          font-size: 12px;
          color: #6b7280;
          border-top: 1px solid #e5e7eb;
        }
        .badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          background-color: #fef3c7;
          color: #d97706;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎥 IntellMeet</h1>
        </div>
        <div class="content">
          <h2 style="margin-top: 0;">Bonjour ${userName},</h2>
          
          <p>${isScheduled ? 'A new meeting has been scheduled' : 'A meeting has just started'} on IntellMeet.</p>
          
          <div class="meeting-details">
            <div class="detail-row">
              <div class="detail-label">Title :</div>
              <div class="detail-value"><strong>${meetingTitle}</strong></div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Organizer :</div>
              <div class="detail-value">${hostName}</div>
            </div>
            ${isScheduled ? `
            <div class="detail-row">
              <div class="detail-label">Date & Time :</div>
              <div class="detail-value">${formattedDate}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Status :</div>
              <div class="detail-value"><span class="badge">Programmed</span></div>
            </div>
            ` : `
            <div class="detail-row">
              <div class="detail-label">Status  :</div>
              <div class="detail-value"><span class="badge" style="background-color:#d1fae5; color:#065f46;">En cours</span></div>
            </div>
            `}
            <div class="detail-row">
              <div class="detail-label">Room ID:</div>
              <div class="detail-value"><code style="background:#f3f4f6; padding:4px 8px; border-radius:4px;">${roomId}</code></div>
            </div>
          </div>
          
          <div style="text-align: center;">
            <a href="${meetingLink}" class="button">
              ${isScheduled ? 'Add to calendar & Join' : '🎥 Join the meeting'}
            </a>
          </div>
          
          <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
            <strong>Tip  :</strong> You can copy the Room ID to join directly from the app.
          </p>
        </div>
        <div class="footer">
          <p>IntellMeet - AI Powered Meetings</p>
          <p>This email was sent to ${to} because you are a member of a team concerned by this meeting.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    email: to,
    subject: `${isScheduled ? '📅 Nouvelle réunion programmée' : '🎥 Nouvelle réunion en cours'} : ${meetingTitle}`,
    html: emailHtml,
  });
};

module.exports = sendMeetingEmail;