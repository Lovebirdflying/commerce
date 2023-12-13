const { usermodel } = require("./helper/DB");

var forgetpassword = (req, res)=> {
    const {email} = req.body;

    usermodel.findOne({email}, (err, user) =>{
        if(err || !user){
            
            res.status(400).json({error: "user with this email does not exists."});
        }

        const token = jwt.sign({_id: user._id}, process.env.RESET_PASSWORD_KEY, {expiresIn:"30m"});
        const data ={

            from: 'noreply@hello.com',
            to: email,
            subject:'Account activation link',
            html: `<h2>Please click on given link to activate your Account</h2>
                  <p>${process.env.CLIENT_URL}/resetpassword${token}</p>`
        };

        return usermodel.updateOne({resetLink: token}, function(err, success){

            if(err){ 
        return res.status(400).json({error:" reset password link error"});
    } else{

        mongo.messages().send( data, function(error, body){
            if(error){

                return res.json({
                    error:err.messages
                })
            }
            return res.json({message: 'Email has been sent, kindly follow the instructions'});
        })
    }

        })
    })
}


//FORGET PASSWORD //

function Token(length) {
    const characters = "0123456789"; 
    const tokenArray = [];
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        tokenArray.push(characters[randomIndex]);
    }
    return tokenArray; 
}

app.post("/forgot-password", async (req, res, next) => {

    try {
  
      let userEmail = req.body.email;
  
      let newPassword = req.body.password;
  
      let resetToken = Token(4);
  
   
  
      if (!userEmail) {
  
        return res.status(500).json({
  
          message: "No email found, please check your email and try again",
  
        });
  
      }
  
   
  
      const transporter = nodemailer.createTransport({
  
        host: "smtp.gmail.com",
  
        port: 465,
  
        secure: true,
  
        auth: {
  
          user: process.env.MAIL_USER,
  
          pass: process.env.MAIL_PASSWORD,
  
        },
  
      });
  
   
  
      const mail = {
  
        from: "backendtesting10",
  
        to: userEmail,
  
        subject: "Password Reset Request",
  
        text: `You have requested a password reset. Click on the following link to reset your password: http://localhost:2000/forgot-password?token=${resetToken}`,
  
      };
  
   
  

  // Send email
  
      const emailResponse = await transporter.sendMail(mail);
  
   
  
      // Update user password
  
      const updateResponse = await usermodel.updateOne(
  
        { userEmail },
  
        { password: newPassword }
  
      );
  
   
  
      return res.status(200).json({
  
        message: "Password reset successfully",
  
        emailResponse,
  
        updateResponse,
  
      });
  
    } catch (error) {
  
      console.error(error);
  
      return res.status(500).json({
  
        message: "Unknown error occurred",
  
        error: error.message,
  
      });
  
    }
  
  });

//=======

require("dotenv").config();
const bcrypt = require("bcrypt");
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const app = express();

const port = 2000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/", (req, res, next) => {
  res.send("Hello, Welcome");
});

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
});

const menuSchema = new mongoose.Schema({
  menu: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
  },
});

const MenuModel = mongoose.model("menu", menuSchema);
const UserModel = mongoose.model("users", userSchema);

app.post("/register", async (req, res, next) => {
  let name = req.body.name;
  let email = req.body.email;
  let password = req.body.password;

  const hash = await bcrypt.hash(password, 10);
  UserModel.create({
    name,
    email,
    password: hash,
  })
    .then((done) => {
      res.status(200).json({
        message: "Registration was successful",
      });
    })
    .catch((err) => {
      let msg = err;
      if (err.hasOwnProperty("code") && err.code == "11000") {
        msg =
          "Email has been used by another user, please change your email address";
      }

      res.status(500).json({
        message: "Registration was not successful",
        err: msg,
      });
    });
});

app.post("/login", async (req, res, next) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    // Find the user by email
    if (!email || !password) {
      return res.status(404).json({
        message: "Email and password required",
      });
    }
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Compare the entered password with the hashed password in the database
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (isPasswordMatch) {
      return res.status(200).json(user);
    } else {
      return res.status(401).json({
        message: "Incorrect password",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Unknown error occurred",
      error: error.message,
    });
  }
});

//ADD MENU//
app.post("/login/menu", (req, res, next) => {
  var menu = req.body.menu;
  var email = req.body.email;
  var password = req.body.password;

  UserModel.findOne({ email }) // Use findOne to check if the user exists
    .then((user) => {
      if (!user) {
        res.status(401).json({
          message: "User not found, please signup or check your email",
        });
      } else {
        if (user.password === password) {
          MenuModel.create({
            menu,
            user: user._id,
          })
            .then((done) => {
              res.status(200).json({
                message: "Menu item added successfully",
                done,
              });
            })
            .catch((err) => {
              res.status(500).json({
                message: "Failed to add menu item",
                err: err,
              });
            });
        } else {
          res.status(401).json({
            message: "Invalid password",
          });
        }
      }
    })
    .catch((err) => {
      res.status(500).json({
        message: "Unknown error occurred",
        err,
      });
    });
});

//UPDATE MENU BY ID
app.patch("/:id/updatemenu", (req, res, next) => {
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
});

//Find user by id//
//I will add authurization here

app.get("/:id", (req, res, next) => {
  const id = req.params.id;

  UserModel.findById(id)
    .then((user) => {
      if (!user) {
        res.status(404).json({ message: "User not found" });
      } else {
        res.status(200).json({ user });
      }
    })
    .catch((err) => {
      res.status(500).json({ message: "Unknown error occurred", err });
    });
});

//LIST MENU BY ID//
app.post("/:id/listmenu", (req, res, next) => {
  const id = req.params.id;

  MenuModel.findById(id)
    .then((menu) => {
      if (!menu) {
        res.status(404).json({ message: "Menu not found" });
      } else {
        res.status(200).json({ menu });
      }
    })
    .catch((err) => {
      res.status(500).json({ message: "Unknown error occurred", err });
    });
});

// // CHANGE PASSWORD//
// app.patch("/change-password", (req, res, next) => {
//   var email = req.body.email;
//   let newPassword = req.body.password;
//   UserModel.updateOne({ email }, { password: newPassword })
//     .then((done) => {
//       if (done.nModified === 0) {
//         res.status(200).json({
//           message:
//             "Update was successful, but no modification was made. Please enter a different password.",
//         });
//       } else {
//         res.status(200).json({
//           message: "Password changed was successful",
//         });
//       }
//     })
//     .catch((err) => {
//       res.status(500).json({
//         message: "Unknown error occurred",
//         err,
//       });
//     });
// });

// UPDATE USER INFORMATIONS //
app.patch("/update", (req, res, next) => {
  let email = req.body.email;
  let newData = {};

  if (req.body.hasOwnProperty("name")) {
    newData.name = req.body.name;
  }

  if (req.body.hasOwnProperty("password")) {
    newData.password = req.body.password;
  }

  UserModel.updateOne({ email }, newData)
    .then((done) => {
      let message = "update was successful";
      if (done.hasOwnProperty("modifiedCount") && done.modifiedCount == 0) {
        message =
          "update was successful, but no modification was made. please enter a different data from the existing ones";
      }
      res.status(200).json({
        message,
        done,
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: "unknown error occurred",
      });
    });
});

//FORGET PASSWORD //

app.post("/forgot-password", async (req, res, next) => {
  try {
    let userEmail = req.body.email;
    let newPassword = req.body.password;

    const token = crypto.randomBytes(10).toString("hex");

    if (!userEmail) {
      return res.status(500).json({
        message: "No email found, please check your email and try again",
      });
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
    });

    const mail = {
      from: "backendtesting10",
      to: userEmail,
      subject: "Password Reset Request",
      text: `You have requested a password reset. Click on the following link to reset your password: http://localhost:2000/forgot-password?token=${token}`,
    };

    // Send email
    const emailResponse = await transporter.sendMail(mail);

    // Update user password
    await UserModel.updateOne({ userEmail }, { password: newPassword });

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
});

app.post("/change-password", async (req, res) => {
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
    const user = await UserModel.findOne({ email: userEmail });

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
});

// DELETE USER//
app.delete("/delete", (req, res, next) => {
  let { email, name, password } = req.body;

  UserModel.deleteOne({ email })
    .then((done) => {
      res.status(200).json({
        message: "deletion was successful",
        done,
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: "deletion failed",
      });
    });
});

mongoose
  .connect("mongodb://127.0.0.1:27017/hic")
  .then((done) => {
    console.log("DB connection was successful");
    app.listen(port, () => {
      console.log("server is ready on port", port);
    });
  })
  .catch((err) => {
    console.log(
      `an error occurred, hence the server was unable to start. ${err}`
    );
  });
