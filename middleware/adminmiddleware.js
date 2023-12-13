const checkUserRole= (role) => {
    return (req, res, next) => {
        if(req.user && req.user.role === role){

            next();
        }else {
            res.statu(403).json({error: 'Access Denied, only the ADMIN can perform this fuctions'})
        }
    }
}