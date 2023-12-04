require('dotenv').config();
const sgMail = require("@sendgrid/mail");
const elasticemail = require('elasticemail');
const nodemailer = require('nodemailer');


sgMail.setApiKey(process.env.SG_KEY);

// const sendSGMail = async ({
//   to,
//   sender,
//   subject,
//   html,
//   attachments,
//   text,
// }) => {
//   try {
//     const from = "rajesh.truematrix@gmail.com";

//     const msg = {
//       to: to, // Change to your recipient
//       from: from, // Change to your verified sender
//       subject: subject,
//       html: html,
//       // text: text,
//       attachments,
//     };

    
//     return sgMail.send(msg);
//   } catch (error) {
//     console.log(error);
//   }
// };

var client = elasticemail.createClient({
  username: 'rajesh.truematrix@gmail.com',
  apiKey: '80E3605B08F730EFEDB45EE4F7396EFCC40A9E4CD05DB3947E44FED97D122F0355832720FC87BF52D0C938B74E0A0172'
});
const transporter = nodemailer.createTransport({
  service: 'gmail', // Use the email service provider (e.g., 'gmail' for Gmail)
  auth: {
    user: 'rajesh.truematrix@gmail.com', // Your email address
    pass: 'ssdr txqp zclh deqx' // Your email password or application-specific password
  }
});
 
const sendSGMail = async ({
  to,
  sender,
  subject,
  html,
  attachments,
  text,
}) => {
  try {
    const mailOptions = {
      from: 'rajesh.truematrix@gmail.com', // Sender address
      to: to, // Recipient address
      subject: subject, // Subject line
      html: html // Plain text body
    };    
    return transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.error(error.message);
      }
      console.log('Email sent: ' + info.response);
    });
  } catch (error) {
    console.log(error);
  }
};
// const msg = {
//   from: 'rajesh.truematrix@gmail.com',
//   from_name: 'True Chat',
//   to: 'username@example.org',
//   subject: 'Hello',
//   body_text: 'Hello World!'
// };
 
// client.mailer.send(msg, function(err, result) {
//   if (err) {
//     return console.error(err);
//   }
 
//   console.log(result);
// });

exports.sendEmail = async (args) => {
  if (!process.env.NODE_ENV === "development") {
    return Promise.resolve();
  } else {
    return sendSGMail(args);
  }
};
