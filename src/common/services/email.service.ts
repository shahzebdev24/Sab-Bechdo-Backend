import nodemailer from 'nodemailer';
import { config } from '@config/index.js';
import { logger } from '@config/logger.js';
import { passwordResetTemplate } from '@common/templates/email/password-reset.template.js';

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.port === 465,
  auth: {
    user: config.email.user,
    pass: config.email.password,
  },
});

export const sendPasswordResetEmail = async (
  email: string,
  name: string,
  resetToken: string
): Promise<void> => {
  const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: config.email.from,
    to: email,
    subject: 'Reset Your Password - Sab Bechdo',
    html: passwordResetTemplate(name, resetUrl),
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info({ email }, 'Password reset email sent');
  } catch (error) {
    logger.error({ error, email }, 'Failed to send password reset email');
    throw error;
  }
};
