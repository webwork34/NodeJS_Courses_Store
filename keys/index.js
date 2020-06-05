// определим в каком режиме мы находимся - разработка или продакшн
// NODE_ENV специальное хначение, которое добавляют хостинг провайдеры
if (process.env.NODE_ENV === 'production') {
  module.exports = require('./keys.prod');
}else{
  module.exports = require('./keys.dev');
}