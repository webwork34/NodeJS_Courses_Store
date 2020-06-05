const {Router} = require('express');
// подключим validationResult для проверки ошибок
const {validationResult} = require('express-validator');
const Course = require('../models/course');
const auth = require('./../middleware/auth');
const {courseValidators} = require('./../utils/validators');
const router = Router();

// создадим ф-ю проверки
function isOwner(course, req){
  return course.userId.toString() === req.user._id.toString();
}

// отображение курсов
router.get('/', async (req, res) => {
  // у модели курсов присутствует метод find(), если оставить без параметров -
  // будет означать, что забираем все курсы, которые есть в БД
  // это встроенные методы в mongoose
  // так как связь между 2мя таблицами уже настроена, то можно воспользоваться
  // методом .populate('userId') и указываем какое поле необходимо
  // "популейтить" - преобразует поле userId с идентификатора (обычного Id) в
  // обьект user - где хранятся все данные по пользователю
  // далее используем метод .select('price title img'), чтобы указать,
  // какие поля хотим достать. В данном случае применится к курсам,
  // для юзера укажем 2м параметром
  try{
    const courses = await Course.find()
    .populate('userId', 'email name')  // 2м параметром укаже какие поля хотим достать у user
    .select('price title img');
    
    res.render('courses', {
      title: 'Курсы',
      isCourses: true,
      // передадим того пользователя, который сейчас активен в сессии
      // так же проверить - авторизован ли user
      userId: req.user ? req.user._id.toString() : null,
      courses
    });
  }catch(error){
    console.log(error);
  }
});

// страницв редактирования курса
router.get('/:id/edit', auth, async (req, res) => {
  if (!req.query.allow) {
    return res.redirect('/');
  }

  try {
    // находим курс по id
    const course = await Course.findById(req.params.id);  

    // запретим заходить на страницу, если id Не совпадают
    if (!isOwner(course, req)) {
      return res.redirect('/courses');
    }

    res.render('course-edit', {
      title: `Редактировать ${course.title}`,
      course
    });
  } catch(error) {
    console.log(error);
  }
});

// функциональный запрос редактирования
router.post('/edit', auth, courseValidators, async (req, res) => {
    // получим id в отдельную переменную
    const {id} = req.body;

    try {
      // удалим id из обьекта update
      delete req.body.id;

      // делаем защиту редактирования
      // запретим заходить на страницу, если id Не совпадают
      const course = await Course.findById(id);
      if (!isOwner(course, req)) {
        return res.redirect('/courses');
      }

      Object.assign(course, req.body);
      await course.save();

      res.redirect('/courses');
    } catch (error) {
      console.log(error);
    }
});

// открытие курса в новом окне
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    res.render('course', {
      layout: 'empty',
      title: `Курс ${course.title}`,
      course
    });
  } catch (error) {
    console.log(error);
  }
});

// добавим новый обработчик события удаления курса
router.post('/remove', auth, async (req, res) => {
  // пропишем логику, которая позволит удалить курс
  try{
    await Course.deleteOne({
      _id: req.body.id,
      // если userId не совпадет - не сможем удалить
      userId: req.user._id
    });
    res.redirect('/courses');
  }catch(error){
    console.log(error);
  }
});

module.exports = router;