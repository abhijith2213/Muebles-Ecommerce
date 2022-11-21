const { response } = require("express");
const express = require("express");
const router = express.Router();
const session = require("express-session");
const chart = require('chart.js')
const adminHelpers = require("../helpers/admin-helpers");
const productHelpers = require('../helpers/user-helpers');
const multer = require('../config/imageUpload'); 
const { Db } = require("mongodb");

/* ---------------------------- GLOBAL VARIABLES ---------------------------- */

let adminheader = true;
let admin;

/* ------------------------------ session check ----------------------------- */
const verifyLogin=(req,res,next)=>{
  if(req.session.adminloggedIn){
    next()
  }else{
    res.redirect('/admin/admin_signin')
  }
}

  /* ----------------------------- get admin login ---------------------------- */

router.get("/admin_signin", (req, res) => {
  res.render("admin/admin-login", {
    title: "SignIn",
    signinErr: req.session.loginErr,
  });
  req.session.loginErr=false
});

 /* ---------------------------- post admin login ---------------------------- */

router.post("/admin_signin", (req, res,next) => {
  adminHelpers.adminLogin(req.body).then((response) => {
    if (response.status) {
      req.session.adminloggedIn = true;
      req.session.admin = response.admin;
      res.redirect("/admin");
    } else {  
      req.session.loginErr = response.message;
      res.redirect("/admin/admin_signin");
    }
  });
});

 /* -------------------------- GET admin dashboard. -------------------------- */

router.get("/",verifyLogin,async function(req, res, next) {
   admin = req.session.admin; 

    let year = new Date().getFullYear()
    
    let chartData =await adminHelpers.getYearlyChart()

    let monthData = await adminHelpers.getMonthlyChart()

    let categorySale = await adminHelpers.getCategoryChart(year)
     
    let catAmount =0
    let catCount =0
    for( let i =0; i<categorySale.length; i++){
      catAmount = catAmount+categorySale[i].totalAmount
      catCount = catCount+categorySale[i].count
    }

    let totalOrders = await adminHelpers.getTotalOrders(year)
  
    let ordersData={}
    ordersData.amount=0
    ordersData.count =0
    for(let i=0; i<totalOrders.length; i++){  
      ordersData.amount = ordersData.amount+ totalOrders[i].totalAmount
      ordersData.count = ordersData.count+ totalOrders[i].count
    }
    console.log(totalOrders,'ttordersss');
    
    let paymentsData =await adminHelpers.getPaymentDatas()
  res.render("admin/index", { title: "Home", adminheader, admin ,chartData, monthData, categorySale,
   totalOrders, catAmount,catCount, ordersData, paymentsData});
});

 /* ------------------------------ GET user info ----------------------------- */

router.get("/userdata",verifyLogin, (req, res) => {
  adminHelpers.getAllUsers().then((userData) => {
    res.render("admin/userdata", { title: "userdata", adminheader, userData ,admin});
  });
});

 /* ------------------------------- block user ------------------------------- */

router.get("/block-user/:id",verifyLogin, async (req, res) => {
  let user = await adminHelpers.blockUser(req.params.id);
  if (req.session.adminloggedIn) {
   
    res.redirect("/admin/userdata");
  } else res.redirect("/admin/userdata");
});

 /* ------------------------------ unblock user ------------------------------ */

router.get("/unblock-user/:id",verifyLogin, async (req, res) => {
  let user = await adminHelpers.unblockUser(req.params.id);
  res.redirect("/admin/userdata");
});

 /* ------------------------------ admin logout ------------------------------ */

router.get("/logout", (req, res) => {
  req.session.destroy()
  res.redirect("/admin/admin_signin");
});

 /* ----------------------------- get categories ----------------------------- */

router.get("/categories",verifyLogin, (req, res) => {

  adminHelpers.getCategories().then((categories) => {
    res.render("admin/categories", {title: "categories", adminheader, categories ,admin });
    
  });
});

 /* ---------------------------- get add-category ---------------------------- */

router.get("/categories/add-category",verifyLogin, (req, res) => {
  res.render("admin/add-category", {
    title: "categories",
    adminheader,admin,
    resErr: req.session.addCategoryErr,
    resMsg: req.session.addCategorymsg});

  req.session.addCategoryErr = false
  req.session.addCategorymsg = false
});

 /* ---------------------------- post add-category --------------------------- */

router.post("/categories/add-category",multer.upload.single('image'), (req, res,next) => {
 req.body.image = req.file.filename
  adminHelpers.addCategory(req.body).then((response) => {
    if (response.status) {
      req.session.addCategoryErr = response.message;
      res.redirect("/admin/categories/add-category");
    } else {
      req.session.addCategorymsg = response.message;
      res.redirect("/admin/categories/add-category");
    }
  })
  
});

/* -----------------------------GET edit categories ---------------------------- */

router.get('/categories/edit-category/:id',verifyLogin, async(req,res)=>{
let msg= req.session.msg
  let category = await adminHelpers.getCategoryDetails(req.params.id)
res.render('admin/edit-category',{title: "categories",adminheader,category,msg,admin})
req.session.msg=false
 
})

/* -------------------------- POST edit categories -------------------------- */

router.post('/categories/edit-category/:id',(req,res)=>{

    adminHelpers.editCategory(req.params.id,req.body).then((response)=>{
        res.redirect('/admin/categories')     
    })
})

/* ---------------------------- Delete Categories --------------------------- */

router.get('/categories/delete-category/:id',verifyLogin,(req,res)=>{

  adminHelpers.deleteCategory(req.params.id).then((response)=>{
    res.redirect('/admin/categories')
  })
})

/* ---------------------------- GET add products ---------------------------- */

router.get('/products/add-product',verifyLogin,(req,res)=>{
  adminHelpers.getCategories().then((cat)=>{
    res.render('admin/add-product', {title: "products",adminheader,admin, cat,Err: req.session.productErr, Msg: req.session.productMsg})
    req.session.productMsg= false
    req.session.productErr= false
  })
});

/* ---------------------------- POST add products --------------------------- */

router.post('/products/add-product',multer.upload.array('images',3),(req,res)=>{
  let filename = req.files.map((file)=>{
    return file.filename
  })
  req.body.images= filename
  adminHelpers.addProduct(req.body).then((response)=>{
   let image = req.files.image
   if(response.status){
     req.session.productMsg= response.message
    
    res.redirect('/admin/products/add-product')
   }else{
    req.session.productErr = response.message
   
    res.redirect('/admin/products/add-product')
   }
  })
 
 
})

/* ------------------------------ GET ALL Products ------------------------------ */

router.get('/products',verifyLogin,(req,res)=>{
  adminHelpers.getProducts(req.body).then((products)=>{
    res.render('admin/products',{title: "products",adminheader,products,admin})
  })
})


/* ---------------------------- GET edit Product ---------------------------- */

router.get('/products/edit-product/:id',verifyLogin, (req,res)=>{
  adminHelpers.getProductDetails(req.params.id).then((productss)=>{
    adminHelpers.getCategories().then((category)=>{
      // adminHelpers.findCategory(product.category).then((catdata)=>{
        //   console.log(catdata,'dsata');
        console.log(productss,'opi');
        res.render('admin/edit-product',{title: "products",adminheader,productss,category,admin})
      })
    })
  })
// })

/* ---------------------------- POST edit Product --------------------------- */
router.post('/products/edit-product/:id',multer.upload.array('images',3),(req,res)=>{
  let filename = req.files.map(function(file){
    return file.filename
  })
  req.body.images= filename
console.log(req.body,'rbody');
  adminHelpers.editProduct(req.params.id, req.body).then((uproduct)=>{

  })
  res.redirect('/admin/products')
})

/* --------------------------- GET Delete Products -------------------------- */

router.get('/products/delete-product/:id',verifyLogin,(req,res)=>{
  adminHelpers.deleteProduct(req.params.id).then((response)=>{
    res.redirect('/admin/products')
  })
})


/* ----------------------------- GET VIEW ORDERS ---------------------------- */

router.get('/viewOrders',verifyLogin,async(req,res)=>{
 let orders= await adminHelpers.getAllOrders()
  res.render('admin/viewOrders',{title:'ORDERS',admin,adminheader , orders})
})

/* ----------------------------- GET EDIT ORDER ----------------------------- */

router.get('/viewOrders/edit/:id',verifyLogin,async(req,res)=>{
    let order = await productHelpers.getOrder(req.params.id)
    let orderData = await productHelpers.getOrderProducts(req.params.id)
   res.render('admin/edit-order',{title:'ORDERS',admin,adminheader, order, orderData })
}) 

/* ----------------------------- POST EDIT ORDER ---------------------------- */

router.post('/viewOrders/edit/:id',(req,res)=>{
  console.log('hyyy');
  console.log(req.body,'body');
  adminHelpers.updateOrder(req.params.id,req.body).then((response)=>{
    res.redirect('/admin/viewOrders')
  })
})

/* ----------------------------- GET VIEW BANNER ---------------------------- */

router.get('/view-banners',verifyLogin,(req,res)=>{
  adminHelpers.getBanners().then((datas)=>{
    console.log(datas);
    res.render('admin/view-banner',{title: "banners",adminheader,admin , datas})
  })
})

module.exports = router;

/* ----------------------------- GET ADD BANNER ----------------------------- */

router.get('/add-banner',verifyLogin,(req,res)=>{
 let msg = req.session.message
  res.render('admin/add-banner',{adminheader,admin, msg})
  req.session.message= false
})

/* ---------------------------- POST ADD BANNER ---------------------------- */

router.post('/add-banner',multer.upload.single('image'),(req,res)=>{
  req.body.image = req.file.filename
  console.log(req.body,'nbody');
  adminHelpers.addBanner(req.body).then((response)=>{
    req.session.message='Banner added successfully'
    res.redirect('back')
  })
})

/* ----------------------------- GET EDIT BANNER ---------------------------- */

router.get('/edit-banner/:id',verifyLogin,(req,res)=>{
  adminHelpers.getBanner(req.params.id).then((data)=>{
    res.render('admin/edit-banner',{adminheader,data})
  })
})  

/* ---------------------------- POST EDIT BANNER ---------------------------- */

router.post('/edit-banner/:id',multer.upload.single('image'),(req,res)=>{
  req.body.image = req.file.filename
  adminHelpers.updateBanner(req.params.id,req.body).then((response)=>{
    res.redirect('/admin/view-banners')
  })
})



/* --------------------------- POST DAILY REPORTS --------------------------- */

router.post('/daily-report',async(req,res)=>{
  const date = req.body
  console.log(date);
  let daily = await adminHelpers.getDailyReport(date)

  let sumTotal = 0
  for(var i=0;i<daily.length;i++){
    sumTotal = sumTotal+daily[i].totalAmount
  }
  console.log(sumTotal,'sttl');
  res.render('admin/reports',{adminheader,admin, daily,sumTotal})
})

/* --------------------------- POST MONTHLY REPORT -------------------------- */

router.post('/monthly-report',async(req,res)=>{
  const month = req.body
  console.log(month,'mth');
  let monthly = await adminHelpers.getMonthlyReport(month)

  let totalCount=0;
  for(var i=0;i<monthly.length;i++){
    totalCount=totalCount+monthly[i].count
  }
  
  let Total = 0;
  for(var i=0;i<monthly.length;i++){
      Total = Total+monthly[i].totalAmount
  }

  res.render('admin/reports',{adminheader,admin,monthly, Total, totalCount})
})

/* --------------------------- POST YEARLY REPORT --------------------------- */
router.post('/yearly-report',async(req,res)=>{
  console.log(req.body);
  let yearly = await adminHelpers.getYearlyReport(req.body)

  let totalSale =0
  for(var i=0 ; i< yearly.length; i++){
    totalSale = totalSale+yearly[i].count
  }

  let yearAmount = 0
  for(var i=0; i<yearly.length;i++){
    yearAmount = yearAmount+yearly[i].totalAmount
  }
  res.render('admin/reports',{adminheader, admin, yearly,totalSale, yearAmount })
})

/* ----------------------------- GET ADD COUPON ----------------------------- */

router.get('/add-coupons',verifyLogin,(req,res)=>{
  resMsg = req.session.msg
  resErr = req.session.err
  res.render('admin/add-coupon',{adminheader,admin, resMsg, resErr})
  req.session.msg = false
  req.session.err = false
})

/* ---------------------------- POST ADD CATEGORY --------------------------- */

router.post('/add-coupons',(req,res)=>{
  adminHelpers.addCoupon(req.body).then((response)=>{
    if(response.status){
      req.session.msg= response.message
    }else{
      req.session.err = response.message
    }
    res.redirect('back')
  })
})

/* ------------------------------ VIEW COUPONS ------------------------------ */

router.get('/view-coupons',verifyLogin,(req,res)=>{
  adminHelpers.viewCoupons().then((coupons)=>{
    res.render('admin/viewcoupons',{adminheader,admin, coupons})
  })
})

/* -----------------------------GET UPDATE COUPONS ----------------------------- */

router.get('/coupons/update/:id',verifyLogin,async(req,res)=>{
  let coupon = await adminHelpers.getCoupon(req.params.id)
  console.log(coupon);
  res.render('admin/updateCoupon',{adminheader,admin, coupon})
})

/* --------------------------- POST UPDATE COUPON --------------------------- */

router.post('/coupons/update/:id',(req,res)=>{
console.log(req.params.id);
adminHelpers.updateCoupon(req.body,req.params.id).then((response)=>{
  res.redirect('/admin/view-coupons')
})
})

/* -------------------------------- GET CATEGORY OFFER ------------------------------- */

router.get('/add-newoffers',verifyLogin,async(req,res)=>{
  let categories =await  adminHelpers.getCategories()
  console.log(categories,'catcatcat');
  let msg = req.session.offerMsg
  res.render('admin/offers',{adminheader,admin, categories, msg})
  req.session.offerMsg=''
})
 

/* --------------------------- POST ADD CATEGORY OFFER -------------------------- */


router.post('/add-newoffers',async(req,res)=>{
  console.log(req.body,'req.body');
  let offer = req.body.Offer
  if(req.body.category !=""){
    let products = await productHelpers.getCategoryProduct(req.body.category)
      let newprice;
      let updateOffer;
    for(var i=0; i< products.length; i++){
      if(products[i].orginalPrice){
        newprice=Math.round((products[i].orginalPrice)*((100-offer)/100))
      }else{
        newprice=Math.round((products[i].price)*((100-offer)/100))
      }           
       updateOffer = await adminHelpers.updateOffer(products[i]._id,newprice, offer)
    }
    if(updateOffer){
      req.session.offerMsg = 'Offer Succesfully added'
    }

  }
  res.redirect('back')
})

