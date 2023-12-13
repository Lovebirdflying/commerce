
    
    const user = users.find((user) => user.email === data.email);
    if(!user){
        res.status(401).json({err:"incorrect username"})
        
        return;
    } 
    //const passwordfound = users.find((user) => user.password === data.password);
      
    const db = user.password
    const PasswordMatch = await bcrypt.compare(data.password, user.password);
 
   if ( !PasswordMatch) {
  
 res.status(401).json({ error:"incorrect password" });

 return;
};

res.status(200).json({  user, PasswordMatch, message: "Login successful" });
 
}
