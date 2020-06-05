const {Schema, model} = require('mongoose');

// создадим пользователя
const userSchema = new Schema({
  email: {
    type: String,
    required: true
  },
  name: String,
  password: {
    type: String,
    required: true
  },
  
  avatarUrl: String,
  
  // поля для восстановления пароля
  resetToken: String,
  resetTokenExp: Date,

  // опишем поле корзины
  cart: {
    // опишем те эл-ты, которые относятся к корзине
    // эл-ты будем хранить в массиве items
    items: [
      {
        count: {
          type: Number,
          required: true,
          default: 1
        },
        // будем хранить не инфо о курсе, а референцию к какому либо курсу
        // сейчас будем делать связку между различными таблицами в БД
        courseId: {
          type: Schema.Types.ObjectId,
          // укажем референцию - свяжем этот курс с табл курсов
          // название должно совпадать с тем, которое задавали в 
          // функции model в models/courses.js
          ref: 'Course', 
          required: true,
        }
      }
    ]
  }
});

// таким способом можем определить любой метод, который вынесет логику
// прямо в обьект пользователя. Опишем логику, которая будет добавлять
// какой-то эл-т в корзину
userSchema.methods.addToCart = function(course){
  // склонируем массив items у cart
  const clonedItems = [...this.cart.items];
  // в клонированом массиве нужно найти тот курс, с которым сейчас работаем,
  // точнее - найти его index
  const idx = clonedItems.findIndex(c => {
    // обязательно вызвать toString(), чтобы было корректное сравнение
    return c.courseId.toString() === course._id.toString();
  });

  
  // если idx >= 0 - значит, что в корзине уже есть такой курс и 
  // будем увеличивать count
  if(idx >= 0){
    clonedItems[idx].count += 1;

    // если idx === -1 - значит, что элемента нет в корзине
    // будем добавлять эл-т в корзину
  }else{
    clonedItems.push({
      courseId: course._id,
      count: 1
    });
  }

  this.cart = {items: clonedItems};
  // если поменть названия clonedItems --> items, то можно записать так
  // this.cart = {items};

  return this.save();
};

// напишем метод удаления курса с корзины
userSchema.methods.removeFromCart =  function(id){
  // склонируем массив items у cart
  let items = [...this.cart.items];

  // создадим id курса в массиве items, который должны найти
  const idx = items.findIndex(c => {
    // courseId берется из схемы
    // обязательно привести к строке
    return c.courseId.toString() === id.toString();
  });

  if(items[idx].count === 1){
    items = items.filter(c => c.courseId.toString() !== id.toString());
  }else{
    items[idx].count--;
  }

  this.cart = {items};
  return this.save();
};

// создадим метод для чистки корзины, после оформления заказа
userSchema.methods.clearCart =  function(){
  this.cart = {items: []};
  return this.save();
};

// экспортируем функцию model, где регистрируем новую модель User
// со схемой userSchema
module.exports = model('User', userSchema);