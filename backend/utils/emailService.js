const nodemailer = require('nodemailer');

/**
 * uc774uba54uc77c uc11cube44uc2a4 ubaa8ub4c8
 */

// Mailtrap uc124uc815
const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST || 'sandbox.smtp.mailtrap.io',
  port: process.env.MAILTRAP_PORT || 2525,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS
  }
});

/**
 * ucd08ub300 uc774uba54uc77c uc804uc1a1 ud568uc218
 * @param {string} toEmail - ucd08ub300ud560 uc0acuc6a9uc790 uc774uba54uc77c
 * @param {string} inviterName - ucd08ub300ud55c uc0acuc6a9uc790 uc774ub984 (uc120ud0dduc801)
 * @returns {Promise} uc774uba54uc77c uc804uc1a1 uacb0uacfc
 */
const sendInvitationEmail = async (toEmail, inviterName = 'A friend') => {
  // uc571 ub2e4uc6b4ub85cub4dc ub9c1ud06c (uc2e4uc81c uad00ub828 ub9c1ud06cub85c uc218uc815 ud544uc694)
  const appStoreLink = 'https://apps.apple.com/app/your-app-id';
  const playStoreLink = 'https://play.google.com/store/apps/details?id=your.app.id';
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'test@whatsinmyfridge.com',
    to: toEmail,
    subject: `${inviterName} invited you to join What's in my Fridge!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>You've been invited to What's in my Fridge!</h2>
        <p>${inviterName} has invited you to join What's in my Fridge, an app that helps you manage your food inventory and reduce waste.</p>
        <p>With What's in my Fridge, you can:</p>
        <ul>
          <li>Track what's in your refrigerator</li>
          <li>Get notified about expiring items</li>
          <li>Share your fridge with family members or roommates</li>
          <li>Plan meals based on what you have</li>
        </ul>
        <p>Download the app today:</p>
        <div style="margin: 20px 0;">
          <a href="${appStoreLink}" style="background-color: #4285F4; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; margin-right: 10px;">App Store</a>
          <a href="${playStoreLink}" style="background-color: #0F9D58; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Google Play</a>
        </div>
        <p>We hope you enjoy using What's in my Fridge!</p>
      </div>
    `
  };

  try {
    // uc774uba54uc77c uc804uc1a1 uc2dcub3c4
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendInvitationEmail
};
