


function validateName() {
    var nameError = document.getElementById('nameError');
    var name = document.getElementById('name').value;
    if (name.length == 0) {
        nameError.innerHTML = 'Name is required';
        return false;
    }
    if (name.length <4 || name.length >20) {
        nameError.innerHTML ='Invalid Name';
        return false;
    }
    if (!name.match(/^[A-Za-z-]*\s{0,1}[A-Za-z]*$/)) {
        nameError.innerHTML = 'write Name only';
        return false;
    }
    nameError.innerHTML = '';
    return true;
}

function validatePhone(){
 var phoneError =document.getElementById('phoneError');
 var phone = document.getElementById('phone').value 
 if(phone.length<10 || phone.length>10) {
    phoneError.innerHTML = 'Phone must be 10 digits';
    return false;
 }
 if(!phone.match(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/)){
    phoneError.innerHTML = 'Invalid Phone'
    return false;
 }
 phoneError.innerHTML = '';
 return true;

}
function validateEmail(){
   
    var emailError = document.getElementById('emailError')
    var email = document.getElementById('email').value;
    console.log(email);

    if(email.length == 0 ){
        emailError.innerHTML = 'Email is required'
        return false;
    }
    if(!email.match(/^[a-z\._\-[0-9]*[@][A-Za-z]*[\.][a-z]{2,6}$/)){
        
        emailError.innerHTML = 'Email invalid'
        return false;
    }

 
  
    emailError.innerHTML='';
    return true; 

}

function validatePassword(){
    var requiredpassword = document.getElementById('passwordError')
    var password = document.getElementById('password').value;

    if( password.length <8 && password.length>0){
    requiredpassword.innerHTML = 'password must be 8 digits';
    return false;
    }
    if( password.length ==0 ){
        requiredpassword.innerHTML = 'Password Required';
        return false;
        }
    if( !password.match(/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/)){
        requiredpassword.innerHTML = 'password must be combination of alphanumeric characters';
        return false;
    }

    requiredpassword.innerHTML='';
    return true;
}

function validateRepass(){
    var password = document.getElementById('password').value;
    var cpassword = document.getElementById('cpassword').value;
    var passwordErr = document.getElementById('cpasswordError')

    if(password != cpassword){
        passwordErr.innerHTML = 'Pasword not match';
        return false;
    }
    passwordErr.innerHTML=''
    return true
}

function validateAdminEmail(){
    var emailError = document.getElementById('email-error')
    var email = document.getElementById('Email').value;
    console.log(email);

    if(email.length == 0 ){
        emailError.innerHTML = 'Email is required'
        return false;
    }
    if(!email.match(/^[a-z\._\-[0-9]*[@][A-Za-z]*[\.][a-z]{2,6}$/)){
        emailError.innerHTML = 'Email invalid'
        return false;
    }
  
    emailError.innerHTML='';
    return true; 

}

function validateSubmit(){

    if(!validateEmail() || !validatePassword() || !validateRepass() || !validateName() || !validatePhone()){
        var submitError = document.getElementById('bttn-error')

        submitError.style.display = 'block';
        submitError.innerHTML = 'please fill the form to submit';
        setTimeout(function(){submitError.style.display = 'none';}, 3000);
        return false;
    }       
}

$("#submit-form").submit((e) => {
    e.preventDefault()
    $.ajax({
        url: "https://script.google.com/macros/s/AKfycbysn7lbByfL-syuxWgitzNvx9_7Fv6wY2_CLuwT/exec",
        data: $("#submit-form").serialize(),
        method: "post",
        success: function (response) {
            alertify.set('notifier','position', 'bottom-right');
            alertify.success('Your Message Send Successfully');
            $("#submit-form").load(location.href+" #submit-form>*","");
        },
        error: function (err) {
            alertify.set('notifier','position', 'bottom-right');
            alertify.warning('Message not send, Please try Again');
            $("#submit-form").load(location.href+" #submit-form>*","");
        }
    })
})