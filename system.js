require("dotenv").config();

const fs = require("fs");
const validator = require("email-validator");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer")
const jwt = require("jsonwebtoken")
const crypto = require("crypto");
const {usermodel, Admin, menumodel, tokenmodel, Cartmodel, purchaseddetails} = require("./helper/DB.js");
const { gmail } = require("googleapis/build/src/apis/gmail/index.js");
const { restart } = require("nodemon");
const paystack = require("paystack")(
    "sk_test_37950c79774e9be9050634d329059452cdb53ac5"
  );

var users = []; // Array to store signed-up names

var passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])[A-Za-z0-9]{6,16}$/

let validpassword = (password) => {
    return passwordRegex.test(password);
};

/*
fs.readFile("users.json", "utf8", (err, data) => {
    if(!err){
        try{
            let parsedData = JSON.parse(data);
            if(Array.isArray(parsedData)){
                users = parsedData;
            }
        } catch (error){
            console.error("error in parsing existing users:", error);
        }
    }
});

function bringUsertoFile(){
    fs.writeFile("users.json", JSON.stringify(users), "Utf8", (err)=> {
        if(err){
            console.error("There is error in bringing users to file:", err)
        }
    });
}
*/

function isEmailUnique(email){
    return !users.some((user) => user.email === email)// check if the email has not exist before(or email is unique)
};

function Signup(req, res) {

const data = req.body;


if (!data.name || !data.email || !data.password) {

res.status(400).json({error: "Name, Email & Password are required" });

return;
}

if(!validpassword(data.password)){
    res.status(400).json({error:"Valid Password is required"});

    return;
}

if(!validator.validate(data.email)){
    res.status(400).json({error: "Email is invalid"});

    return;
}

if(!isEmailUnique(data.email)){
    
    res.status(400).json({error:"Email already exist"});

    return;
}

// Validate if the role is one of the allowed values

if (data.role && !['buyer', 'seller', 'admin'].includes(data.role)) {
    return res.status(400).json({ error: 'Invalid role specified.' });
  }

//const PisMatched = bcrypt.compare(validpassword, hash)

// const salt = bcrypt.genSalt(13)
//    const hash =  bcrypt.hash(data.validpassword, salt)
//    console.log("hash is password:", hash)


// function RiD(){
//     return Math.floor(1000 + Math.random() * 9000)}
 
// var n = RiD();
// console.log(n)

const saltround = 13
bcrypt.hash(data.password, saltround, (err, hash) => {
    if(err){
        console.error("Error hasing password:", err);
        res.status(500).json({error: "internal server error"});
    } else {
        
var newUser = {
    name : data.name,
    email: data.email,
    password: hash,
    role : data.role
};

usermodel.create(newUser)
.then((done) => {

res.status(200).send("signup  is successful");
})
.catch((err)=> {
    
let msg = err;
if(err.hasOwnProperty("code")  && err.code == "11000" ){
    msg = "email has been used by another user, please change your email address"
}
    res.status(500).json({
        message: " unable to signup", err: msg
    });
})

//users.push(newUser);
//bringUsertoFile();
//res.status(201).json({ detail: newUser, message: "Sign up successful by user" });
 }

});

}

function Login(req, res) {

    let data = req.body;
      
    
    if (!data.email || !data.password) {
      
    res.status(400).json({ error: "Email & Password are required" });
      
    return;
}
 
usermodel.findOne({email: data.email })
 .then((foundUser) => {

    if(foundUser != null){

        bcrypt.compare(data.password, foundUser.password,(err, result) => {
            if(err){
                res.status(500).json({error: "Login failed. Please try again"});
            }else if(result){
                // Passwords match, generate a JWT token and send it in the response
        
                const token = jwt.sign(
                    {_id: foundUser.id, email: foundUser.email, role:foundUser.role },
                    process.env.JWT_SECRET,
                    {expiresIn: "1h"}
                    );
        
                    res.status(200).json({data: foundUser, token, messag:"Login Sucessful", foundUser});
            }else{  res.status(401).json({error: "incorrect password"});
        }
        });
         }
         else{
            res.status(404).json({ message: "User not found"

            });
         }

 })
 .catch((err) => {
    res.status(500).json({
        message: " Unknow error", err
    });
 })

 //const pass = users.find((user) => user.password === data.password )

 


 //else { res.status(401).json({error: "Email does not exist"});}
}

//Admin signup

const Admins = async (req, res, next) => {
    try {
        let {email,
         password,
         name} = req.body
      

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 13);

        const AdminsData = {
            email,
            password: hashedPassword,
            name,
            
        };

        const Nadmin = await Admin.create(AdminsData);
        res.status(200).json({ message: "Admin Successfully Added", Nadmin });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error registering admin', error });
    }
};

const adminlogin = async (req, res, next) => {

        try {
            let {email, 
             password } = req.body;
    
            const userAdmin = await Admin.findOne({ email });
    
            if (!userAdmin) {
                res.status(400).json({ message: "Access Denied, you are not an Admin" });
            } else {
                // Compare the provided password with the hashed password in the database
                const passwordMatch = await bcrypt.compare(password, userAdmin.password);
    
                if (passwordMatch) {
                    const token = jwt.sign(
                        { id: userAdmin.id, email: userAdmin.email },
                        process.env.JWT_SECRET,
                        { expiresIn: "1h" }
                      );
                    res.status(200).json({
                        message: "Welcome Back Here Is Your Token: ", userAdmin, token
                    });
                } else {
                    res.status(400).json({ message: "Incorrect password" });
                }
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Can't login as Admin " });
        }
    };


// add menu route to login
const Product2Menu = async(req, res, next) => {
  var {product, 
   email, 
   price,
  password,
  quantity,
role} = req.body;

try{
 const user = await usermodel.findOne({ email})


        if(!user){
            res.status(401).json({ message: "user not found, please signup or check your email"});
        }

    
    const validpass =  await bcrypt.compare(password, user.password); 
    
            if(validpass){
            const menuData = {
                    product, 
                    price,
                    role,
                    quantity,
                    user: user._id,
                }
               const addProduct = await menumodel.create(menuData);

               res.status(200).json({message: "Product added successfully", product:addProduct})
            }else{ 
                
                return res.status(401).json({
                message: "Invalid password"
            });
        
}} catch (err){
    console.error(err);
    res.status(500).json({ message: "Uknown error occured", err});
}}


// find product
const findproduct = async(req, res, next)=> {
    try{
        const productName = req.params.productName;

        const productfound = await menumodel.findOne({product: productName}, {price:1, quantity: 1})
       
        if(productfound){

            res.status(200).json({ Message: productName, price: productName.price})
        }else{ 
            res.status(404).json({ message: `Product ${productName} not found`})
        }
    }catch(error){
        console.error(error);

        res.stats(500).json({error: "unknow error", error})
    }
}


//update menu by ID

function updatemenu(req, res, next){
    const id = req.params.id;
    var updateM = req.body;

    menumodel.findById({_id: id})
    .then((menu) => {

        if(!menu){
            res.status(404).json({ message:" menu not found"});
        }else{


            menumodel.updateOne({_id: id}, updateM)
            .then(() => {
                res.status(200).json({message: "Menu Updated Successfully"})
            })
            .catch((err) => {
                res.status(500).json({message: "failed to ypdate menu", err});
            })
        }
    })
    .catch((err) => {
        res.status(500).json({
         message:   "uknown error", err
        })
    })
}
// List meny by id

const showMenu = async(req, res, next) => {
    try{
        const menuItems = await menumodel.find({}, 'product price quantity')

        res.json(menuItems)
    }catch(error){
        console.error(error);

        res.status(500).json({error: 'Internal server error'})
    }
}

const updateproductbyId = (req, res, next) =>{
    let id = req.params.id;
    let email= req.body.email
    const updatedMenu = req.body;

  const user = usermodel.findOne({email})
  if(!user){
    return res.status(404).json({message:"Seller not found"})
  }
  else{
   
    if(updatedMenu.name){
        user.name = updatedMenu.name;
    
    }
    if(updatedMenu.email){
        user.email = updatedMenu.email;
    }
    if(updatedMenu.password){
        user.password = updatedMenu.password;
    }

    
    if(!validpassword(updatedMenu.password)){
        res.status(401).json({error:"Valid Password is required"});
    
        return;
    }

    menumodel.findById(id)
        .then((menu) => {
            if (!menu) {
                res.status(404).json({ message: "Menu not found" });
            } else {
                menumodel.updateOne({ _id: id }, updatedMenu)
                    .then(() => {
                        res.status(200).json({ message: "Menu updated successfully",updatedMenu });
                    })
                    .catch((err) => {
                        res.status(500).json({ message: "Failed to update menu" });
                    });
            }
        })
        .catch((err) => {
            res.status(500).json({ message: "Unknown error occurred", err });
        });
  }

};

//owner create the product
/*
const product = async (req, res) =>{

    try{ 
        
        const {email, password, username, name, price} = req.body;
        const nProduct= new Productmodel({
            name, price
        });
        const savedProduct = await nProduct.save();

        res.status(200).json({success: true, product: savedProduct})
    }catch(error){
        console.error(error);
        res.status(500).json({error: "unknown error"})
    }
}
*/

//Add a product to cart
const Add_To_Cart = async (req, res) => {
    try { 
        const {email, 
              product, 
              quantity} = req.body;

        const user = await usermodel.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User Not found please signup" });
        }

       // Finding the corresponding product in the menu ( menumodel)
        const productmenu = await menumodel.findOne({ product});

        // If the product is not found, return a 404 response
        if (!productmenu) {
            return res.status(404).json({ message: "Product not found." });
        }

        console.log("Product Menu Price:", productmenu.price);
        console.log("Quantity:", quantity);

        const calculatedPrice = productmenu.price * parseInt(quantity, 10);
        console.log("Calculated Price:", calculatedPrice);

      let cart = new Cartmodel({
        email,
        product,
        user: user._id,
        quantity: parseInt(quantity, 10),
        price: calculatedPrice,
      })

      console.log("Cart Item:", cart);

      //save the cart
            await cart.save();
            return res.status(200).json({message: `Items added successfully to cart`, cart});
        
        
    } catch(error) {
        console.error(error);
        res.status(500).json({ error: 'Err0r in adding item' });
    }
}
// Get cart details

const  cart = async (req, res) => {
    try {
   

        const email = req.body.email; 

        
        console.log("Received User ID:", email);
        // or const userEmail = req.user.email; // using the email in the request

        // Find the user based on user ID or user email
        const user = await usermodel.findOne({email}); // If using user ID
        // or const user = await usermodel.findOne({ email: userEmail }); // If using user email

        if (!user) {
     
            return res.status(404).json({ error: "User not found" });
        }

        // Find the user's cart and populate the product details
        const cart = await Cartmodel.findOne({email})

        console.log("User Cart:", cart);

        if (!cart  ||  cart.length === 0) {
         

            // Return an empty cart response if the cart is not found or has no items
            return res.json({ message: `Empty Cart` });
        }
        console.log("Cart type:", typeof cart); // Log the type of cart

      // Check if cart is an array before using reduce
if (Array.isArray(cart)) {
    // Calculate total items
    const totalQuantity = cart.reduce((total, item) => total + item.quantity, 0);
    const totalPrice = cart.reduce((total, item) => total + item.price, 0);

    res.json({ cart, totalQuantity, totalPrice });
} else {
    // Handle the case when there's only one cart item
    res.json({ cart, totalQuantity: cart.quantity, totalPrice: cart.price });
}
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Unknown error" });
    }
};

function generatePaymentReference(){
    const randomString = crypto.randomBytes(16).toString('hex');

    return randomString;
}

const paymentformenu = async (req, res) => {

    let{ 
        email,
        product,
        price,
        quantity,
        company,
        location,
        phoneNumber
        } = req.body;

try{
    
    const user = await usermodel.findOne({email})
    if (!user) {
      res.status(404).json({ message: "user not found, check the email" });
    } else{     
        const MProduct = await menumodel.findOne({ product }, { price });
        if(MProduct){
            const productprice = MProduct.price
            let amountConverted = productprice * 100 ; //this take the price to 00
            console.log("The amount converted:", amountConverted)

            const paymentReference = generatePaymentReference();
            const response = await paystack.transaction.initialize({
                email: "gomitoguns@gmail.com", 
                amount: amountConverted * quantity,
                   refrence: paymentReference, 
            });

            const{ authorization_url, access_code} = response.data;
            console.log(response)
        
            // removing quantity bought from stocked quantity
        
            const productData = {
                product,
                price,
                email,
                company,
                location,
                quantity,
                phoneNumber
            };
        
            // refresh mmenu stocked data, only after payment is made for the deducted ones
            const refreshedMenu = await purchaseddetails.create(productData);
        
            res.status(200).json({
                authorization_url,
                paymentReference,
                refreshedMenu
            });

        }else{ res.status(404).json({ message: "Product not found" });
    }
}
}catch(error){
    res.status(500).json({error:"Payment Error" })
}

}

const paycart = async(req, res, next )=>{

 try{   let{ 
        email,
        product,
        price,
        quantity,
          company,
          location,
          phoneNumber
        } = req.body;


            // Calculate the total amount based on the items in the cart
      const cart= await Cartmodel.find({email})
      const totalAmount = cart.reduce((total, item) => total + item.price, 0);

      function generatePaymentReference() {
        const randomString = crypto.randomBytes(16).toString('hex');
        return randomString;
      }

       // Use the Paystack API to initiate payment
       const paymentReference = generatePaymentReference();

       const payResponse = await paystack.transaction.initialize({
         email,
         amount: totalAmount * 100, // Paystack expects amount in kobo
         reference: paymentReference,
       });
 
       const { authorization_url, access_code } = payResponse.data;
 
       const productData = {
         product,
         price,
         email,
         company,
         location,
         quantity,
         paymentReference,
         phoneNumber,
       };
 
       const refreshedMenu = await purchaseddetails.create(productData);
 
       res.status(200).json({
         authorization_url,
         access_code,
         cart,
         refreshedMenu,
       });
     } catch (error) {
       console.error(error);
       res.status(500).json({ message: 'Error initiating payment' });
     }

    }
    

function listmenubyID(req, res){
    const id =  req.params.id;

    menumodel.findById(id)
    .then((menu)=>{

        if(!menu) {
       res.status(404).json({ message: "Menu not found"})
        } else{

            res.status(200).json({menu})
        }
    })
    .catch((err) =>{
        res.status(500).json({ message:" unknown error occurred", err});
    });
}
// forgetpaasword

/*
function forgetpassword( req, res, next){

    var email = req.body.email
    let newPass = req.body.password // the request asked for new pass

    if(email !== user.email)

    if(!validpassword(newPass)){
        res.status(401).json({error:"Valid Password is required"});
    
        return;
    }else{ 

    const saltround = 13;
    
    bcrypt.hash(newPass, saltround, (err, hashedPass)=>{
        
        if(err){
            res.status(500).json({error: "Password Hashing Error"})

            return;
        } else{
               // Update the user's password with the hashed password
               newPass = hashedPass
               //bringUsertoFile();
    
               usermodel.updateOne({email}, {password: newPass})
               .then((done)=> {

            
                   if(done.modifiedCount === 0){
                       res.status(200).json({
                           message: "update was successful, but no modification was made. Please enter different password."
                       })
                   }else {
                       res.status(200).json({
                           message: " Password changed successfully."
                       });
                   }
               })
               .catch((err)=> {
                   res.status(500).json({
                       message:"an unknown error occurred", err
                   });
               });
        }
    
})}


 
}
*/
//FORGET PASSWORD //

const forgetpassword = async (req, res, next) => {
  try {
    let userEmail = req.body.email;
    let newPassword = req.body.password;

    const token = crypto.randomBytes(10).toString("hex");

    if (!userEmail) {
      return res.status(500).json({
        message: "No email found, please check your email and try again",
      });
    }
    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        type: "OAuth2",
        user: "gomitoguns@gmail.com",
        accessToken: "ya29.a0AfB_byB73jgLpJS84g8r2iOPuvUMdBMZ5v5av3d7_9vuYQpTrjfC_8XlAP8w9U5HexzZUlRGrLz6b0sf-OtGTDnC4yKBgUjqyhKMoK3y4kBolnwCFzGRTQOoYIjvYamFrDgIp_obz65_4v7iPrrAfbm3gnT3ys0WhZW_aCgYKAbUSARESFQHGX2MiiVcATl3X1klyGwW66lVo7w0171"
    },
    });


    const mail = {
      from: "backendtesting10",
      to: userEmail,
      subject: "Password Reset Request",
      text: `You have requested a password reset. Click on the following link to reset your password: http://127.0.0.1:5000/acceptForgetPassword?token=${token}`,
    };

    // Send email
    const emailResponse = await transporter.sendMail(mail);

    // Update user password
    await tokenmodel.create({token});

    return res.status(200).json({
      message: "Password reset successfully",
      token,
      emailResponse,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Unknown error occurred",
      error: error.message,
    });
  }
};
  const acceptForgetPassword = async(req, res, next) =>{
    let userEmail = req.body.email
    let NewPass = req.body.password
    let token = req.body.token


    tokenmodel.findOne({userEmail, token})
    .then((done)=> {
        if(done == userEmail && done.token == token ){
            usermodel.updateOne({userEmail}, {password: NewPass})
            .then( (done) => {
           return res.status(200).json({
            message:"Password is reset successfully",
            emailResponse,
            UpdateResponse,
           });
            })
            .catch((err)=>{
            return  res.status(400).json({message: " password reset was not successful.",err
        });
   })
}
    })
    .catch((err)=>{
        return res.status(500).json({
            message: "Uknown Err0r occured",
            error: err.message,
        })
    })
  }
  const ChangePassword =  async (req, res) => {
    try {
      const userEmail = req.body.email;
      const currentPassword = req.body.currentPassword;
      const newPassword = req.body.newPassword;
      const token = req.query.token;
  
      // Check if the token exist
      if (!token) {
        return res.status(404).json({ message: "token not found" });
      }
  
      // Retrieve user from the database
      const user = await usermodel.findOne({ email: userEmail });
  
      // Check if the user exists
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Check if the current password matches the stored hashed password
      const isPasswordMatch = await bcrypt.compare(
        currentPassword,
        user.password
      );
  
      if (!isPasswordMatch) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }
  
      // Hash the new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 13);
  
      user.password = hashedNewPassword;
  
      await user.save();
  
      return res.status(200).json({
        message: "Password changed successfully",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Unknown error occurred",
        error: error.message,
      });
    }
  };

//   find a user by UID

function finduserId(req, res, next) {
 
    let UID = req.body.UID;

  usermodel.findOne({_id: UID}) 
  .then( (user)=> {

    if(!user){
    
        res.status(404).json({
            message: "user not found"});

    }else{
        res.status(200).json({ user});
    }
    
  })
  .catch((err)=> {

    res.status(500).json({
        message: " unknown error ", err
    });
});
}
  // Route to get a user by userUID

var getUser = (req, res, next)=>{
    const userUID = req.params.userUID;
    //const user = finduserId(userUID);
 

    usermodel.findOne({_id : userUID})
    .then((user) =>{
        if(!user ){

            res.status(404).json({error :" user on the data base does not exist"})
           
        }else {
            res.status(200).json(user)
        }
    })
    .catch((err)=> {
        res.status(500).json({message: "Uknow error", err})
    });
    

};

// Route to update a user by UID

const updateUser = (req, res)=>{
//const UID = req.params.UID;
const user = req.params.UID
const newData = req.body

//console.log(user);
    
    if(!user ){

        res.status(400).json({error: "User Not Found"})
        return
    }else {
    
    
    
    if(newData.name){
        user.name = newData.name;
    
    }
    if(newData.email){
        user.email = newData.email;
    }
    if(newData.password){
        user.password = newData.password;
    }

    
    if(!validpassword(newData.password)){
        res.status(401).json({error:"Valid Password is required"});
    
        return;
    }

    const saltround = 13
bcrypt.hash(newData.password, saltround, (err, hash) => {
    if(err){
        console.error("Error hasing password:", err);
        res.status(500).json({error: "internal server error"});
    } else {
 

        newData.password = hash

        usermodel.updateOne({_id: user}, newData)
        .then((user)=>{ 

            res.status(200).json({ message: "Update successful", user})

        })
        .catch((err) =>{
            res.status(500).json({
                message: "Uknown error", err
            });
        
   // res.status(200).json({message: "Update successful", user})
    })

    }
})

}




  // You can add more fields to update as needed
//bringUsertoFile();
//res.status(200).json({data: newData, message: "User updated successfully"})
}


// Route to delete a user by UID

const deleteUser = (req, res)=>{
    //const userUID = req.params.userUID;
    const {userUID, email, name, password} = req.body;
    /*const unserIndex = users.findIndex((user) => user.UID === userUID);

    if(unserIndex === -1){
        res.status(400).json({error : "user not found"});

        return;
        */

        usermodel.deleteOne({email})
        .then((done)=> {
            
            res.status(200).json({message: "Deleted Successfully", done})
        })
        .catch((err) =>{
            res.status(500).json({message:"Unknown error, unable to perform task", err})
        })
    }

function generatePaymentReference(){
    const randomString = Math.random().toString(36);
    return randomString;
}

  const pay = async (req, res) => {
        try {

          const price = 50000;
          let amountConverted = parseFloat(price).toFixed(2); // to make it price.00
          console.log(amountConverted);

        
          const paymentReference = generatePaymentReference();
      
          const response = await paystack.transaction.initialize({
            email: "gomitoguns@gmail.com",
            amount: amountConverted,
            reference: paymentReference,
          });
      
          const { authorization_url, access_code } = response.data;
      
          console.log(response);
          res.status(200).json({
            authorization_url,
            paymentReference,
          });
        } catch (error) {
          console.error(error);
          res.status(500).send("Error initiating payment");
        }
      };
      
      // Paystack webhook route
      const webhook = async (req, res) => {
        try {
          console.log(req.body);
          // Only handle charge success events
          if (req.body.event === "charge.success") {
            res.status(200).json("Payment confirmed");
          } else {
            res.status(500).json("Error verifying payment");
          }
        } catch (error) {
          console.error(error);
          res.status(500).send("Error verifying payment");
        }
      };
    // remove the user from users array

   // users.splice(unserIndex, 1);
    //bringUsertoFile();
    
    //res.status(200).json({message : "user successfully removed"}) // Respond with 204 (No Content) for a successful deletion}

// rout to change user's password by UID

/*
const ChangePassword = (req, res) => {
    const userUID = parseInt(req.params.UID);
    const user = finduserId(userUID);

    if(!user){
        res.status(401).json({error: "user not found"});

        return;
    }
    const data = req.body;

    if (!data.password) {

        res.status(401).json({error: "Password are required" });
        
        return;
        }
        
        if(!validpassword(data.password)){
            res.status(401).json({error:"Valid Password is required"});
        
            return;
        }



    if(!data){
        res.status(401).json({error: "New Password is required"});
        return;
    }

    const saltround = 13;
bcrypt.hash(data.password, saltround, (err, hashedPass)=>{
    if(err){
        res.status(500).json({error: "Password Hashing Error"})
    } else{
           // Update the user's password with the hashed password
           user.password = hashedPass
           //bringUsertoFile();

           res.status(201).json({message: "Password Changed successfully"});
    }
});
};

*/


module.exports = { 
    Signup, 
    Login, 
    Product2Menu,
    showMenu,
    updatemenu,
    listmenubyID,
    forgetpassword,
    finduserId,
    updateUser, 
    getUser,
     deleteUser, 
     ChangePassword,
    pay,
webhook,
acceptForgetPassword,
findproduct, 
Add_To_Cart,
 cart, 
 paycart,
 Admins,
 adminlogin,
 updateproductbyId,
 paymentformenu};
  