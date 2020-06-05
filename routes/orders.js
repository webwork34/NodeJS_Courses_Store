const {Router} = require('express');
const Order = require('./../models/order');
const auth = require('./../middleware/auth');
const router = Router();

// отрендерим страницу  получение списка ордеров
router.get('/', auth, async (req, res) => {
  try{
    // получим список всех ордеров, которые относятся к нашему id пользователя
    const orders = await Order.find({
      // 'user.userId' - структура в моделе models/order.js
      // req.user._id - текущий id
      'user.userId': req.user._id
    })
    .populate('user.userId');

    res.render('orders', {
      isOrder: true,
      title: 'Заказы',
      // на front-end будем передавать массив orders
      orders: orders.map(o => {
        return {
          ...o._doc,
          price: o.courses.reduce((total, c) => {
            return total += c.count * c.course.price;
          }, 0)
        };
      })
    });
  }catch(error){
    console.log(error);
  }
});

// обработаем POST запросы на страницу routes/orders.hbs
// создание ордера 
router.post('/', auth, async (req, res) => {
  try{
     // сначала получим все, что есть в корзине
    const user = await req.user
    // вызовим populate, чтобы превратить id курсов в обьекты
      .populate('cart.items.courseId')
      .execPopulate();

    //получаем читаемый формат курсов
    const courses = user.cart.items.map(i => ({
      count: i.count,
      course: {...i.courseId._doc}  //делаем операцию spread, чтобы развернуть весь обьект
    }));

    const order = new Order({
      user: {
        name: req.user.name,
        userId: req.user
      },
      courses: courses
    });

    // подождем, пока создастся новый заказ
    await order.save();
    // после создания заказа - корзину необходимо почистить
    // clearCart - создадим в моделе user.js
    await req.user.clearCart();

    res.redirect('/orders');

  }catch(error){
    console.log(error);
  }
});

module.exports = router;