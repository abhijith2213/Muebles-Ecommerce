const session = require("express-session");
const express = require("express");
const router = express.Router();

const userHelpers = require("../helpers/user-helpers");
const productHelpers = require("../helpers/admin-helpers");


const { response } = require('express');
const { useWallet } = require("../helpers/user-helpers");
const { Db } = require("mongodb");


/* ---------------------------- COMMON VARIABLES ---------------------------- */

let userheader = true;
let userlink = true;
let userProfile = true;
let user;
let cartCount;

/* --------------------------- Session middleware --------------------------- */
const verifyLogin = async (req, res, next) => {
  if (req.session.loggedIn) {
    next();
  } else {
    res.redirect("/signin");    
  }
};

/* -------------------------- CART COUNT MIDDLEWARE ------------------------- */

const getCartCount = async (req, res, next) => {
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
    console.log(cartCount, 'cartcountmiddle');
    next()
  } else {
    next()
  }
}



/* ----------------------------- GET home page. ----------------------------- */

router.get("/", getCartCount, async (req, res, next) => {
  user = req.session.user;

  console.log('jiiiii');
  console.log(cartCount, 'ooppp');
  productHelpers.getCategories().then(async (categories) => {
    let banner = await productHelpers.getBanners()

    let latest = await userHelpers.latestProducts()

    res.render("user/index", { title: "Home", user, userheader, home: true, userlink, categories, cartCount, banner, latest });
  });
});

/* -------------------------------- get login ------------------------------- */

router.get("/signin", (req, res, next) => {
  res.render("user/login", {
    title: "Login",
    loginErr: req.session.loginErr,
    userlink,
  });
  req.session.loginErr = false;
});


/* ------------------------------- post login ------------------------------- */

router.post("/signin", (req, res, next) => {
  console.log(req.body, 'jju');
  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.loggedIn = true;
      req.session.user = response.user;
      res.redirect("/");
    } else {
      req.session.loginErr = response.message;
      res.redirect("/signin");
    }
  });
});

/* --------------------------GET otp number-side login ------------------------- */

router.get("/otp_login", (req, res) => {
  let loginErr = req.session.loginErr;
  res.render("user/login", {
    title: "Login",
    otpLogin: true,
    userlink,
    loginErr,
  });
  req.session.loginErr = false;
});

/* ----------------------- POST otp number-side login ----------------------- */
let signupData;
router.post("/user_otp", (req, res) => {
  userHelpers.otpLogin(req.body).then((response) => {
    if (response.status) {
      signupData = response.user;
      res.redirect("/user-otpLogin");
    } else {
      req.session.loginErr = response.message;
      res.redirect("/user_otp");
    }
  });
});



/* --------------------------- GET otp submit form -------------------------- */

router.get("/user-otpLogin", (req, res) => {
  res.render("user/otp", { title: "Login", userlink });
});

/* -------------------------- POST otp submit form -------------------------- */

router.post("/user_otpSignin", (req, res) => {
  console.log("otp:", req.body);
  userHelpers.otp(req.body, signupData).then((response) => {
    if (response.status) {
      req.session.loggedIn = true;
      req.session.user = signupData;
      res.redirect("/");
    } else {
      res.redirect("/user-otpLogin");
    }
  });
  // res.redirect('/')
});

/* ------------------------------- get signup ------------------------------- */

router.get("/signup", (req, res, next) => {
  signupErr = req.session.signupErr;
  res.render("user/signup", { title: "Register", userlink, signupErr });
  req.session.signupErr = false;
});

router.get('/signup/:id', (req, res) => {
  let referal = req.params.id
  signupErr = req.session.signupErr;
  res.render("user/signup", { title: "Register", userlink, signupErr, referal });
  req.session.signupErr = false;
})


/* ------------------------------- post signup ------------------------------ */

router.post("/signup", (req, res) => {
  userHelpers.doSignup(req.body).then((response) => {
    if (response.status) {
      req.session.signupErr = response.message;
      res.redirect("/signup");
    } else {
      res.redirect("/signin");
    }
  });
});


/* ------------------------------- get Logout ------------------------------- */

router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

/* ---------------------------- GET ALL PRODUCTS ---------------------------- */

router.get("/all-products", getCartCount, async (req, res) => {
  console.log(req.query, 'query d');
  let count = await userHelpers.getProductsCount()
  let page = Math.round(count / 9)
  let pageNum = []
  for (i = 0; i < page; i++) {
    pageNum[i] = i + 1
  }

  let categories = await productHelpers.getCategories();

  let products = await productHelpers.getProducts();


    res.render("user/allProducts", {
      userlink,
      userheader,
      products,
      categories,
      user,
      cartCount,
      pageNum
    });

});
/* --------------------------- GET Product details -------------------------- */
router.get("/product-details/:id", getCartCount, async (req, res) => {


  productHelpers.getProductDetails(req.params.id).then(async (product) => {

    let catProducts = await userHelpers.getCategoryProduct(product.category._id)

    let categories = await productHelpers.getCategories();
    res.render("user/productdetails", { product, userlink, userheader, user, cartCount, catProducts, categories });
  });
});

/* --------------------- GET PRODUCTS BASED ON CATEGORY --------------------- */
router.get("/categoryproduct/:id", getCartCount, async (req, res) => {

  userHelpers.getCategoryProduct(req.params.id).then(async (product) => {
    let categories = await productHelpers.getCategories();
    res.render("user/categoryproduct", {
      title: "SHOP",
      userlink,
      user,
      userheader,
      product,
      categories,
      cartCount,
    });
  });
});

/* ------------------------------ GET ABOUT US ------------------------------ */

router.get('/aboutUs', verifyLogin, getCartCount, async (req, res) => {
  let categories = await productHelpers.getCategories();
  res.render('user/aboutUs', { user, userheader, userlink, categories, cartCount })
})


/* ----------------------------- GET CONTACT US ----------------------------- */

router.get('/contactUs', verifyLogin, getCartCount, async (req, res) => {
  let categories = await productHelpers.getCategories();
  res.render('user/contactUs', { user, userheader, userlink, categories, cartCount })
})

/* -------------------------------- GET cart -------------------------------- */

router.get("/cart", verifyLogin, getCartCount, async (req, res) => {
  total = 0;
  let subtotal;

  let products = await userHelpers.getCartProducts(user._id);
  subtotal = await userHelpers.getAllSubTotal(user._id);

  for (var i = 0; i < products.length; i++) {
    products[i].subTotal = subtotal[i].total;
  }

  if (cartCount > 0) {
    total = await userHelpers.getTotalAmount(user._id);
  }
  let categories = await productHelpers.getCategories();
  res.render("user/cart", {
    title: "CART", userlink, userheader, user, products, cartCount, total, categories
  });
});

/* ----------------------------- GET Add To Cart ---------------------------- */
router.get("/cart/add-to-Cart/:id", verifyLogin, (req, res) => {
  userHelpers.addToCart(req.params.id, user._id).then((response) => {
    res.json(response);
  });
});

/* ------------------------- Change Product Quantity ------------------------ */

router.post("/change-product-quantity", (req, res, next) => {
  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    response.subTotal = await userHelpers.getSubTotal(req.body);
    response.total = await userHelpers.getTotalAmount(req.body.user);

    res.json(response);
  });
});

/* --------------------------- REMOVE CART PRODUCT -------------------------- */

router.post("/cart/removeProduct", (req, res) => {
  userHelpers.removeFromCart(req.body).then((response) => {
    res.json(response);
  });
});

/* ---------------------------- GET CHECKOUT PAGE --------------------------- */

router.get("/cart/checkout", verifyLogin, getCartCount, async (req, res) => {

  let address = await userHelpers.getUserAddress(user._id)
  total = await userHelpers.getTotalAmount(user._id);
  let categories = await productHelpers.getCategories();
  let wallet = await userHelpers.getWallet(user._id)
  user.wallet = wallet
  if (total > 0) {

    res.render("user/checkout", { title: "CHECKOUT", userheader, userlink, 
    address, total, user, categories, cartCount });
  } else {
    res.redirect('back')
  }

});

/* ------------------------------ POST CHECKOUT ----------------------------- */

router.post("/cart/checkout", verifyLogin, async (req, res) => {
  console.log(req.body, 'req.body');
  let totalPrice
  let products = await userHelpers.getCartProductList(req.body.userId);
  let verifyCoupon = await userHelpers.verifyCoupon(user._id)
  if (verifyCoupon.couponId == req.body.coupon) {
    totalPrice = req.body.total
    //   let discountAmount = (req.body.total * parseInt(verifyCoupon.offer))/100
    //  totalPrice =Math.round(req.body.total- discountAmount)
    req.body.couponOffer = verifyCoupon.offer

    if (req.body.useWallet == '1') {
      totalPrice = req.body.payable

    }
    console.log(totalPrice, 'amount yop');
  } else {
    totalPrice = await userHelpers.getTotalAmount(req.body.userId);
  }
  console.log(totalPrice, 'heloo kiiiii');
  console.log(typeof(totalPrice), 'heloo kiiiiitype');
  userHelpers.placeOrder(req.body, products, totalPrice, user).then(async (orderId) => {
    req.session.order = orderId
    if (req.body["payment-method"] === "COD") {

      res.json({ codSuccess: true });

    } else if (req.body["payment-method"] == "razorpay-online") {
      if (req.body.useWallet == '1') {
        totalPrice = req.body.payable
        console.log(totalPrice, 'pppricerr');
      }
      userHelpers.generateRazorpay(orderId, totalPrice).then((response) => {
        response.razorpay = true
        res.json(response);

      });
    } else if (req.body["payment-method"] == "paypal-online") {

      if (useWallet == '1') {
        totalPrice = req.body.payable
      }
      let price = await userHelpers.converter(totalPrice)
      totalPrice = parseInt(price);
      console.log(totalPrice, 'op');
      userHelpers.generatePaypal(orderId, totalPrice).then((response) => {

        response.paypal = true

        res.json(response)

      })
    } else if (req.body["payment-method"] == "walletPay") {
      response.wallet = true
      res.json(response)
    }
  });
});

/* ---------------------------- GET ORDER SUCCESS --------------------------- */

router.get('/cart/checkout/orderSuccess', verifyLogin, getCartCount, async (req, res) => {
  let categories = await productHelpers.getCategories();
  let orderId = await userHelpers.changePaymentStatus(req.session.order)
  await userHelpers.successOrder(user).then((response) => {
    req.session.order = ''
    console.log(req.session, 'kkordersession');
    res.render('user/orderSuccess', { userheader, userlink, user, categories, cartCount })
  })
})

/* ------------------------------ ORDER FAILURE ----------------------------- */

router.get('/cart/checkout/orderFailed', verifyLogin, async (req, res) => {

  let categories = await productHelpers.getCategories();
  await userHelpers.failedOrder(req.session.order, user).then((status) => {

    res.render('user/orderFailure', { user, userheader, userlink, categories })
  })
})




/* ------------------------------ VERIFY PAYMENT------------------------------ */
router.post("/verify-payment", (req, res) => {
  userHelpers
    .verifyPayment(req.body)
    .then(() => {
      userHelpers.changePaymentStatus(req.body["order[receipt]"]).then(() => {
        res.json({ status: true });
      });
    })
    .catch((err) => {
      res.json({ status: false, errMsg: "Payment failed" });
    });
});


/* ------------------------------- GET ORDERS ------------------------------- */

router.get("/orders", verifyLogin, getCartCount, async (req, res) => {
  let categories = await productHelpers.getCategories();
  let orders = await userHelpers.getUserOrders(user._id);
  console.log(orders, 'ppoorders');
  res.render("user/allorders", { title: "ORDERS", user, userlink, userheader, orders, categories, cartCount });
});


/* ---------------------------- GET SINGLE ORDER ---------------------------- */

router.get("/order/:id", verifyLogin, getCartCount, async (req, res) => {

  let orderItem = await userHelpers.getOrderProducts(req.params.id)
  let order = await userHelpers.getOrder(req.params.id)
  let categories = await productHelpers.getCategories();
  console.log(order, 'tttttt');
  res.render("user/orders", { title: "ORDERS", user, userlink, userheader, order,
   orderItem, categories, cartCount });
});


/* ------------------------------ CANCEL ORDER ------------------------------ */

router.post('/order/cancel-order/:id', (req, res) => {
  userHelpers.cancelOrder(req.params.id, user).then((response) => {
    res.json(response)
  })
})

/* ---------------------------- GET USER PROFILE ---------------------------- */

router.get("/user-profile", verifyLogin, getCartCount, async (req, res) => {
  let wallet = await userHelpers.getWallet(user._id)
  res.render("user/userProfile", { title: "USERPROFILE", userheader, userlink, userProfile, user,
   wallet, cartCount });
});

/* -------------------------- GET USER ADD ADDRESS -------------------------- */

router.get("/add-address", verifyLogin, getCartCount, async (req, res) => {
  let wallet = await userHelpers.getWallet(user._id)

  res.render('user/user_addAddress', { title: 'USER-ADD DETAILS', userheader, userlink,
   userProfile, user, cartCount, wallet })
})

/* -------------------------- POST USER ADD ADDRESS ------------------------- */

router.post('/add-address', verifyLogin, (req, res) => {

  userHelpers.addNewAddress(user._id, req.body).then((response) => {
    res.json(response)
  })
})

/* ----------------------------- VIEW ADDRESSes ----------------------------- */

router.get('/view-addresses', verifyLogin, getCartCount, async (req, res) => {

  let savedAddress = await userHelpers.getUserAddress(user._id)
  let categories = await productHelpers.getCategories();
  let wallet = await userHelpers.getWallet(user._id);

  res.render('user/viewAddress', { userheader, userProfile, userlink, user, savedAddress, categories,
     cartCount, wallet })
})

/* ---------------------------- GET EDIT ADDRESS ---------------------------- */

router.get('/viewAddress/edit/:id', verifyLogin, getCartCount, async (req, res) => {
  let categories = await productHelpers.getCategories();
  let address = await userHelpers.getSingleAddress(req.params.id)
  let wallet = await userHelpers.getWallet(user._id)

  res.render('user/editAddress', { userProfile, userheader, userlink, user, address, categories, cartCount, wallet })
})

/* ---------------------------- POST EDIT ADDRESS --------------------------- */

router.post('/viewAddress/edit/:id', verifyLogin, async (req, res) => {
  let categories = await productHelpers.getCategories();
  userHelpers.updateAddress(req.body, req.params.id).then((response) => {

    res.redirect('/view-addresses', { categories })
  })
})

/* --------------------------- GET DELETE ADDRESS --------------------------- */

router.get('/userprofile/delete-address/:id', verifyLogin, (req, res) => {

  userHelpers.deleteAddress(req.params.id).then((response) => {
    res.json({ status: true })
  })
})

/* ------------------------------ GET WISHLIST ------------------------------ */

router.get('/wishlist', verifyLogin, getCartCount, async (req, res) => {
  let products = await userHelpers.getWishlistProducts(user._id)
  let categories = await productHelpers.getCategories();
  res.render('user/wishlist', { userheader, userlink, user, products, categories, cartCount })
})

/* --------------------------- GET ADD TO WISHLIST -------------------------- */

router.get('/wishlist/add-to-wishlist/:id', verifyLogin, (req, res) => {

  userHelpers.addToWishlist(req.params.id, user._id).then((response) => {

    res.json(response)
  })
})

/* ------------------------ POST REMOVE FROM WISHLIST ----------------------- */

router.post('/wishlist/remove-product', verifyLogin, (req, res) => {

  userHelpers.removeFromWishlist(req.body).then((response) => {

    res.json(response)
  })
})

/* ------------------------------ VERIFY COUPON ----------------------------- */

router.post('/cart/verify-coupon', verifyLogin, async (req, res) => {
  console.log(req.body, 'couponaplyrt');
  const date = new Date()

  let totalAmount = req.body.total

  if (req.body.coupon == '') {
    res.json({ noCoupon: true, total })
  } else {

    let couponResponse = await userHelpers.applyCoupon(req.body, user._id, date)
    console.log(couponResponse, 'couponResponse 111');
    // if(couponResponse.dateValid && couponResponse.verifyMaxAmount && couponResponse.verifyMinAmount){
    if (couponResponse.verify) {

      let discountAmount = (totalAmount * parseInt(couponResponse.couponData.offer)) / 100
      let amount = totalAmount - discountAmount
      couponResponse.discountAmount = Math.round(discountAmount)
      couponResponse.amount = Math.round(amount)
      res.json(couponResponse)
    } else {
      couponResponse.total = totalAmount
      res.json(couponResponse)
    }
  }
})


/* ------------------------------ REMOVE COUPON ----------------------------- */

router.post('/cart/remove-coupon', async (req, res) => {
  console.log(user, 'userid');
  await userHelpers.removeCoupon(user._id).then(async (response) => {
    response.totalAmount = await userHelpers.getTotalAmount(user._id)
    console.log(response);
    console.log(response.totalAmount);
    res.json(response)
  })
})


/* ------------------------------ RETURN ORDER ------------------------------ */

router.post('/orders/return', verifyLogin, async (req, res) => {

  console.log(req.body);
  await userHelpers.returnOrder(req.body, user).then((response) => {

    res.json(response)
  })
})


/* --------------------------- USE WALLET BALANCE --------------------------- */

router.post('/checkout/usewallet', verifyLogin, async (req, res) => {

  console.log(req.body, 'body total wallet');
  await userHelpers.useWallet(req.body, user).then((response) => {

    console.log(response);
    res.json(response)
  })
})

/* ------------------------------ REMOVE WALLET ----------------------------- */

router.post('/checkout/removewallet', async (req, res) => {
  console.log('reached remove');
  console.log(req.body);
  await userHelpers.removeWallet(user, req.body).then((response) => {
    res.json(response)
  })
})

/* ------------------------------ VIEW COUPONS ------------------------------ */

router.get('/profile/viewCoupons', verifyLogin, getCartCount, async (req, res) => {
  let categories = await productHelpers.getCategories();
  let wallet = await userHelpers.getWallet(user._id)

  await userHelpers.getCoupons().then((coupons) => {

    res.render('user/coupon', { userProfile, userheader, userlink, user, coupons, categories, cartCount, wallet })
  })
})

/* ------------------------------- PAGINATION Products------------------------------- */

router.get('/viewProducts', verifyLogin, getCartCount, async (req, res) => {
  let categories = await productHelpers.getCategories();

  let count = await userHelpers.getProductsCount()
  let page = Math.ceil(count / 9)
  let pageNum = []
  for (i = 0; i < page; i++) {
    pageNum[i] = i + 1
  }

  let startIndex = parseInt(req.query.page)
  let limit = parseInt(req.query.lim)


  await userHelpers.getProductlists(startIndex, limit).then((products) => {
    res.render('user/allProducts', { user, userheader, userlink, pageNum, products, categories, cartCount })
  })

})


/* -------------------------- GET PASSWORD UPDATE -------------------------- */

router.get('/profile/change-password', verifyLogin, getCartCount, async (req, res) => {
  let wallet = await userHelpers.getWallet(user._id)

  res.render('user/change-password', { userProfile, user, userlink, userheader, cartCount, wallet })
})

/* -------------------------- POST PASSWORD UPDATE -------------------------- */

router.post('/profile/change-password', async (req, res) => {
  let result = await userHelpers.changePassword(req.body, user)
  res.json(result)
})



module.exports = router; 
