 module.exports={


     accountSid :process.env.ACCOUNTSID,
     authToken : process.env.AUTHTOKEN,
     serviceID : process.env.SERVICESID,

   

 }

//  client = require('twilio')(AC3cfc734cfa4edc219b3c4bac2a79ef92, ab3b711488254c321dd220e83ebafc33);

// client.messages
//       .create({body: 'Hi there', from: '+15017122661', to: '+15558675310'})
//       .then(message => console.log(message.sid));