const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

let client = null;

if (accountSid && authToken) {
  client = twilio(accountSid, authToken);
}

const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

module.exports = {
  client,
  verifyServiceSid
};
