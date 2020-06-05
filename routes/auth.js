const {Router} = require('express');
// подключим пакет для шифрования пароля
const bcrypt = require('bcryptjs');
// подключим встроенную библиотеку, для генерирования рендомного ключа
const crypto = require('crypto');
// подключим определенные обьекты для валидации
// validationResult - с помощью этой ф-и будем получать ошибки, 
// если они будут присутствовать
const {validationResult} = require('express-validator');
// подключим пакеты для отправки писем
const nodemailer = require('nodemailer');
const sendgrid = require('nodemailer-sendgrid-transport');
const User = require('./../models/user');
const keys = require('./../keys');
// подключим письмо регистрации
const regEmail = require('./../emails/registration');
// подключим письмо сброса пароля
const resetEmail = require('./../emails/reset');
const {registerValidators} = require('./../utils/validators');

const router = Router();

// создадим транспортер для отправки писем
// в createTransport должны передать тот сервис, которым пользуемся -
// sendgrid и в него передаем обьект конфигураций
const transporter = nodemailer.createTransport(sendgrid({
  auth: {api_key: keys.SENDGRID_API_KEY}
}));

// реализуем роут /login
router.get('/login', async (req, res) => {
  res.render('auth/login', {
    title: 'Авторизация',
    isLogin: true,
    // передадим ошибку на клиента
    // данная штука будет работать как getter. flash хранит все данные 
    // в сессии и со временем они удалятся
    loginError: req.flash('loginError'),
    registerError: req.flash('registerError')
  });
});

// реализуем роут /logout
router.get('/logout', async (req, res) => {
  // очистим сессию
  // req.session.isAuthenticated = false;  1й способ
  // 2й способ более элегантный
  req.session.destroy(() => {
    res.redirect('/auth/login#login');
  });
});

// обработаем нажатие на кнопку login (Войти)
router.post('/login', async (req, res) => {
  try{
    const {email, password} = req.body;
    // когда делаем логин - необходимо проверить, существует ли такой пользователь
    // попробуем его найти, с помощью модели пользователя (User)
    const candidate = await User.findOne({email});
    if(candidate){
      // если такой кандидат(email) существует - проверим пароли на совпадение
      // candidate.password - пароль, который получаем из базы данных
      // после шифрования - сравнение паролей происходит с помощью 
      // метода bcrypt.compare()
      const isSame = await bcrypt.compare(password, candidate.password);
      if(isSame){
        // если isSame === true - можем делать redirect на страницу системы
        req.session.user = candidate;
        req.session.isAuthenticated = true;
        // данные операции (2 сверху), могут быть выполнены после того, 
        // как произойдет redirect (могут не успеть заполниться в сессию),
        // из-за этого, когда делаем redirect на главную страницу, могут быть определенные ошибки
        // для того, чтобы не получать данные ошибки - воспользуемся функционалом ниже
        req.session.save(err => {
          if (err) throw err;
          res.redirect('/');
        });
      }else{
        // вывидем ошибку, если password не совпадает
        req.flash('loginError', 'Неверный пароль');
        res.redirect('/auth/login#login');
      }
    }else{
      // вывидем ошибку, если введенный email не существует
      req.flash('loginError', 'Такого пользователя не существует');
      res.redirect('/auth/login#login');
    }
  }catch(error){
    console.log(error);
  }
  
});

// реализуем регистрацию, чтобы создавать новых пользователей
// допишем валидатор body('email').isEmail Внутри указываем то поле,
// которое подлежит валидации. И далее можно вызывать валидаторы, 
// которые присутствуют в пакете
router.post('/register',  registerValidators, async (req, res) => {
  try{
    // создадим нового пользователя на основе тех данных, 
    // которые передаем из формы. Все это находится в 
    // обьекте req.body, и заберем определенные поля
    const {email, password, name} = req.body;

    // сначала проверим, существует ли пользователь с таким email как мы ввели
    // если существует - выдать ошибку
    // utils/validators.js
    // отследим ошибки валидации
    const errors = validationResult(req);
    // errors.isEmpty() вернет true, если нет ошибок
    if (!errors.isEmpty()) {
      // если что-то есть в ошибках - должны показать сообщение
      req.flash('registerError', errors.array()[0].msg);
      // далее нужно прекратить выполнение данной ф-и и задать 
      // статус ответа 422 - который говорит, 
      // что есть какие-то ошибки валидации
      return res.status(422).redirect('/auth/login#register');
    }

    // если такого пользователя нет - его нужно создать
    // в модель пользователя будем передавать пароль
    // который получим путем шифрования - hashPassword
    // 1м параметром передаем пароль
    // 2м - дополнительная рендомная строка, которая помогает 
    // зашифровать пароль более сложно. Чем больше строка - тем сложнее
    // взломать пароль, но чем больше символов впишем - 
    // тем дольше буде происходить шифрование
    // оптимально выбирать 10-12
    // метод hash() - возвращает promise, поэтому пишем await
    const hashPassword = await bcrypt.hash(password, 10);
    const user = new User({
      // добавим поля, переданные из формы регистрации
      email,
      password: hashPassword,
      name,
      // добавим корзину по умолчанию
      cart: {items: []}
    });
    // после этого подождем, пока пользователь сохранится
    await user.save();
    // и когда пользователь будет создан делаем redirect
    res.redirect('/auth/login#login');
    // отправим письмо пользователю, что аккаунт создан
    // regEmail - импортируем с ./../emails/registration
    // возвращает promise, поэтому пишем await
    // рекомендуется использовать после redirect, чтобы пользователь
    // не ждал, пока отправится письмо
    await transporter.sendMail(regEmail(email, name));

  }catch(error){
    console.log(error);
  }
});

// реализуем страницу сброса пароля
router.get('/reset', (req, res) => {
  res.render('auth/reset', {
    title: 'Забыли пароль?',
    // ошибку, которую передаем - достаним из flash
    error: req.flash('error')
  });
});

// реализуем нажатие кноки сброса пароля
router.post('/reset', (req, res) => {
  try{
    // сгенерируем рандомный ключ с помощью встроенной библтотеки - crypto
    // 1м параметром указываем, сколько символов байт нужно
    // далее описываем ф-ю callback, тогда, когда данный ключ будет сгенерирован
    crypto.randomBytes(32, async (err, buffer) => {
      if(err){
        // если не смогли сгенерировать ключ
        req.flash('error', 'Что-то пошло не так, повторите попытку позже');
        return res.redirect('/auth/reset');
      }

      // необходимо получить тот токен, который создали
      const token = buffer.toString('hex');

      // далее нужно убедиться, что тот email, который отправили с клиента
      // соответствует какому-либо email в БД. У модели User будем 
      // спрашивать есть ли такой пользователь вообще в системе
      const candidate = await User.findOne({email: req.body.email});

      if(candidate){
        // если нашли кандидата - отправим ему письмо
        candidate.resetToken = token;
        // зададим время жизни токена - 1 час
        candidate.resetTokenExp = Date.now() + 60 * 60 * 1000;
        // подождем, пока кандидат будет сохранен, потому что необходимо
        // занести данные в БД
        await candidate.save();
        // после этого, отправляем новое письмо 
        // в sendMail передадим специальный mail
        await transporter.sendMail(resetEmail(candidate.email, token));
        res.redirect('/auth/login');
      }else{
        req.flash('error', 'Такого email нет');
        res.redirect('/auth/reset');
      }
    });
  }catch(error){
    console.log(error);
  }
});

// реализуем страницу ввода нового пароля
router.get('/password/:token', async (req, res) => {
  // вместо того, чтобы просто рендерить страницу - 
  // будем передавать определенные данные для еще большей защиты
  // потому что подобные страницы легко подделать. Для большей защиты
  // сделаем максимальное кол-во параметров
  if(!req.params.token){
    // если в обьекте req.params нет параметра token - то такую страницу
    // не будем допускать к открытию
    return res.redirect('/auth/login');
  }

  try{
    // после этого нужно найти пользователя, у которого есть такой токен в БД
    // найти пользователя с условиями
    const user = await User.findOne({
      // resetToken должен совпадать с тем токеном, который 
      // находится в обьекте req.params
      resetToken: req.params.token,
      // дальше нужно убедиться, что он еще валидный
      resetTokenExp: {$gt: Date.now()}
    });
    
    // дальше, если нет такого пользователя
    if(!user){
      return res.redirect('/auth/login');
    }else{
      // если пользователь найден
      res.render('auth/password', {
        title: 'Восстановить доступ',
        // ошибку, которую передаем - достаним из flash
        error: req.flash('error'),
        // передадим еще несколько параметров для доп защиты
        userId: user._id.toString(),
        token: req.params.token
        // userId и token - необходимо обработать на странице passworda
      });
    }

  }catch(error){
    console.log(error);
  }
});

// реализуем нажатие кнопки сбросить
router.post('/password', async (req, res) => {
  try{
    // сначала проверяем наличие пользователя с данными userId и token
    // которые находятся в input-ах
    const user = await User.findOne({
      // пытаемся найти пользователя, у которого _id должен совпадать с
      // req.body.userId - input из формы в котором хранится значение userId
      _id: req.body.userId,
      // так же еще раз проверяем валидацию токена
      resetToken: req.body.token,
      // resetTokenExp должен быть > чем Date.now()
      resetTokenExp: {$gt: Date.now()}
    });

    if(user){
      // если user найден - зададим ему новый пароль
      // обращаемся к user.password и должны снова зашифровать новый пароль
      user.password = await bcrypt.hash(req.body.password, 10);
      // после этого удаляем все данные, которые относятся к токену восстановления
      user.resetToken = undefined;
      user.resetTokenExp = undefined;
      // после этого ждем, пока пользователь сохраниться
      await user.save();
      res.redirect('/auth/login');
    }else{
      // если пользователь не найден
      // вывод ошибки
      req.flash('loginError', 'Время жизни токена истекло');
      // редирект на страницу
      res.redirect('/auth/login');
    }

  }catch(error){
    console.log(error);
  }
});

module.exports = router;