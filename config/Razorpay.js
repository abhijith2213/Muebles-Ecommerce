const Razorpay = require('razorpay')

let KeyId = process.env.KEYID
let keySecret = process.env.KEYSECRET
var instance = new Razorpay({
    key_id: process.env.KEYID,
    key_secret: process.env.KEYSECRET,
  });

  module.exports={instance,KeyId,keySecret}