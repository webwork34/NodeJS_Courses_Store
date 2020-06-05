module.exports = function(req, res, next){
  // для того, чтобы добавить какие-то данные, которые с каждым ответом будут
  // отдаваться обратно в шаблон. isAuth - можно назвать как угодно
  res.locals.isAuth = req.session.isAuthenticated;

  // добавим новую переменную для защиты данных
  res.locals.csrf = req.csrfToken();

  // после того, как добавили новую переменную - вызовем next(), чтобы
  // продолжить цепочку выполнения middleware
  next();
};