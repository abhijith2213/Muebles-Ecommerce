const db = require('../config/connection')
const collection = require('../config/collections')
const bcrypt = require('bcrypt')

const ottp = require('../config/Otp');

const  objectId = require("mongodb").ObjectId;
const client = require('twilio')(ottp.accountSid, ottp.authToken)

const Razorpay = require('razorpay')
const razorpayData = require('../config/Razorpay');
const paypal = require('paypal-rest-sdk')
const paypalData = require('../config/paypal');
const CC = require("currency-converter-lt");
const { log } = require('console');
const { resolve } = require('path');
const { router, response } = require('../app');


paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': paypalData.clientId ,
    'client_secret': paypalData.clientSecret
  });




module.exports={

    doSignup:(userData)=>{
        console.log(userData);
        return new Promise(async(resolve,reject)=>{
            let response={}
            let mail = await db.get().collection(collection.USER_COLLECTION).findOne({$or:[{email: userData.email},{phone:userData.phone}]})
            console.log(mail,'mailtooo');
            if(mail){
                if(mail.email == userData.email){
                    response.status=true
                    response.message = 'Email already registered please login'
                }
                else if(mail.phone == userData.phone){
                    response.status=true
                    response.message = 'Phone already registered please login'
                }
                resolve(response)
            }else{
                if(!userData.referral){ 
                    userData.wallet = 0;
                    userData.password= await bcrypt.hash(userData.password,10)
                    userData.state=true;
                    userData.referral ='' +(Math.floor(Math.random()*900000)+ 10000)
                    console.log(userData);
                    db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{
                    resolve(data)
                    })
                }else{
                    let validReferral = await db.get().collection(collection.USER_COLLECTION).findOne({referral:userData.referral})
                    console.log((validReferral,'validdd'));
                    if(validReferral){
                        let user = await db.get().collection(collection.USER_COLLECTION).updateOne({referral:userData.referral},
                            {
                                $set:{wallet:validReferral.wallet+200}
                            })

                            userData.wallet = 100;
                            userData.password= await bcrypt.hash(userData.password,10)
                            userData.state=true;
                            userData.referral ='' +(Math.floor(Math.random()*900000)+ 10000)
                            console.log(userData);
                            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{
                            resolve(data)
                            })
                    }else{
                        response.message ='Invalid Referral Code'
                        response.status = true
                        resolve(response)
                    }
                }
        }
        })
    },

    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            console.log('hyyyyyyyy');
            let response={}
            let user =await db.get().collection(collection.USER_COLLECTION).findOne({email:userData.email})
            
            if(user){
               await bcrypt.compare(userData.password,user.password).then((status)=>{
                    if(status){
                        if(user.state){
                            response.message='successfully logged in'
                            response.user=user
                            response.status=true
                            resolve(response)
                            console.log('successfully logged in');
                        }else{
                            response.message='Issue with login contact admin for details'
                            response.status=false
                            resolve(response)
                        }
                        
                    }else{
                        response.status=false
                        response.message='login failed incorrect password'
                        resolve(response)
                        console.log('login failed incorrect password');
                    }
                })
                
            }else{
                response.status=false
                response.message='login failed email not registered'
                resolve(response)
                console.log('login failed user not found');
            }
        })
    },



    /* -------------------------------- otpLogin -------------------------------- */
    otpLogin:(userPhone)=>{
        console.log(userPhone,'usp');
        let response={}
        return new Promise(async(resolve,reject)=>{
         let user = await  db.get().collection(collection.USER_COLLECTION).findOne({phone:userPhone.phone})
         console.log('user:',user);
         if(user){
            response.status= true
            response.user=user
            client.verify.services(ottp.serviceID).verifications
            .create({
                to: `+91${userPhone.phone}`,
                channel:`sms`
            })
            .then((data)=>{
                
            })
            resolve(response)
         }else{
            response.status=false
            response.message='Phone not registered'
            resolve(response)
         }
        })
    },

    /* ----------------------------- otp validation ----------------------------- */
    otp:(otpData,userData)=>{
        return new Promise((resolve,reject)=>{
            client.verify.services(ottp.serviceID).verificationChecks
            .create({
                to: `+91${userData.phone}`,
                code: otpData.otp
            }).then((data)=>{
                if(data.status == 'approved'){
                    resolve({status:true})
                }else{
                    resolve({status:false})
                }
            })
        })
    },


    /* -------------------------------- otpLogin -------------------------------- */
    otpLogin:(userPhone)=>{
       
        let response={}
        return new Promise(async(resolve,reject)=>{
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({phone: userPhone.phone})
            if(user){
                response.status= true
                response.user=user
                client.verify.services(ottp.serviceID).verifications
                .create({
                    to: `+91${userPhone.phone}`,
                    channel: `sms`
                    
                })
                .then((data)=>{

                })
                resolve(response)
            }else{
                response.status=false
                response.message='Phone not registered'
                resolve(response)
            }
        })
      
    },

    /* ----------------------------- otp validation ----------------------------- */
    otp:(otpData,userData)=>{
        
        return new Promise((resolve,reject)=>{
            client.verify.services(ottp.serviceID).verificationChecks
            .create({
                to : `+91${userData.phone}`,
                code : otpData.otp
            }).then((data)=>{
                
                if(data.status == 'approved'){
                    resolve({status:true})
                }else{
                    resolve({status:false})
                }
            })
        })
    },

    /* ------------------------- GET PRODUCT BY CATEGORY ------------------------ */
    getCategoryProduct:(catId)=>{
      
        return new Promise(async(resolve,reject)=>{
        let products = await  db.get().collection(collection.PRODUCTS).find({category:objectId(catId)}).toArray()
        // console.log(products,'ppo');
         resolve(products)
        })
    },

    /* ------------------------------- ADD TO CART ------------------------------ */

    addToCart:(proId,uId)=>{
        let response ={}
        let proObj={
            item:objectId(proId),
            quantity:1
        }
        return new Promise(async(resolve,reject)=>{
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(uId)})

            if(userCart){
                let proExist = userCart.products.findIndex(product=> product.item == proId)
              
                if(proExist !=-1){
                    db.get().collection(collection.CART_COLLECTION)
                    .updateOne({user:objectId(uId),'products.item':objectId(proId)},
                    {
                        $inc:{'products.$.quantity':1} 
                    }
                    ).then((response)=>{
                        response.status = false
                        resolve(response)
                    })
                }else{
                db.get().collection(collection.CART_COLLECTION)
                .updateOne({user:objectId(uId)},
                {
                    $push:{products:proObj}
                }
                ).then((response)=>{
                    response.status = true
                    resolve(response)
                })
            }
            }else{
              let  cartObj={
                    user:objectId(uId),
                    products:[proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                    response.status=true
                    resolve(response)
                })
            }
        })

    },

    /* ---------------------------- GET CART PRODUCTS --------------------------- */
    getCartProducts:(userId)=>{
        return new Promise(async(resolve,reject)=>{

            let cartItems =await db.get().collection(collection.CART_COLLECTION)
            .aggregate([
                {
                    $match:{user:objectId(userId)}
                },
                {
                    $unwind: '$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCTS,
                        localField: 'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,
                        quantity:1,
                        product:{$arrayElemAt:['$product',0]} 
                    }
                }
            ]).toArray()
        //    console.log(cartItems,'kartitms');
            resolve(cartItems)
        })
    },

    /* ----------------------------- GET CART COUNT ----------------------------- */

    getCartCount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            if(cart){
                count = cart.products.length
            }
           
            resolve(count)
        })
    },

    /* ------------------------- Change Product Quantity ------------------------ */

    changeProductQuantity:(details)=>{
        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)
        
        return new Promise ((resolve,reject)=>{
            if(details.count == -1 && details.quantity == 1){
               
                db.get().collection(collection.CART_COLLECTION)
                .updateOne({_id:objectId(details.cart)},
                {
                    $pull:{products: {item:objectId(details.product)}}
                }).then((response)=>{
                    resolve({removeProduct:true})
                })
                
            }else{

                db.get().collection(collection.CART_COLLECTION)
                        .updateOne({_id:objectId(details.cart),'products.item':objectId(details.product)},
                        {
                            $inc:{'products.$.quantity':details.count} 
                        }
                        ).then((response)=>{
                           
                           
                            resolve({status:true})
                        })
                    }
                })
        
    },

    /* --------------------------- REMOVE CART PRODUCT -------------------------- */

    removeFromCart:(details)=>{
        
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CART_COLLECTION)
            .updateOne({_id:objectId(details.cart)},
            {
                $pull: {products: {item:objectId(details.product)}}
            }).then((response)=>{
               
                resolve(response)
            })

        })
    },

    /* --------------------------- GET WALLET BALANCE --------------------------- */

    getWallet:(userId)=>{

        return new Promise(async(resolve,reject)=>{
        let wallet =    await db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(userId)})
        resolve(wallet.wallet)
        console.log(wallet.wallet,'walletbalance');
        })
    },


    /* ------------------------------ GET SUB TOTAL ----------------------------- */

    getSubTotal:(details)=>{
        console.log(details,'kdts');
        return new Promise(async(resolve,reject)=>{
            let subTotal = await db.get().collection(collection.CART_COLLECTION)
            .aggregate([
                {

                    $match: {user:objectId(details.user)}
                },
                {
                    $unwind: '$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $match:{item:objectId(details.product)}
                },
                {
                    $lookup:{
                        from:collection.PRODUCTS,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        _id:0,
                        quantity:1,
                        product:{$arrayElemAt:['$product',0]}
                    }
                },
                {
                    $project:{
                        total:{$multiply:[{$toInt:'$quantity'},{$toInt:'$product.price'}]}
                    }
                }
            ]).toArray()
            console.log(subTotal);
            if(subTotal.length!= 0){

                resolve(subTotal[0].total)
            }else{
                resolve()
            }
        })
    },
    /* --------------------------- get cart sub total -------------------------- */
    getAllSubTotal: (userID) => {
        console.log(userID, 'jhgfds');
        return new Promise(async (resolve, reject) => {
            let cartSubTotal = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userID) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCTS,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        _id: 0, quantity: 1, product: { $arrayElemAt: ["$product", 0] }
                    }
                }, {
                    $project: {
                        total: { $multiply: [{ $toInt: '$quantity' }, { $toInt: '$product.price' }] }

                    }
                }
            ]).toArray()
            console.log('cartSubTotal');
            console.log(cartSubTotal);
            console.log('cartSubTotal');
            resolve(cartSubTotal)
        })
    },

    /* ------------------------------ TOTAL AMOUNT ------------------------------ */

    getTotalAmount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let total =await db.get().collection(collection.CART_COLLECTION)
            .aggregate([
                {
                    $match:{user:objectId(userId)}
                },
                {
                    $unwind: '$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCTS,
                        localField: 'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,
                        quantity:1,
                        product:{$arrayElemAt:['$product',0]}
                    }
                },
                {
                    $group:{
                        _id:null,
                        total:{$sum:{$multiply:[{$toInt:'$quantity'},{$toInt:'$product.price'}]}}
                    }
                }
            ]).toArray()
           
            if(total.length != 0){
                
                resolve(total[0].total)

            }else{
                resolve()

            }

        })
    },

    /* ------------------------------- PLACE ORDER ------------------------------ */

    placeOrder:(order,products,total, user)=>{
       
        return new Promise(async(resolve,reject)=>{
          
            let status = order['payment-method'] === 'COD'||order['payment-method'] === 'walletPay' ? 'placed': 'pending'
            let address = await db.get().collection(collection.ADDRESS_COLLECTION).findOne({_id:objectId(order.address)})
           
            let orderObj = {
                deliveryDetails:{
                    phone:address.address.phone,
                    email:address.address.email,
                    zip:address.address.zip,
                    state:address.address.state,
                    city:address.address.city,
                    streetAddress:address.address['street-address'],        
                    lastName:address.address['lastName'], 
                    firstName:address.address['firstName']
                    
                },
                userId:objectId(order.userId),
                paymentMethod:order['payment-method'],
                products:products,
                totalAmount:total,

                orderStatus:status,
                date: new Date()
            }
            if(order.coupon){
                orderObj.coupon={
                couponId:order.coupon,
                offer:order.couponOffer
                }
                db.get().collection(collection.COUPON_COLLECTION).updateOne({couponId:order.coupon},
                    {
                        $push:{users:objectId(order.userId)}
                    })
            }
            let balance 
            if(order.useWallet == '1'){
                console.log(order.useWallet,'orderwallet');
            if(user.wallet <= total){
                balance = 0
                orderObj.walletDiscount = order.walletDiscount
            }else{
                balance = user.wallet - total
                orderObj.walletDiscount = order.walletDiscount
            }
            let wallet = await db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(order.userId)},
                {
                    $set:{wallet:balance}
                })
                console.log('ended wi');
            }
            console.log(orderObj,'koorderobj');
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj)
            .then((response)=>{
            
                resolve(response.insertedId)
                 
            })
        })
        
    },

    /* -------------------------- GET CART PRODUCT LIST ------------------------- */

    getCartProductList:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            console.log(cart,'bbbbb');
            resolve(cart.products)

      
        })
    },


    /* ------------------------------ ORDER SUCCESS ----------------------------- */

    successOrder:(user)=>{

        return new Promise(async(resolve,reject)=>{
        
            db.get().collection(collection.CART_COLLECTION).deleteOne({user:objectId(user._id)}).then(()=>{
                resolve({status:true})
            })
        })
    },

    /* ------------------------------ ORDER FAILURE ----------------------------- */

    failedOrder:(orderId,user)=>{ 

        return new Promise(async(resolve,reject)=>{
            let order =await db.get().collection(collection.ORDER_COLLECTION).findOne({_id:objectId(orderId)})
                console.log(order,'neew oeder');
            if(order.coupon){
                console.log(order.coupon.couponId);
             let coupon = await  db.get().collection(collection.COUPON_COLLECTION).updateOne({couponId:order.coupon.couponId},
                    {
                        $pull:{users:objectId(order.userId)}
                    })
            }

            if(order.walletDiscount){
                console.log(order.walletDiscount);
                let wallet = await db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(order.userId)},
                {
                    $set:{wallet : user.wallet}
                })     
            }
            db.get().collection(collection.ORDER_COLLECTION).deleteOne({_id:objectId(orderId)}).then((response)=>{

                console.log('reached ffiii');
                resolve({status:true})
            })

        })

    },

    /* ----------------------------- GET USER ORDERS ---------------------------- */
    getUserOrders:(userId)=>{
        return new Promise(async(resolve,reject)=>{         

            let orders = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {userId: objectId(userId)}
                },
                {
                    $sort: {date:-1}
                },
                // {
                //     $unwind:'$products'
                // },      
                {
                    $project:{
                        _id:1,
                        deliveryDetails:1,
                        userId:1,
                        paymentMethod:1,
                        totalAmount:1,
                        status:1,
                        orderStatus:1,
                        products:1,
                        date:{$dateToString:{format:'%d-%m-%Y', date:'$date'}},
                    }
                }
            ]).toArray()
            console.log(orders,'ordersdd');
            resolve(orders)
    })
},

/* -------------------------- GET SINGLE ORDER DATA ------------------------- */

getOrder:(orderId)=>{
    return new Promise(async(resolve,reject)=>{
        let order = await db.get().collection(collection.ORDER_COLLECTION)
        .findOne({_id:objectId(orderId) })
        
        console.log(order,'ll;;pp');
        const date = order.date
        date.setDate(date.getDate() + 1)   
        console.log(date)
        const currentDate = new Date()
        if(date < currentDate){
            order.return = 'expired'
        }

        order.date = date.toDateString(order.date) 

        resolve(order)   
    })    
},


/* ------------------------ GET ORDER PRODUCT DETAILS ----------------------- */
getOrderProducts:(orderId)=>{
    return new Promise(async(resolve,reject)=>{

        let orderItems =await db.get().collection(collection.ORDER_COLLECTION)
        .aggregate([
            {
                $match:{_id:objectId(orderId)}
            },
            {
                $unwind: '$products'
            },
            {
                $project:{
                    item:'$products.item',
                    quantity: '$products.quantity',
                 
                }
            },
            {
                $lookup:{
                    from:collection.PRODUCTS,
                    localField: 'item',
                    foreignField:'_id',
                    as:'product'
                }
            },
            {
                $project:{
                   
                  
                    item:1,
                    quantity:1,
                    product:{$arrayElemAt:['$product',0]}
                }
            }
        ]).toArray()
       console.log(orderItems,'iiiiyyuu');
        resolve(orderItems)
})
},

/* ------------------------------ CANCEL ORDER ------------------------------ */

cancelOrder:(orderId,user)=>{
    return new Promise(async(resolve,reject)=>{
        let order = await db.get().collection(collection.ORDER_COLLECTION).findOne({_id:objectId(orderId)})

        if(order.paymentMethod != 'COD'){
            user.wallet = user.wallet +parseInt(order.totalAmount)
            console.log(user.wallet,'userwallet');
          let wallet =  await db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(order.userId)},
            {
                $set:{wallet:user.wallet}
            })
        }
        console.log('kkkkkkkk');
        db.get().collection(collection.ORDER_COLLECTION)
        .updateOne({_id:objectId(orderId)},
        {
            $set:{orderStatus:'Cancelled'}
        }).then(()=>{
            resolve({status:true})
        })
    })
},
 
/* ---------------------------- GENERATE RAZORPAY --------------------------- */

generateRazorpay:(orderId,total)=>{

    return new Promise((resolve,reject)=>{
        var options = {
            amount: total*100, 
            currency: "INR",
            receipt: ""+orderId
          };
          razorpayData.instance.orders.create(options, function(err, order) {
           
            resolve(order)
          });

          
    })
},
/* ----------------------------- VERIFY PAYMENT ----------------------------- */

verifyPayment:(details)=>{
    return new Promise((resolve,reject)=>{
       const crypto = require('crypto')
        let hmac = crypto.createHmac('sha256',razorpayData.keySecret);
        hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]']);
        hmac = hmac.digest('hex')

        if(hmac == details['payment[razorpay_signature]']){
            resolve()
        }else{
            reject()
        }
    })    
},

/* -------------------------- CHANGE PAYMENT STATUS ------------------------- */

changePaymentStatus:(orderId)=>{
    console.log(orderId,'oid');
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.ORDER_COLLECTION)
        .updateOne({_id:objectId(orderId)},
        {  $set:{ orderStatus:'placed' }}).then(()=>{

            resolve()
        })
    })
},


/* --------------------------------- PAYPAL --------------------------------- */
generatePaypal:(orderId,total)=>{

return new Promise((resolve, reject) => {
    const create_payment_json = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            return_url: "http://muebles.tk/cart/checkout/orderSuccess",
            cancel_url: "http://muebles.tk/cart/checkout/orderFailed"
        },
        "transactions": [
            {
                "item_list": {
                    "items": [ 
                        {
                            "name": orderId,
                            "sku": "001",
                            "price": total,
                            "currency": "USD",
                            "quantity": 1
                        }
                    ]
                },
                "amount": {
                    "currency": "USD",
                    "total": total
                },
                "description": "Thanks For Your Purchase"
            }
        ]
    };

    paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
            throw error;

        } else {
            resolve(payment);
            
        }
    });
});
},

/* ----------------------------- ADD NEW ADDRESS ---------------------------- */

addNewAddress:(userId,address)=>{
   
   
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.ADDRESS_COLLECTION)
        .insertOne({user:objectId(userId) , address:address}).then((data)=>{
            
            resolve({status:true})
        })
    })
},

/* ---------------------------- GET USER ADDRESS ---------------------------- */

getUserAddress:(userId)=>{ 
    return new Promise(async(resolve,reject)=>{
       let address = await db.get().collection(collection.ADDRESS_COLLECTION).find({user: objectId(userId)}).toArray()
     
       resolve(address)
    })
},

/* --------------------------- GET SINGLE ADDRESS --------------------------- */

getSingleAddress:(id)=>{

    return new Promise(async(resolve,reject)=>{
       await db.get().collection(collection.ADDRESS_COLLECTION).findOne({_id:objectId(id)}).then((data)=>{
        
        resolve(data)
       })
})
},

/* ----------------------------- UPDATE ADDRESS ----------------------------- */

updateAddress:(data,id)=>{
    console.log(data,'dta');
    console.log(id,'id');
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.ADDRESS_COLLECTION).updateOne({_id:objectId(id)},
        {$set:{address:data}}).then((response)=>{
            console.log(response,'rspns');
            resolve(response)
        })
    })
},


/* ----------------------------- DELETE ADDRESS ----------------------------- */

deleteAddress:(id)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.ADDRESS_COLLECTION).deleteOne({_id:objectId(id)})
        .then((response)=>{
            console.log(response,'rspn');
            resolve(response)
        })
    })
},

/* ---------------------------- ADD TO WISHLIST --------------------------- */

addToWishlist:(proId,userId)=>{
    return new Promise(async(resolve,reject)=>{
      let  response={}
        let userWishlist = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({user:objectId(userId)})
        if(userWishlist){
            console.log(userWishlist.products,'yu');
            let proExist = userWishlist.products.findIndex(product=> product == proId)
            console.log(proExist,'poexy');
            if(proExist != -1){
                response.status=false
                resolve(response)
            }else{
                db.get().collection(collection.WISHLIST_COLLECTION).updateOne({user:objectId(userId)},
                {
                    $push:{products:objectId(proId)}
                }).then((response)=>{
                    response.status=true
                    resolve(response)
                })
            }
        }else{
            let wishlistObj = {
                user:objectId(userId),
                products:[objectId(proId)]
            }
            db.get().collection(collection.WISHLIST_COLLECTION).insertOne(wishlistObj).then((response)=>{
                response.status=true
                resolve(response)
            })
        }
    })
},

/* -------------------------- GET WISHLIST PRODUCTS ------------------------- */

getWishlistProducts:(userId)=>{

    return new Promise(async(resolve,reject)=>{
      let products = await  db.get().collection(collection.WISHLIST_COLLECTION).aggregate([
            {
                $match:{user: objectId(userId)}
            },
            {
                $unwind:'$products'
            },
            {
                $lookup:{
                    from:collection.PRODUCTS,
                    localField:'products',
                    foreignField:'_id',
                    as:'product'
                }
            },
            {
                
                    $project:{
                        
                        product:{$arrayElemAt:['$product',0]}
                    }
                
            }
        ]).toArray()
        resolve(products)
    })

},

/* ---------------------- REMOVE PRODUCT FROM WISHLIST ---------------------- */
removeFromWishlist:(details)=>{
    console.log(details,'dtls');
return new Promise((resolve,reject)=>{

    db.get().collection(collection.WISHLIST_COLLECTION).updateOne({_id:objectId(details.wishlist)},
    {
        $pull:{products: objectId(details.product)}
    }).then((response)=>{
        console.log(response,'hi');
        resolve(response)
    })
})
},

/* ------------------------------ APPLY COUPON ------------------------------ */

applyCoupon:(details,userId,date)=>{
    return new Promise(async(resolve,reject)=>{
        let response={}
        let total ='';
        console.log(total,'iam bitch total');
        let coupon = await db.get().collection(collection.COUPON_COLLECTION).findOne({couponId:details.coupon, status:"true"})
       
        if(coupon){
            const expDate = new Date(coupon.endDate)
            response.couponData=coupon
            let user = await db.get().collection(collection.COUPON_COLLECTION).findOne({couponId:details.coupon,users: objectId(userId)})
                if(user){
                    response.used= true
                    response.usedMsg = 'Coupon Already Used'
                    resolve(response)
                }else{
                    
                if(date<=expDate){ 
                   response.dateValid=true 
                   console.log(typeof(details.total),'type');           
                   console.log(details.total);           
                     total = details.total             
                        resolve(response)        
                    if(total>=coupon.minAmount ){ 
                        response.verifyMinAmount = true
                        resolve(response)
                        if(total<=coupon.maxAmount ){
                            console.log(total); 
                            console.log('amountmax heloooo');
                            response.verifyMaxAmount = true
                            resolve(response)
                        }else{
                            response.maxAmountMsg = 'Your maximum purchase should be less than' + coupon.maxAmount
                            response.maxAmount = true                
                            resolve(response)
                        }
                    }else{
                        response.minAmountMsg = 'Your minimum purchase should be more than' + coupon.minAmount
                        response.minAmount = true
                        resolve(response)
                    }

                
                }else{
                    response.invalidDateMsg = 'Coupon Expired'
                    response.invalidDate = true
                    resolve(response)
                    console.log('invalid date'); 
                }

               
        }
        
    }else{
        response.invalidCoupon = true
        response.invalidCouponMsg =' Invalid Coupon '
        resolve(response)
    }

       if(response.dateValid && response.verifyMaxAmount && response.verifyMinAmount ){
                    response.verify = true
                   

                     db.get().collection(collection.CART_COLLECTION).updateOne({user:objectId(userId)},
                    {
                         $set:{coupon:objectId(coupon._id)}
                    })
                    resolve(response)
                   
                }

    })
},

/* ------------------------------ REMOVE COUPON ----------------------------- */

removeCoupon:(userId)=>{
    return new Promise(async(resolve,reject)=>{
        let coupon =await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)},
        {
            $unset: {
                coupon:''
            }
        })
        resolve(coupon)
    })
},


/* ---------------- VERIFY COUPON AND ADD COUPON TO COLLECTION --------------- */

verifyCoupon:(userId)=>{
    return new Promise(async(resolve,reject)=>{
        let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
        if(userCart.coupon){
            let couponData = await db.get().collection(collection.COUPON_COLLECTION).findOne({_id:objectId(userCart.coupon)})
            console.log(couponData,'couponData');  
            resolve(couponData)          
        }else{
            resolve(userCart)
        }
    })
},

/* --------------------------- GET LATEST PRODUCTS -------------------------- */

latestProducts:()=>{
    return new Promise(async(resolve,reject)=>{
        let products = await db.get().collection(collection.PRODUCTS).find().sort({_id:-1}).limit(6).toArray()
        resolve(products)
    })
},


/* ------------------------------ RETURN ORDER ------------------------------ */

 returnOrder:(order,user)=>{  
    return new Promise(async(resolve,reject)=>{ 
        let response ={}
        console.log(order.date);

        const date = new Date(order.date);
        date.setDate(date.getDate() + 1)   
        console.log(date)
        const currentDate = new Date()
        if(date < currentDate){
            console.log('ppppp00isihsdhashd');
            response.status = false
            resolve(response)
        }else{
            console.log('jjjkdusadgasyd67y');
            await  db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(order.orderId)},
        {
            $set:{orderStatus:'Returned'}
        }).then(async(response)=>{
            let amount = parseInt(order.amount)+user.wallet
          let data =await  db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(user._id)},
            {
                $set:{wallet:amount}
            })
        })
        console.log('hhhhhhhhhhhhhh');
        response.status = true
        response.value = "Returned"
        resolve(response)
        }
      

     
    })
},

/* ------------------------------- USE WALLET ------------------------------- */

useWallet:(total,user)=>{
    console.log(total.amount,'pppppppp');
    console.log(user,'oooooooooo');
    let response={}
   
    return new Promise(async(resolve,reject)=>{
        if(total.amount < user.wallet){
            response.amount = 0
            response.discount = total.amount
            response. wallet = user.wallet - total.amount
            
                    response.status=true
                    resolve(response)
                
        }else{
            response.amount = parseInt(total.amount) - parseInt(user.wallet)
            response.discount = parseInt(total.amount) -  response.amount 
            console.log(response.discount);
            response.wallet = 0
            response.status=true
            resolve(response) 
        }
    })
},


/* ------------------------------ REMOVE WALLET ----------------------------- */


removeWallet:(user,currentWallet)=>{
    return new Promise((resolve,reject)=>{
        console.log(user,'oottete');
        console.log(currentWallet,'gggg');
        let response = {}
        if(currentWallet.wallet ==0){
            response.total = parseInt(user.wallet) + parseInt(currentWallet.amount)
            response.wallet = user.wallet
        }else{
            console.log(user.wallet,'uwallet');
            console.log(currentWallet,'cwallet');
            response.total = parseInt(user.wallet) - parseInt(currentWallet.wallet)
            response.wallet = user.wallet
        }
        console.log(response,'responsetotal'); 
        resolve(response)
    })
},

    /* ------------------------------- GET COUPONS ------------------------------ */

getCoupons:()=>{
    return new Promise(async(resolve,reject)=>{
      let coupons =  await db.get().collection(collection.COUPON_COLLECTION).find().sort({endDate:-1}).toArray()
      console.log(coupons,'kjhk');
      resolve(coupons)
    })
},


/* --------------------------- GET PRODUCTS COUNT --------------------------- */

getProductsCount:()=>{
    return new Promise(async(resolve,reject)=>{
        let count =await db.get().collection(collection.PRODUCTS).count()
        resolve(count)
    })
},

/* --------------------------- PAGINATED PRODUCTS --------------------------- */

getProductlists:(startIndex,limit)=>{

    return new Promise(async(resolve,reject)=>{

        let index = ((startIndex-1)*limit)

        console.log(index,'lllllindex');

        let data = await db.get().collection(collection.PRODUCTS)
      .aggregate([
        {
          $lookup:
        {
          from: collection.CATEGORIES,
          localField:'category',
          foreignField:'_id',
          as:'category'

        }
      },
      {
        $project:
        {
         category:{$arrayElemAt:['$category',0]},
          Product:1,
          price:1,
          description:1,
          images:1,
          offerPercentage:1,
          orginalPrice:1
        }
      }, 
      {
        $skip: index
      },
      {
        $limit: limit
      }
      ]).toArray()

      resolve(data)
      console.log(data,'uuutrrt');

})


},

/* -------------------------- CONVERT USD TO RUPEES ------------------------- */

converter: (price) => {
   price= parseInt(price)
    console.log(typeof(price),'oprice');
    return new Promise((resolve, reject) => {
      let currencyConverter = new CC({
        from: "INR",
        to: "USD",
        amount: price,
        isDecimalComma: false,
      });
      currencyConverter.convert().then((response) => {
        resolve(response);
      });
    });
  },

  /* ----------------------------- CHANGE PASSWORD ---------------------------- */

  changePassword:(data,user)=>{
    return new Promise(async(resolve,reject)=>{
        let response={}
    let repeat = await bcrypt.compare(data.newPass,user.password)
    if(repeat){
        response.status = false
        response.message = 'You cant update with current password'
        resolve(response)
    }else{
    let status =   await bcrypt.compare(data.currentPass,user.password)

    if(status){
        let newPassword = await bcrypt.hash(data.newPass,10)
        response.result = await db.get().collection(collection.USER_COLLECTION).updateOne({_id: objectId(user._id)},
        {
            $set:{password:newPassword}
        })
        response.status=true
        resolve(response)
    }else{
        response.message ='Password doesnt match' 
        response.status=false
        resolve(response)
    }
}
    })
  },

  /* ------------------------------ PRICE FILTER ------------------------------ */

//   priceFilter:(data)=>{
    
//     return new Promise(async(resolve,reject)=>{
//         console.log(data,'dataaa pru');


//         let filter = await db.get().collection(collection.PRODUCTS)
//         .find({price:{$gte : data.min, $lte: data.max}}).sort({price:1}).toArray()

//         console.log(filter,'llfiltered');
//         resolve(filter)
//     })
//   } 
}