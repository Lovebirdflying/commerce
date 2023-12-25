//appmirror.js
require("dotenv").config();

const mongoose = require("mongoose");
const cors = require("cors")
const express = require("express");
const bodyparser = require("body-parser");
const { 
    Signup, 
    Login, 
    Product2Menu,
    updatemenu,
    listmenubyID,
    forgetpassword,
    showMenu,
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
paymentformenu} = require("./system");

const{ Middlewareauthentication, checkUserRole, sendConfirmationEmailToAdmin }= require("./middleware/auth")
const app = express();
const PORT = process.env.PORT;

//app.use(cors());
//midleware to parse JSON request bodies
app.use(bodyparser.urlencoded({extended:false}))
app.use(bodyparser.json()); 

//defining routes

app.post("/signup", Signup);
app.post("/login", Login);
app.post("/adminsignup",Admins);
app.post("/adminlogin", adminlogin);
app.post("/productpayment", paycart);
app.post("/login/menu",Middlewareauthentication,checkUserRole('seller'), Product2Menu);
app.post("/forgetpassword", forgetpassword);
app.get("/user/:UID", finduserId);
app.get("/showmenu", showMenu)
app.patch("/login/:updatemenu", Middlewareauthentication,checkUserRole('seller'),  updateproductbyId)
app.get("/user/menulist/:id", listmenubyID);
app.patch("/updatemenu/:id", updatemenu);
app.get("/user/:userID", getUser);
app.patch("/user/:ID", updateUser);
app.delete("/user/:ID", Middlewareauthentication, checkUserRole('admin'),deleteUser);
app.patch("/user/Changepassword", ChangePassword);
app.post("/pay", pay);
app.post("/webhook", webhook);
app.post("/acceptForgetPassword", acceptForgetPassword);
app.post("/add-to-cart", Add_To_Cart);
app.get("/cart", cart);
app.get("/productname", findproduct);
app.post("/paymenu", paymentformenu)
// Handle 404 Not Found error



app.use((req, res) => {
     res.status(404).send("Not Found")
});


mongoose.connect(process.env.MONGO)
.then((done)=>{
    console.log("db connection is successful")

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
    
})
.catch((err)=>{
    console.log(`An error occurred, hence server was unable to start. ${err} `)
})