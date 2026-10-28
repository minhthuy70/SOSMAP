const nodemailer = require('nodemailer');

// Email transporter configuration
let transporter;

function initializeEmailService() {
  // Check if email configuration is available
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } else {
    console.warn('Email service not configured. Email notifications will be logged only.');
  }
}

// Send email
async function sendEmail(to, subject, html, text) {
  if (!transporter) {
    console.log('Email service not configured. Would send email to:', to);
    console.log('Subject:', subject);
    return { success: true, message: 'Email logged (service not configured)' };
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@sosmap.vn',
      to: to,
      subject: subject,
      html: html,
      text: text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email error:', error);
    throw new Error('Failed to send email');
  }
}

// Send incident verification email
async function sendIncidentVerificationEmail(userEmail, incident) {
  const subject = `SOSMAP - Sự cố mới: ${incident.title}`;
  const html = `
    <h2>Sự cố mới đã được báo cáo</h2>
    <p><strong>Loại:</strong> ${incident.type}</p>
    <p><strong>Tiêu đề:</strong> ${incident.title}</p>
    <p><strong>Mô tả:</strong> ${incident.description}</p>
    <p><strong>Mức độ:</strong> ${incident.severity}</p>
    <p><strong>Vị trí:</strong> ${incident.latitude}, ${incident.longitude}</p>
    <p><a href="${process.env.FRONTEND_URL}/incidents/${incident.id}">Xem chi tiết</a></p>
  `;
  const text = `Sự cố mới: ${incident.title}\nLoại: ${incident.type}\nMô tả: ${incident.description}`;

  return sendEmail(userEmail, subject, html, text);
}

// Send incident status update email
async function sendIncidentStatusEmail(userEmail, incident, oldStatus, newStatus) {
  const subject = `SOSMAP - Cập nhật trạng thái sự cố: ${incident.title}`;
  const html = `
    <h2>Trạng thái sự cố đã được cập nhật</h2>
    <p><strong>Tiêu đề:</strong> ${incident.title}</p>
    <p><strong>Trạng thái cũ:</strong> ${oldStatus}</p>
    <p><strong>Trạng thái mới:</strong> ${newStatus}</p>
    <p><a href="${process.env.FRONTEND_URL}/incidents/${incident.id}">Xem chi tiết</a></p>
  `;
  const text = `Trạng thái sự cố đã được cập nhật: ${incident.title}\nTừ: ${oldStatus}\nĐến: ${newStatus}`;

  return sendEmail(userEmail, subject, html, text);
}

// Send welcome email
async function sendWelcomeEmail(userEmail, userName) {
  const subject = 'Chào mừng đến với SOSMAP';
  const html = `
    <h2>Chào mừng ${userName}!</h2>
    <p>Cảm ơn bạn đã đăng ký tài khoản tại SOSMAP.</p>
    <p>Hệ thống SOSMAP giúp bạn báo cáo và theo dõi các sự cố giao thông và thiên tai.</p>
    <p><a href="${process.env.FRONTEND_URL}">Đăng nhập ngay</a></p>
  `;
  const text = `Chào mừng ${userName}! Cảm ơn bạn đã đăng ký tài khoản tại SOSMAP.`;

  return sendEmail(userEmail, subject, html, text);
}

// Send password reset email
async function sendPasswordResetEmail(userEmail, resetToken) {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  const subject = 'SOSMAP - Khôi phục mật khẩu';
  const html = `
    <h2>Khôi phục mật khẩu</h2>
    <p>Bạn đã yêu cầu khôi phục mật khẩu.</p>
    <p><a href="${resetUrl}">Nhấn vào đây để đặt lại mật khẩu</a></p>
    <p>Liên kết này sẽ hết hạn sau 1 giờ.</p>
  `;
  const text = `Khôi phục mật khẩu: ${resetUrl}`;

  return sendEmail(userEmail, subject, html, text);
}

// Send notification email
async function sendNotificationEmail(userEmail, notification) {
  const subject = `SOSMAP - ${notification.title}`;
  const html = `
    <h2>${notification.title}</h2>
    <p>${notification.message}</p>
    <p><a href="${process.env.FRONTEND_URL}/notifications">Xem tất cả thông báo</a></p>
  `;
  const text = `${notification.title}\n${notification.message}`;

  return sendEmail(userEmail, subject, html, text);
}

module.exports = {
  initializeEmailService,
  sendEmail,
  sendIncidentVerificationEmail,
  sendIncidentStatusEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendNotificationEmail
};
