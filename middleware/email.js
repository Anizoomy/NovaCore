require('dotenv').config();
const axios = require('axios');

exports.sendMail = async (details) => {
  try {
    const payload = {
      sender: { 
        email: process.env.BREVO_SENDER_EMAIL, 
        name: process.env.BREVO_SENDER_NAME 
      },
      to: [
        { email: details.email }
      ],
      subject: details.subject,
      htmlContent: details.html
    };

    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      payload,
      {
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        timeout: 10000,
      }
    );

    console.log("Email sent successfully:", response.data);
    return response.data;

  } catch (error) {
    console.error("Payload sent:", error.config?.data); // debug
    console.error("Error response:", error.response?.data); // important!
    console.error("Error sending email:", error.message);
    throw error;
  }
};
