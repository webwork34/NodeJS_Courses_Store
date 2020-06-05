const User = require('./../models/user');

module.exports = async function(req, res, next){
  // сначала проверим, нет ли в сессии какого-либо пользователя
  if(!req.session.user){
    // Тогда завершаем данный middleware с ф-ей next()
    return next();
  }

  // если данный пользоваетель есть, то тода будем в поле req.user 
  // складывать новую модель
  // await - потому что делаем запросс к базе
  // обращаемся к моделе пользователя и получаем пользователя по id
  req.user = await User.findById(req.session.user._id);
  next();
};