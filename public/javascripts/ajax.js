const { response, post } = require("../../app")



 /* ------------------------------- Add To Cart ------------------------------ */
function addToCart(proId){
    $.ajax({
        url:'/cart/add-to-cart/'+proId,
        method:'get',
        success:(response)=>{
            console.log(response);
            if(response.status){
                let count =$('#cart-count').html()
                count= parseInt(count)+1
                $('#cart-count').html(count)
            }
           
        }
    })
}
 

/* ------------------ Increment & Decerement  Quantity ------------------ */

function changeQuantity(cartId,proId,userId,count){
    let quantity= parseInt(document.getElementById(proId).value)
    count = parseInt(count)
    $.ajax({
        url:'/change-product-quantity',
        data:{
            user:userId,
            cart:cartId,
            product:proId,
            count:count,
            quantity : quantity
        },
        method:'post',
        success:(response)=>{
            console.log(response);
            if(response.removeProduct){
                swal("Product Removed!", "Succesfully Removed Product!", "success");
                $("#myDiv").load(location.href+" #myDiv>*","");
            }else{
                console.log(response);
                document.getElementById(proId).value = quantity + count;
                document.getElementById('a'+proId).innerHTML=response.subTotal
                document.getElementById('subtotal').innerHTML = response.total
                document.getElementById('totall').innerHTML = response.total
            }
        } 
    })
    
}



/* ------------------------ REMOVE PRODUCT FROM CART ------------------------ */

function removeFromCart(cartId,proId){
    swal({
        title:"Remove Product!",
        text:'Press Ok to confirm',
        icon:'warning',
        buttons: ["Cancel", "Ok"],
       dangerMode:'Ok'
    }).then(
    function(isConfirm){
        if(isConfirm){

            $.ajax({
                url: '/cart/removeProduct',
                data:{
                    cart:cartId,
                    product: proId
                },
                method:'post',
                success:(response)=>{
                    
                    swal("Product Removed!", "Your product have been removed from cart!", "success").then(()=>{
        
                        $("#myDiv").load(location.href+" #myDiv>*","");  
                    })
        
        
                }
        
            })
        }else{
            swal("Your product not removed from Cart");
        }
    })
   
}


/* ------------------------ CHECKOUT FORM SUBMISSION ------------------------ */
function placeOrder(){
    
        console.log('jeeeeeeeeee');

        $.ajax({
            
            url : '/cart/checkout',
            method:'post',
            data: $('.checkout-form-data').serialize(),
            
            success:(response)=>{
                    console.log(response,'ooooo');       
                    if(response.codSuccess){ 
                            
                            location.href = '/cart/checkout/orderSuccess';
                        
                    }else if(response.razorpay){
                        console.log(response,'razorpay');
                        razorpayPayment(response)
                       
                    }else if(response.paypal){
                        paypalPayment(response) 
                        
                    }else if(response.wallet){
                        location.href = '/cart/checkout/orderSuccess'; 
                    }
                 
            }   
        })
        

        /* -------------------------------- RAZORPAY CHECKOUT-------------------------------- */

        function razorpayPayment(order){
            console.log(order,'order');
            console.log(order.id,'oded');
            var options = {
                "key": "rzp_test_g1F73DN5q0dvVh",       // Enter the Key ID generated from the Dashboard
                "amount": order.amount,                 // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
                "currency": "INR",
                "name": "MUEBLES",
                "description": "Test Transaction",
                "image": "https://example.com/your_logo",
                "order_id": order.id,                   //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
                "handler": function (response){
                   
                    verifyPayment(response,order)
                },
                "prefill": {
                    "name": "Gaurav Kumar",
                    "email": "gaurav.kumar@example.com",
                    "contact": "9999999999"
                },
                "notes": {
                    "address": "Razorpay Corporate Office"
                },
                "theme": {
                    "color": "#3399cc"
                }
            };
            var rzp1 = new Razorpay(options);
            rzp1.open();

        }

        function verifyPayment(payment,order){
            $.ajax({
                url:'/verify-payment',
                data:{
                    payment,
                    order
                },
                method:'post',
                success:(response)=>{
                    if(response.status){
                     
                            location.href = "/cart/checkout/orderSuccess";
                        
                    }else{
                        location.href = "/cart/checkout/orderFailed";
                    }
                }
            })
        }

        /* ----------------------------- PAYPAL CHECKOUT ---------------------------- */

        function paypalPayment(order){
            console.log(order,'hai');
            for(let i = 0 ; i < order.links.length; i++){
                if(order.links[i].rel === 'approval_url'){
                    location.href= order.links[i].href;
                }
            }
        }
   
} 


/* ------------------------------- ADD ADDRESS ------------------------------ */

function addAddress(){
    $.ajax({
        url:'/add-address',
        method:'post',
        data: $('#address-form').serialize(),
        success:(response)=>{
            swal("Good job!", "Added New Shipping Details!", "success").then(function() {
                $("#myDiv").load(location.href+" #myDiv>*","");
               
        })
    }
    })
}



/* ----------------------------- ADD TO WISHLIST ---------------------------- */

function addToWishlist(proId){

    $.ajax({
        url:'/wishlist/add-to-wishlist/'+proId,
        method:'get',
        success:(response)=>{
            if(response.status){
                alertify.set('notifier','position', 'top-right');
                alertify.success('Product Added To Wishlist');
            }
        }
    })

}

/* ---------------------- REMOVE PRODUCT FROM WISHLIST ---------------------- */

function removeFromWishlist(wishlistId,proId){
    console.log(wishlistId,proId,'data');

    swal({
        title:"Remove Product!",
        text:'Press Ok to confirm',
        icon:'warning',
        buttons: ["Cancel", "Ok"],
       dangerMode:'Ok'
    }).then(
    function(isConfirm){
        if(isConfirm){
    $.ajax({
        url:'/wishlist/remove-product',
        data:{
            wishlist:wishlistId,
            product:proId
        },
        method:'post',
        success:(response)=>{
            swal("Product Removed!", "Your product have been removed from wishlist!", "success").then(()=>{
            $("#myDiv").load(location.href+" #myDiv>*","");
        })
    }
    })
}else{
    swal("Your product is safe");
}
    })
}

/* ------------------------------ VERIFY COUPON ----------------------------- */

function verifyCoupon(event){
    event.preventDefault()

let total = document.getElementById('payableAmount').innerHTML

    $.ajax({
        url:'/cart/verify-coupon',
        method:'post',
        data: $('#coupon').serialize() + total,
       
        success:(response)=>{
          

            if(response.verify){

            document.getElementById('discount').innerHTML=response.discountAmount
            document.getElementById('payableAmount').innerHTML=response.amount
            document.getElementById('payable').value=response.amount
            // document.getElementById('total').value=response.amount  (no need)
            document.getElementById('error').innerHTML=''
            document.getElementById("applyCoupon").hidden = true
            document.getElementById("removeCoupon").hidden = false 
            alertify.set('notifier','position', 'top-right');
            alertify.success('Coupon Applied');

           }else{

            document.getElementById('discount').innerHTML=0
            document.getElementById('payableAmount').innerHTML=response.total
            document.getElementById('couponField').value =''


            if(response.used){
                document.getElementById('error').innerHTML = response.usedMsg
               }else if(response.minAmount){
                document.getElementById('error').innerHTML = response.minAmountMsg
               }else if(response.maxAmount){
                document.getElementById('error').innerHTML = response.maxAmountMsg
               }else if(response.invalidDate){
                document.getElementById('error').innerHTML = response.invalidDateMsg
               }else if(response.invalidCoupon){
                document.getElementById('error').innerHTML = response.invalidCouponMsg
               }else if(response.noCoupon){
                document.getElementById('error').innerHTML = 'Invalid Coupon Details'
               }
    
           }      
        }
    })
}


/* ------------------------------ REMOVE COUPON ----------------------------- */

function RemoveCoupon(event){
    event.preventDefault()
    console.log('remove coupon');
        $.ajax({
            url:'/cart/remove-coupon',
            method:'post',
            data: $('#coupon').serialize(),   
            success:(response)=>{
                document.getElementById('couponField').value =''
                document.getElementById('discount').innerHTML=0
                document.getElementById("applyCoupon").hidden = false
                document.getElementById("removeCoupon").hidden = true
                document.getElementById("error").innerHTML = ""
                document.getElementById('payableAmount').innerHTML=response.totalAmount
            }
})

}

/* ----------------------------- DELETE ADDRESS ----------------------------- */

function deleteAddress(id){
   
    $.ajax({
        url: 'userprofile/delete-address/'+id,
        method:'get',
        success:(response)=>{ 
            $("#myDiv").load(location.href+" #myDiv>*","");
            swal("Your Address Deleted ..");
        }   
    })
}
 

/* ------------------------------ CANCEL ORDER ------------------------------ */

function cancelOrder(orderId){
    console.log(orderId,'ppppppppppppppo');

    swal({
        title:"Cancel Order!",
        text:'Press Ok to confirm',
        icon:'warning',
        buttons: ["Cancel", "Ok"],
       dangerMode:'Ok'
    }).then(
    function(isConfirm){
        if(isConfirm){
    $.ajax({
        url:'/order/cancel-order/'+orderId,
        method:'post',
        success:(response)=>{
            swal("Order Cancelled!", "If you choose Online Payment your money will be crdited to wallet.", "success").then(()=>{
                $("#myDiv").load(location.href+" #myDiv>*","");
        })
    }
    })
} else{
    swal("Your order Is safe , Reach you soon..");
}
    })
}

/* ------------------------------ RETURN ORDER ------------------------------ */

function returnOrder(orderId,amount,date){
    console.log('helooo');
    console.log(orderId);
    console.log(amount); 
    $.ajax({
        url:'/orders/return',
        method:'post',
        data:{
            orderId,
            amount,date
        },
        success:(response)=>{
            if(response.status){
                alertify.set('notifier','position', 'top-right');
                alertify.success('Your Return  Successful');
                $("#myDiv").load(location.href+" #myDiv>*","");
            }
        }
    })
}

/* ------------------------------- USE WALLET ------------------------------- */

function usewallet(event){
    console.log(event,'llevent');
    if(!event.detail || event.detail == 1){
    console.log('hellooo')
            let amount = document.getElementById('payableAmount').innerHTML
            console.log(amount,'uuuuuuuu');
    $.ajax({
        url:'/checkout/usewallet',
        data:{amount},
        method:'post',
        success:(response)=>{        
            console.log(response);
            if(response.status){
                document.getElementById('wallet1').hidden = true
                document.getElementById('wallet0').hidden = false 
                document.getElementById('payableAmount').innerHTML = response.amount
                document.getElementById('payable').value = response.amount
                document.getElementById('walletBalance').innerHTML = response.wallet
                document.getElementById('wallet-dis').value = response.discount
                document.getElementById('cod').hidden = true
                document.getElementById('wallet-div').hidden = true
                if(response.amount == 0){
                    document.getElementById('online').hidden = true
                    document.getElementById('wallet-dis').value = response.discount
                    console.log(response.amount);
                    document.getElementById('wallet-div').hidden = false
                    document.getElementById('customCheck50').checked = true
                }
            }
        }
    })
}
}


/* ------------------------------ REMOVE WALLET ----------------------------- */


function removeWallet(event){
    if(!event.detail || event.detail == 1){
    console.log('jjjjjjjjjjjjj12');
    let wallet = document.getElementById('walletBalance').innerHTML
    let amount = document.getElementById('payableAmount').innerHTML
    console.log(wallet,'wassss');
    $.ajax({
        url:'/checkout/removewallet',
        data:{wallet,amount},
        method:'post',
        success:(response)=>{
           
            document.getElementById('wallet1').hidden = false
            document.getElementById('wallet0').hidden = true 
            document.getElementById('payableAmount').innerHTML = response.total
            document.getElementById('payable').value = response.total
            document.getElementById('walletBalance').innerHTML = response.wallet
            document.getElementById('wallet-dis').value = 0
            document.getElementById('cod').hidden = false
            document.getElementById('online').hidden = false
            document.getElementById('wallet-div').hidden = true
        }

    })
}
}

/* ----------------------------- CHANGE PASSWORD ---------------------------- */

function changePassword(){
    console.log('helooo in chnage pass ajax');

    swal({
        title:"Update Password!",
        text:'If you confirm you cant login with old Password!',
        icon:'warning',
        buttons: ["Cancel", "Ok"],
       dangerMode:'Ok'
    }).then(
    function(isConfirm){
        if(isConfirm){

            $.ajax({
                url:'/profile/change-password', 
                data:$('#pass-form').serialize(),
                method:'post',
                success:(response)=>{
                    console.log(response);
                    if(response.status){
                        alertify.set('notifier','position', 'top-right');
                        alertify.success('password Updated');
                        $("#myDiv").load(location.href+" #myDiv>*","");

                    }else{
                        alertify.set('notifier','position', 'top-right');
                        alertify.warning(''+response.message);
                        $("#myDiv").load(location.href+" #myDiv>*","");

                    }
                    
                }
            })
} else{
    swal("Password Not Updated");
}
    })
}



