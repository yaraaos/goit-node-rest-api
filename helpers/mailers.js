import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const config = {
  host: "smtp.ukr.net",
  port: 465,
  secure: true,
  auth: {
    user: process.env.UKR_NET_EMAIL,
    pass: process.env.UKR_NET_PASSWORD,
  },
};

const transporter = nodemailer.createTransport(config);

const sendMail = async (options = {}) => {
  const emailOptions = {
    from: process.env.UKR_NET_EMAIL,
    subject: "Nodemailer test",
    text: "Привіт. Ми тестуємо надсилання листів!",
    ...options,
  };

  try {
    return await transporter.sendMail(emailOptions);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

export default sendMail;