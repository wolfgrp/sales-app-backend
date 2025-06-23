const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});

exports.sendEmail = (recipients, subject, text, attachments = []) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: recipients,
    subject,
    text,
    attachments,
  };

  return transporter.sendMail(mailOptions)
    .then(info => console.log(`📧 Email sent: ${info.response}`))
    .catch(err => console.error('❌ Email error:', err.message));
};
