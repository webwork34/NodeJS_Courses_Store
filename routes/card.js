// получаем обьект роутрера из библиотеки express
const {Router} = require('express');
// подключаем модель Course
const Course = require('./../models/course');
const auth = require('./../middleware/auth');
// создаем роутер
const router = Router();

// создадим вспомогательную ф-ю, для корректного формирования курсов
function mapCartItems(cart){
  return cart.items.map(course => ({
    ...course.courseId._doc, 
    count: course.count,
    id: course.courseId.id
  }));
}

// создадим ф-ю для высчитывания цены, принимает массив courses
function computePrice(courses){
  return courses.reduce((total, course) => {
    return total += course.price * course.count;
  }, 0);
}

// добавление курса в корзину
router.post('/add', auth, async (req, res) => {
  // используем встроенный в mongoose метод - findById()
  const course = await Course.findById(req.body.id);

  // обратимся к req.user и вызовим метод .addToCart(course) в который
  // передадим курс, который создали. Данный метод будет асинхронным
  // (будет что-то сохранять в БД) - поэтому к нему будем применять await,
  // чтобы nodeJS подождал, пока выполнится данный запрос
  await req.user.addToCart(course);
  res.redirect('/card');
}); 

// удаление курса из корзины
router.delete('/remove/:id', auth, async (req, res) => {
  // req.params.id - params потому что берем id из адрессной строки
  await req.user.removeFromCart(req.params.id);
  // после удаления необхоимо вернуть на front-end обьект корзины
  // в том же формате, в котором она была до этого
  const user = await req.user
    .populate('cart.items.courseId')
    .execPopulate();

  // получим курсы в корзине
  const courses = mapCartItems(user.cart);

  // создадим обьект cart, который будем возвращать на front-end
  const cart = {
    courses,
    price: computePrice(courses)
  };

  res.status(200).json(cart);
});

// добавляем обработчик метода GET, заход на страницу корзины
router.get('/', auth, async (req, res) => {
  // получим корзину через модель пользователя
  const user = await req.user
    .populate('cart.items.courseId')
    .execPopulate();

  // получим курсы в корзине
  const courses = mapCartItems(user.cart);

  // рендерим страницу card
  res.render('card', {
    title: 'Корзина',
    isCard: true,
    courses: courses,
    price: computePrice(courses)
  });
});

// экспортируем роутер
module.exports = router;