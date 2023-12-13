

const jwt = require("jsonwebtoken");
const Middlewareauthentication =(req, res, next) => {

    const authHeader = req.headers.authorization;

    if(!authHeader || !authHeader.startsWith("Bearer")){
        return res.status(401).json({error: "Bearer Token Not Found"});
    }
    
    const Token = authHeader.split(" ")[1];

    if(!Token){
        res.status(401).json({Error: "Token not found"});
    }

    try{

        const decode = jwt.verify(Token, process.env.JWT_SECRET);
        const { id,  email, role} = decode;

        console.log(decode)
        req.user = {  id,  email, role};

        next();
    }catch(error){

        res.status(401).json({error: "Access Denied"});
    }
};
// Middleware for checking user role
const checkUserRole= (role) => {
    return (req, res, next) => {
        if(req.user && req.user.role === role){

            next();
        }else {
            res.status(403).json({error: `Unauthorized: Access Denied, only the ${role}s can perform this fuctions`})
        }
    }
}

// Middleware for sending confirmation token to admin email

const sendConfirmationEmailToAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.MA_USER, 
          pass: process.env.MA_PASSWORD, 
        },
      });
  
      const mailOptions = {
        from:  process.env.MA_USER, 
        to: 'gdollar29@yahoo.com', 
        subject: 'Admin Confirmation',
        text: 'You have been confirmed as an admin.',
      };
  
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error(error);
          res.status(500).json({ error: 'Error sending confirmation email.' });
        } else {
          console.log('Email sent: ' + info.response);
          next();
        }
      });
    } else {
      next();
    }
  };

module.exports ={ Middlewareauthentication, checkUserRole, sendConfirmationEmailToAdmin}