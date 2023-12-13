const mongoose = require("mongoose");
const moongoose = require("moongoose");
const Schema = mongoose.Schema;

const userSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },
    email :{
        type: String,
        required: true,
        unique: true,
    },
    password:{
        type: String,
        required:true
    },

    role: { type : String, 
        enum : ['buyer', 'seller', 'admin'], //enumeration that restrict its values to buyer, sellers, admin
              default : 'buyer'
            }

    }
/*
    UID :{
        type: moongoose.Schema.Types.ObjectId,
        ref: "UID",
        
    }
    */
);

const menuSchema = new mongoose.Schema({
    product: {
        type: String,
        required: true,
    },
    price:{
        type: Number,
        required: true,
    },
    user: {
       
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",

    },
 quantity : {
    type: Number,
    required: true,
 },

role: { type : String, 
enum : ['buyer', 'seller', 'admin'], //enumeration that restrict its values to buyer, sellers, admin
      default : 'buyer'
    }
    
});

const tokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
    },

})

/*
const CustomerSchema =({
    username: String,
    password: String,
    email: String,
    role: String, //'admin' or 'user'
})

const ProductSchema = new mongoose.Schema({
    name: String,
    price: Number,
    ProductId: mongoose.Schema.Types.ObjectId,
}
);
*/
const cartSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    product: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    quantity: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true,
    },
    DateCreated: {
        type: Date, default: Date.now
    },
});

const ledgerSchema = new mongoose.Schema({
    email:{
        type: String,
        required: true,
    },
    product:{
        type:String,
        required: true,
    },
    quantity:{
        type: Number,
        required: true,
    },
    company: {
        type:String,
        require: true,
    },
    location:{
        type: String,
        required: true,
    },
    paymentReference:{
        type: String,
    },
    phoneNumber:{
        type:String,
        required: true,
    },
 paymentDate:{
    type:Date, 
    default: Date.now
 }
})


const purchaseddetails = mongoose.model(`purchaseddetails`, ledgerSchema)
const Cartmodel = mongoose.model('cart', cartSchema)
//const Productmodel = mongoose.model('product', ProductSchema)
const tokenmodel = mongoose.model("token", tokenSchema)
const usermodel = mongoose.model("user", userSchema)
const menumodel = mongoose.model("menu", menuSchema)
//const Customermodel = mongoose.model("Euser", CustomerSchema)

module.exports = {usermodel, menumodel, tokenmodel, Cartmodel, purchaseddetails}

