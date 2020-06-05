const {Router} = require('express');
// подключим validationResult для проверки ошибок
const {validationResult} = require('express-validator');
const Course = require('./../models/course');
// подключим ф-ю auth
// для того, чтобы ее применить - передаем его по очереди в роуты,
// которые необходимо скрыть для неавторизованых пользователей
const auth = require('./../middleware/auth');
const {courseValidators} = require('./../utils/validators');
const router = Router();

router.get('/', auth, (req, res) => {
  res.render('add', {
    title: 'Добавить курс',
    isAdd: true
  });
});

router.post('/', auth, courseValidators, async (req, res) => {
    // создадим переменную errors для проверки ошибок
    // и отследим ошибки валидации
    const errors = validationResult(req);

    // если есть ошибка
    if(!errors.isEmpty()){
       // статус ответа 422 - который говорит, 
      // что есть какие-то ошибки валидации
      return res.status(422).render('add', {
        title: 'Добавить курс',
        isAdd: true,
        error: errors.array()[0].msg,
        // передадим обьект data для того, чтобы поля не сбивались,
        // если допустили ошибку при заполнении формы
        data: {
          title: req.body.title,
          price: req.body.price,
          img: req.body.img
        }
      });
    }

    const course = new Course({
      title: req.body.title,
      price: req.body.price,
      img: req.body.img,
      userId: req.user._id 
      // также можно сделать такую запись  userId: req.user
  });

  try{
    // метод save() идет в реальную БД и сохраняет данную модель в определенной колекции
    // возвращает promise - поэтому можем использовать await
    await course.save();
    res.redirect('/courses');
  }catch(error){
    console.log(error);
  }
  
});

module.exports = router;