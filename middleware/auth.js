// с помощью данного middleware - будем проверять авторизацию
module.exports = function(req, res, next){
  if(!req.session.isAuthenticated){
    return res.redirect('/auth/login');
  }
  next();
};