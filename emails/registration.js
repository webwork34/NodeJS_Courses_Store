const keys = require('./../keys');

module.exports = function(email, name){
  return {
    to: email,
    from: keys.EMAIL_FROM,
    subject: 'Аккаунт создан',
    html: `
      <h1>Добро пожаловать в наш магазин</h1>
      <p>Уважаемый ${name}, Вы успешно создали аккаунт с email - ${email}</p>
      <hr/>
      <a href="${keys.BASE_URL}">Магазин курсов</a>
    `
  };
};