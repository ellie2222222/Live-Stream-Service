import nodemailer from "nodemailer";

const sendMail = (to, subject, text, html) => {
  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: "hungltse170216@fpt.edu.vn",
      pass: "likwubyioklnnokl",
    },
  });

  const options = {
    to: to,
    subject: subject,
    text: text,
    html: html,
  };

  return transport.sendMail(options);
};

export default sendMail;