const {body} = require('express-validator');
const User = require('./../models/user');

// для страницы регистрации обьект будет называться registerValidators
exports.registerValidators = [
  // зададим выводимое сообщение
  body('email')
    .isEmail()
    .withMessage('Введите корректный email')
    // добавим кастомный асинхронный валидатор
    .custom(async (value, {req}) => {
      try {
        // проверим, есть ли такой пользователь в БД
        const candidate = await User.findOne({email: value});
        // далее необходимо вернуть promise - потому что операция 
        // асинхронная и требует определенное время
        if (candidate) {
          return Promise.reject(`${value} уже занят`);
          // после этого валидаторы будут ждать, пока promise завершится
          // и только после этого выдаст какой-то рез-т
        }

      } catch (error) {
        console.log(error);
      }
    })
    // добавим sanitizer normalizeEmail для нормализации email, 
    // если написали что-то криво
    // нужно настраивать
    .normalizeEmail({
      gmail_remove_dots: false,
      gmail_remove_subaddress: false,
      yahoo_remove_subaddress: false,
      icloud_remove_subaddress: false
    }),  
   

  // добавим валидаторы для других полей
  // isLength - зададим мин и макс длину пароля
  // isAlphanumeric - чтобы пароль состоял из цифер и букв
  // 2й способ вывода текста ошибки - передать 2м параметром в body
  body('password', 'Пароль должен быть минимум 6 символов')
    .isLength({min: 6, max: 56})
    .isAlphanumeric()
    // добавим sanitizer trim(), для удаления лишних пробелов
    .trim(),

  // валидация поля, которое повторяет пароль
  // для этого воспользуемся валидатором, который напишем сами
  // вызывается через ф-ю custom, в данную ф-ю передаем callback,
  // где будем писать логику данного валидатора
  // value равно тому, что написано в поле confirm
  body('confirm')
    .custom((value, {req}) => {
      if (value !== req.body.password) {
        throw new Error('Пароли должны совпадать');
      }
      return true;
    })
    .trim(),

  // добавим валидатор для поля name
  body('name').isLength({min: 3})
    .withMessage('Имя должно быть минимум 3 символа')
    .trim()
];

// будем описывать все валидаторы для формы add
exports.courseValidators = [
  body('title')
    .isLength({min: 3})
    .withMessage('Минимальная длина названия 3 символа')
    .trim(),
  body('price')
    // проверим, что это точно число
    .isNumeric()
    .withMessage('Введите корректную цену'),
  body('img')
    // проверим, является ли строка URL адрессом
    .isURL()
    .withMessage('Введите корректный URL картинки')
];