twilio_config = '''const twilio = require('twilio');

const client = twilio(
process.env.TWILIO_ACCOUNT_SID,
process.env.TWILIO_AUTH_TOKEN
);

const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

module.exports = {
client,
verifyServiceSid
};
'''

with open("/mnt/kimi/output/foodflow-ecosystem/backend/src/config/twilio.js", "w") as f:
f.write(twilio_config)
