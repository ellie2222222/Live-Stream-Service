const nodemailer = require("nodemailer");

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
    from: "lamtienhung93@gmail.com", // sender address
    to: to,
    subject: subject,
    text: text,
    html: html,
  };

  return transport.sendMail(options);
};

module.exports = { sendMail };
