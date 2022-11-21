const db = require("../config/connection");
const collection = require("../config/collections");
const bcrypt = require("bcrypt");
const { response } = require("express");
const { promises } = require("fs-extra");
const { ObjectId } = require("mongodb");
const objectId = require("mongodb").ObjectId;

let categorylist

module.exports = {

////////////////////////Admin Login//////////////////////////// 

  adminLogin: (adminData) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      let admin = await db
        .get()
        .collection(collection.ADMIN_COLLECTION)
        .findOne({ email: adminData.email });
      if (admin) {
        await bcrypt
          .compare(adminData.password, admin.password)
          .then((status) => {
            console.log(status);
            if (status) {
              response.admin = admin;
              response.status = true;
              resolve(response);
            } else {
              response.message = "Login Failed! incorrect password";
              response.status = false;
              resolve(response);
            }
          });
      } else {
        response.message = "Login Failed! Email not found";
        response.status = false;
        resolve(response);
      }
    });
  },

  ////////////////////////Get All Users//////////////////////////// 

  getAllUsers: () => {
    return new Promise(async (resolve, reject) => {
      let userData = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .find()
        .toArray();
      resolve(userData);
    });
  },

  ////////////////////////Block Users//////////////////////////// 

  blockUser: (userId) => {
    console.log(userId);
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: objectId(userId) },
          {
            $set: {
              state: false,
            },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },

  ////////////////////////Unblock Users//////////////////////////// 

  unblockUser: (userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: objectId(userId) },
          {
            $set: {
              state: true,
            },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },


  ////////////////////////Add Categories//////////////////////////// 

  addCategory: (categoryData) => {  
    return new Promise(async (resolve, reject) => {
      let response = {};
      let category = await db
        .get()
        .collection(collection.CATEGORIES)
        .findOne({ category: categoryData.category });
      if (category) {
        response.message = "category already exists";
        response.status = true;
        resolve(response);
      } else {
        db.get()
          .collection(collection.CATEGORIES)
          .insertOne(categoryData)
          .then((data) => {
            response.message = "category added successfully";
            response.status = false;
            response.data = data;      
            resolve(response);
          });
      }
    });
  },

  ////////////////////////Get Categories//////////////////////////// 

  getCategories: () => {
    return new Promise(async (resolve, reject) => {
       categorylist = await db
        .get()
        .collection(collection.CATEGORIES) 
        .find()
        .toArray();
      resolve(categorylist);
    });
  },


  /* --------------------------- getCategoryDetails --------------------------- */

  getCategoryDetails: (id) =>{

    return new Promise((resolve, reject)=>{
      db.get().collection(collection.CATEGORIES).findOne({_id: objectId(id)})
      .then((categoryData)=>{
        resolve(categoryData)
      })
    })
  },

  /* ----------------------------- editCategories ----------------------------- */

  editCategory: (id,data) =>{
    return new Promise(async(resolve,reject)=>{
        db.get().collection(collection.CATEGORIES).updateOne(
          {_id: objectId(id)}, {$set:{
            category: data.category
          }}
        ).then((response)=>{

          resolve(response)
          
        })
    })
  },

  /* ------------------------------ Find Single Category ----------------------------- */
  findCategory:(id)=>{
    return new Promise(async(resolve,reject)=>{
      await db.get().collection(collection.CATEGORIES).findOne({_id:objectId(id)})
      .then((result)=>{
        resolve(result)
      })
    })
  },

  /* ---------------------------- Delete Categories --------------------------- */

  deleteCategory:(id)=>{
    return new Promise((resolve,reject)=>{
      db.get().collection(collection.CATEGORIES).deleteOne(
        {_id:objectId(id)}).then((result)=>{
          resolve(result)
         
        })
    })
  },

  /* ------------------------------ Add Products ------------------------------ */

  addProduct:(productData)=>{
    let response={}
    return new Promise(async (resolve,reject)=>{
    let product = await db.get().collection(collection.PRODUCTS).findOne({Product:productData.Product})
    if(product){
      response.message = 'Product already exists'
      response.status = false
      resolve(response)
    }else{

      if(productData.offerPercentage){
       let newprice=Math.round((productData.price)*((100-productData.offerPercentage)/100))
       productData.orginalPrice = productData.price
       productData.price = newprice
        console.log(productData,'pppdataaaaaaa');
        productData.category = objectId(productData.category)
        db.get().collection(collection.PRODUCTS).insertOne(productData)
        .then((data)=>{
          response.data = data
          response.status= true
         response.message='Product added successfully'
          resolve(response)
        })
      }
    else{
      productData.category = objectId(productData.category)
      db.get().collection(collection.PRODUCTS).insertOne(productData)
      .then((data)=>{
        response.data = data
        response.status= true
       response.message='Product added successfully'
        resolve(response)
      })
    }
     
    }
    })
  },  

  /* ------------------------------ Get Products ------------------------------ */

  getProducts:()=>{
    return new Promise(async(resolve,reject)=>{
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
          stock:1,
          description:1,
          images:1,
          offerPercentage:1,
          orginalPrice:1
        }
      }
      ]).toArray()
      resolve(data)
    })
  },

  /* --------------------------- GET product Details -------------------------- */


  getProductDetails:(id)=>{
    return new Promise(async(resolve,reject)=>{
      let productDetails =await db.get().collection(collection.PRODUCTS)
      .aggregate([
        {
          $lookup:
          {
            from: collection.CATEGORIES, 
            localField: 'category',
            foreignField:'_id',
            as:'category'
          }
        },
        {
          $match:
          {
            _id:objectId(id)
          }
        },
          {
            $project:
            {
              category:{$arrayElemAt:['$category',0]},
              Product:1,
              price:1,
              offerPercentage:1,
              orginalPrice:1,
              description:1,
              images:1
            }
          }
      ]).toArray()
     console.log(productDetails,'ppdetls');
        resolve(productDetails[0])
        
      
    })
  },

  /* ----------------------------- Update Products ---------------------------- */

  editProduct:(id,productDetails)=>{
    console.log(productDetails,'pd');
    return new Promise(async(resolve,reject)=>{
      let img = await db.get().collection(collection.PRODUCTS).findOne({_id:objectId(id)})
      // let category = await db.get().collection(collection.CATEGORIES).findOne({_id:objectId(productDetails.category)})
     console.log(img,'imag products');
      if(productDetails.images.length == 0){
        productDetails.images = img.images
      }
    
    
      console.log(productDetails,'ppdetails');
      let newprice
      if(productDetails.offerPercentage){
        if(productDetails.orginalPrice){
          newprice=Math.round((productDetails.orginalPrice)*((100-productDetails.offerPercentage)/100))
          productDetails.price = newprice  
        }else{
          newprice=Math.round((productDetails.price)*((100-productDetails.offerPercentage)/100))
          productDetails.orginalPrice = productDetails.price
          productDetails.price = newprice  
        }
            
         console.log(productDetails,'pppdataaaaaaa');
         productDetails.category = objectId(productDetails.category)
         db.get().collection(collection.PRODUCTS).updateOne({_id:objectId(id)},
         {
          $set:productDetails
         })
         
       }
     else{
      if(productDetails.orginalPrice > productDetails.price){
        productDetails.price = productDetails.orginalPrice
        productDetails.orginalPrice=''
      }
      productDetails.category = objectId(productDetails.category)
       db.get().collection(collection.PRODUCTS).updateOne({_id:objectId(id)},
       {
        $set:productDetails
       })
       .then((data)=>{
         response.data = data
         response.status= true
         resolve(response)
       })
     }
    })
  },

  /* ----------------------------- Delete Product ----------------------------- */

  deleteProduct:(id)=>{
    return new Promise((resolve,reject)=>{
      db.get().collection(collection.PRODUCTS).deleteOne({_id:objectId(id)})
      .then((response)=>{

        resolve(response)
      })
    })
  },

  /* ----------------------------- GET ALL ORDERS ----------------------------- */

  getAllOrders:()=>{
    return new Promise(async(resolve,reject)=>{
      let orders = await db.get().collection(collection.ORDER_COLLECTION).find().sort({date: -1}).toArray()
      console.log(orders,"orders");
      for(i=0;i<orders.length;i++){
        orders[i].date = orders[i].date.toLocaleDateString()
      }
      resolve(orders) 
    })
  },

  /* --------------------------- UPDATE ORDER STATUS -------------------------- */

  updateOrder:(orderId, orderStatus)=>{
    console.log(orderStatus,'jjsts');
    return new Promise((resolve,reject)=>{
      db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(orderId)},
      {$set :orderStatus},{upsert:true})
      .then((response)=>{
        resolve(response)
      })
    })
  },

  /* ------------------------------- ADD BANNER ------------------------------- */

  addBanner:(bannerData)=>{
    return new Promise((resolve,reject)=>{
      db.get().collection(collection.BANNER_COLLECTION).insertOne(bannerData).then((response)=>{
        resolve(response)
      })
    })
  },

  /* ----------------------------- GET ALL BANNERS ---------------------------- */

  getBanners:()=>{
    return new Promise((resolve,reject)=>{
      db.get().collection(collection.BANNER_COLLECTION).find().toArray()
      .then((datas)=>{
        resolve(datas)
      })
    })
  },

  /* ---------------------------- GET SINGLE BANNER --------------------------- */

  getBanner:(id)=>{
    return new Promise(async(resolve,reject)=>{
     let banner = await db.get().collection(collection.BANNER_COLLECTION).findOne({_id:objectId(id)})
     resolve(banner)
    })
  },

  /* ------------------------------- EDIT BANNER ------------------------------ */
  
  updateBanner:(id,data)=>{

    return new Promise(async(resolve,reject)=>{
      let img = await db.get().collection(collection.BANNER_COLLECTION).findOne({_id:objectId(id)})
      if(data.image.length == 0){
        data.image = img.image
      }

      db.get().collection(collection.BANNER_COLLECTION).updateOne(
        {_id: objectId(id)}, {$set:{
          bannerName:data.bannerName,
          smallHeader:data.smallHeader,
          bigHeader:data.bigHeader,
          image:data.image
        }}
      ).then((response)=>{
  
        resolve(response)
        
      })
  })
  },

  /* ----------------------------- GET YEARLY REPORT ---------------------------- */

  getYearlyChart:()=>{

    return new Promise(async(resolve,reject)=>{
      let yearData =await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $match:{orderStatus:'Delivered'}
        },     
        {
          $project: { date:1 , totalAmount:1}
         
        },
        {
          $group:{
            _id:{$dateToString: {format: "%Y", date: "$date"}},
            totalAmount:{$sum:"$totalAmount"},
            count: {$sum: 1}
          }
        },
        { 
          $sort: {_id:1}
        }
      ]).toArray()
      resolve(yearData)
    })
  },

  /* ---------------------------- GET MONTHLY CHART --------------------------- */
  getMonthlyChart:()=>{

    return new Promise(async(resolve,reject)=>{
     
      let sales = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $match:{ orderStatus:'Delivered'}
        },
        {
          $project:{
            date:{ $dateToString: { format: "%Y-%m", date: "$date"}},totalAmount:1,year:{ $dateToString: { format: "%Y", date: "$date"}}
          }
        },
        {
          $match:{ year: '2022'}
        },
        {
          $group:{
            _id:'$date',
            totalAmount:{$sum:"$totalAmount"}
          }
        },
        {
          $sort:{ _id:-1}
        }
        
            
      ]).toArray()
      console.log(sales,'salesr');
      resolve(sales)
    })
  },

  /* --------------------------- GET CATEGORY CHART --------------------------- */
  getCategoryChart:(year)=>{
    console.log(year);
    return new Promise(async(resolve,reject)=>{
      let catSale = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        { 
          $match:{orderStatus:'Delivered'}
        },
        { 
          $unwind: '$products'
        },
        { 
          $project:{
            item:'$products.item',
            quantity:'$products.quantity',
            totalAmount:1,
            date:{$year: '$date'}
          }
        },
        {
          $match : {date: year}
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
          category: { $arrayElemAt: ['$product.category',0]}, 
          price: { $arrayElemAt: ['$product.price',0]}, 
          quantity: 1,
          
         }
        },
        {
          $lookup:{
            from:collection.CATEGORIES,
            localField:'category',
            foreignField:'_id',
            as:'category'
          }
        },
        {
          $project:{
            category: {$arrayElemAt: ['$category.category',0]},
            quantity:1,
           price:1
          }
        },
        {
          $group:{
            _id:'$category',
            count:{ $sum:'$quantity'},
            totalAmount: { $sum: { $multiply: [{$toInt: '$quantity'}, { $toInt: '$price'}]}},

          }
        }
      ]).toArray()
      console.log(catSale,'kat');
      
      resolve(catSale)
    })
  },


  /* ------------------------ GET PAYMENT METHOD DATAS ------------------------ */

  getPaymentDatas:()=>{
    return new Promise(async(resolve,reject)=>{
      let paymentDatas = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $project:{
            paymentMethod:1,
            totalAmount:1
          }
        },
        {
          $group:{
            _id:'$paymentMethod',
            totalAmount:{$sum: '$totalAmount'},
            count:{$sum:1}
          }
        }
      ]).toArray()
      console.log(paymentDatas,'loooiii');
      resolve(paymentDatas)
    })
  },
  
  /* --------------------------- DAILY SALES REPORT --------------------------- */

  getDailyReport:(date)=>{
    console.log(date.day);
    return new Promise(async(resolve,reject)=>{
      let sales = await db.get().collection(collection.ORDER_COLLECTION)
      .aggregate([
        {
          $match:{
            orderStatus: {$nin : ['Cancelled']}}
        },
        {
          $unwind: '$products'
        },
        {
          $project:{
            totalAmount:1,
            date:1,
            orderStatus:1,
            paymentMethod: 1, 
            _id:1,
            item:'$products.item',
            quantity:'$products.quantity'
          }
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
            date:{ $dateToString: { format: "%Y-%m-%d", date: "$date"}},
             totalAmount: 1, 
             paymentMethod: 1, 
             item: 1,
              product: { $arrayElemAt: ['$product',0]}, 
              quantity: 1, 
              _id:1
          }
        },
        {
          $match : {date: date.day}
        },
        {
          $group: {
            _id: '$item',
            quantity: {$sum: '$quantity'},
            totalAmount: { $sum: { $multiply: [{$toInt: '$quantity'}, { $toInt: '$product.price'}]}},
            name:{ $first: "$product.Product"},
            date: { $first: "$date"},
            price: {$first: "$product.price"},
            paymentMethod:{$first: "$paymentMethod"}
          }
        }
        
      ]).toArray()
      console.log(sales,'salesx');
      resolve(sales)
    })
    },

      /* --------------------------- MONTHLY SALE REPORT -------------------------- */

      getMonthlyReport:(month)=>{
        console.log(month.month);
        return new Promise(async(resolve,reject)=>{
          let monthly = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
            {
              $match: {orderStatus:'Delivered'}
            },
            {
              $project:{
                date: {$dateToString:{format:'%Y-%m',date:'$date'}},
                day: {$dateToString:{format: '%d-%m-%Y',date:'$date'}},
                totalAmount:1,
              
              }
            },
            {
              $match: {date:month.month}
            },
            {
              $group:{
                _id:'$day',
                totalAmount:{$sum: '$totalAmount'},
                count: {$sum: 1}
              }
            }
         
          ]).toArray()
          console.log(monthly);
          resolve(monthly)
        })
      },

      /* ---------------------------- GET YEARLY REPORT --------------------------- */

      getYearlyReport:(year)=>{
        console.log(year.year);
        return new Promise(async(resolve,reject)=>{
          let yearly = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
            {
              $match:{orderStatus:'Delivered'}
            },
            {
              $project:{
                saleYear:{$dateToString:{format:'%Y', date:'$date'}},
                month:{$dateToString:{format:'%m-%Y', date:'$date'}},
                totalAmount:1
              }
            },
            {
              $match: {saleYear:year.year}
            },
            {
              $group:{
                _id:'$month',
                totalAmount:{$sum:'$totalAmount'},
                count:{$sum:1}
              }
            }
          ]).toArray()
          console.log(yearly,'yrly');
          resolve(yearly)
        })
      },

      /* ----------------------- GET TOTAL SALES OF AN YEAR ----------------------- */

      getTotalOrders:(year)=>{
        // year = toString(year)
        console.log(year);
        return new Promise(async(resolve,reject)=>{
          let order = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
          
            {
              $project:{
                saleYear:{$year:'$date'},
                totalAmount:1,
                orderStatus:1
              }
            },
            {
              $match:{saleYear: year}
            },
            {
              $group:{
                _id:'$orderStatus',
                totalAmount:{$sum: '$totalAmount'},
                count:{$sum:1}
              }
            }
                  
          ]).toArray()
         console.log(order,'odd');
          resolve(order)
        })
      },

      /* ----------------------------- ADD NEW COUPON ----------------------------- */

      addCoupon:(data)=>{
        console.log(data,'cdata');
        return new Promise(async(resolve,reject)=>{
          let response ={}
          let coupon = await db.get().collection(collection.COUPON_COLLECTION).findOne({couponId:data.couponId})
          console.log(coupon);
          if(coupon){
            response.status = false
            response.message='Coupon Already Exists'
            resolve(response)
          }else{
            data.status="true"
            db.get().collection(collection.COUPON_COLLECTION).insertOne(data)
            .then((result)=>{
              response.message='Coupon Added Successfully'
              response.data = result
              response.status = true
              resolve(response)
            })
          }
        })
      },


      /* ------------------------------ VIEW COUPONS ------------------------------ */

 viewCoupons:()=>{
  return new Promise(async(resolve,reject)=>{
    let coupons = await db.get().collection(collection.COUPON_COLLECTION).find().toArray()
    resolve(coupons)
  })
 },

 /* ------------------------------- GET COUPON ------------------------------- */

 getCoupon:(cId)=>{

  return new Promise(async(resolve,reject)=>{
    let coupon = await db.get().collection(collection.COUPON_COLLECTION).findOne({_id:objectId(cId)})
    resolve(coupon)
  })
 },

    /* ----------------------------- DELETE COUPONS ----------------------------- */

 updateCoupon:(data,couponId)=>{
  return new Promise((resolve,reject)=>{
    db.get().collection(collection.COUPON_COLLECTION).updateOne({_id:objectId(couponId)},
    {
      $set:data
    })
    .then((response)=>{
      resolve(response)
    })
  })
 },

 /* --------------------------- UPDATE OFFER PRICE --------------------------- */

 updateOffer:(pId, offerPrice, offerPerc)=>{

  return new Promise(async(resolve,reject)=>{
    let productData = await db.get().collection(collection.PRODUCTS).findOne({_id:objectId(pId)},{price:1})
    let price
    if(offerPerc <= 0){
      if(productData.orginalPrice){
        offerPrice = productData.originalPrice
        offerPerc=''
        price=''
      }else{
        offerPrice = productData.price
        offerPerc=''
        price=''
      }
      
    }else{
    if(productData.orginalPrice){
      price = productData.orginalPrice
    }else{
      price = productData.price
    } 
  }
    let product = await db.get().collection(collection.PRODUCTS).updateOne({_id:objectId(pId) },
    {
      $set:{originalPrice:price,price:""+offerPrice, offerPercentage: offerPerc}
    })
    resolve({status:true})
  })
 },

}
