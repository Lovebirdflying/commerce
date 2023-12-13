const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(bodyParser.json());

let cart = [];

// Endpoint to add a product to the cart
app.post('/addToCart', (req, res) => {
  const { productId, quantity, price } = req.body;
  
  const itemIndex = cart.findIndex(item => item.productId === productId);

  if (itemIndex !== -1) {
    // Product already in the cart, update quantity
    cart[itemIndex].quantity += quantity;
  } else {
    // Product not in the cart, add it
    cart.push({ productId, quantity, price });
  }

  res.json({ success: true, cart });
});

// Endpoint to get the total quantity and price in the cart
app.get('/cartTotal', (req, res) => {
  const totalQuantity = cart.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = cart.reduce((total, item) => total + item.quantity * item.price, 0);

  res.json({ totalQuantity, totalPrice });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});     


//--------------------------------

const customerSchemer = new mongoose.model({
  name: String,
  email: String,
  password: String,
});

const Customer = mongoose.mode('Customer', customerSchemer);

const productSchema = new mongoose.model({
  name: String,
  price: Number,
})

const Product = mongoose.model('Product', productSchema)

app.post('/customers', async(req, res)=>{
  try{
    const newCustomer = new Customer(req.body);
    await newCustomer.save();
    res.status(201).json(newCustomer)

  }catch(error){
    res.status(400).json({error: error.message})
  }
})

//=================================
 // menuModel.js
const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
    product: {
        type: String,
        required: true,
    },
    price :{
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
    },
});

const MenuModel = mongoose.model('menu', menuSchema);

module.exports = MenuModel;
// menuController.js
const bcrypt = require("bcrypt");
const MenuModel = require('../models/menuModel');
const UserModel = require('../models/userModel');

const Addproduct = async (req, res, next) => {
    var product = req.body.product;
    var price = req.body.price;
    var email = req.body.email;
    var password = req.body.password;

    try {
        const user = await UserModel.findOne({ email });

        if (!user) {
            return res.status(401).json({
                message: "User not found, please sign up or check your email",
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (isPasswordValid) {
            const menuData = {
                product,
                price,
                user: user._id,
            };

            const addedMenu = await MenuModel.create(menuData);

            return res.status(200).json({
                message: "Product item added successfully",
                product: addedMenu,
            });
        } else {
            return res.status(401).json({
                message: "Invalid password",
            });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message: "Unknown error occurred",
            err,
        });
    }
};

function updateproductbyId(req, res, next) {
        const id = req.params.id;

        var updatedMenu = req.body;

        MenuModel.findById(id)
            .then((menu) => {
                if (!menu) {
                    res.status(404).json({ message: "Menu not found" });
                } else {
                    MenuModel.updateOne({ _id: id }, updatedMenu)
                        .then(() => {
                            res.status(200).json({ message: "Menu updated successfully" });
                        })
                        .catch((err) => {
                            res.status(500).json({ message: "Failed to update menu" });
                        });
                }
            })
            .catch((err) => {
                res.status(500).json({ message: "Unknown error occurred", err });
            });
    };


    const listproducts = async (req, res, next) => {
        try {
            const productsList = await MenuModel.find().select('-_id product price');
            res.status(200).json({ productsList});
        } catch (err) {
            res.status(500).json({ message: "Unknown error occurred", err });
        }
    };
    
    



module.exports = {
    Addproduct,
    updateproductbyId,
    listproducts,
};
 // menuRoutes.js
const authenticationMiddleware = require("../security/Authmiddlware");  // Import authentication middleware.

const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');

router.post('/Add-Product', menuController.Addproduct);
router.patch('/:id/update-product', menuController.updateproductbyId);
router.get('/list-products', menuController.listproducts);

module.exports = router;


=================================


const Add_To_Cart = async (req, res) =>
{
    try{ 
        const {email, productName, quantity} = req.body;
        const user = await usermodel.findOne({email});

        if(!user){

            res.status(404).json({message: "User Not found please signup"})
        }


   // Find the product based on the provided identifier (name or _id)

  // const product = await menumodel.findOne({ $or: [{ product: identifier }, { _id: identifier }]});


  //I made use of productname since the first didn't allow both

   const product = await menumodel.findOne({ product: productName });

   if (!product) {
       return res.status(404).json({ message: "Product not found." });
   }

   // Find or create a cart for the user
   let cart = await Cartmodel.findOne({ user: user._id });
   
   if (!cart) {
       // Create a new cart if it doesn't exist in the database
       cart = new Cartmodel({ user: user._id, items: [] });

       res.status(200).json(cart.items)
   } else if (!cart.items) {
       // If there is a cart but the items property is missing, initialize it
       return res.status(404).json({message: `No items`})
   }
=======================

//check this 

app.post('/add-to-cart/:username/:identifier', async (req, res) => {
    try {
      const { username, identifier } = req.params;
  
      // Find the user
      const user = await User.findOne({ username });
  
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }
  
      // Find the product by name or ID
      const product = await Product.findOne({ $or: [{ name: identifier }, { _id: identifier }] });
  
      if (!product) {
        return res.status(404).json({ error: 'Product not found.' });
      }
  
      // Check if the product is already in the user's cart
      const existingCartItem = user.cart.find(item => item.product.equals(product._id));
  
      // If the product is in the cart, increase the quantity; otherwise, add a new item
      if (existingCartItem) {
        existingCartItem.quantity += 1;
      } else {
        user.cart.push({ product: product._id });
      }
  
      // Save the updated user with the modified cart
      await user.save();
  
      return res.json({ message: 'Product added to the cart successfully.' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  });