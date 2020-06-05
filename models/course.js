// ф-я model позволяет регистрировать и создавать новые модели на основе схемы
const {Schema, model} = require('mongoose');

// создадим новую схему
const courseSchema = new Schema({
  // описываем какие есть поля и что они обозначают
  title: {
    type: String,
    // данное поле обязательно для создания модели, без него будет ошибка
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  img: String,
  // поле id по умолчанию mongoose будет добавлять при создании новой модели
  // свяжем курс с пользователем
  userId: {
    type: Schema.Types.ObjectId,
    // укажем референцию на коллекцию пользователей
    // данная строка должна полностью совпадать с названием модели,
    // которую экспортируем из models/user.js -- module.exports = model('User', userSchema)
    ref: 'User'
  }
});

// опишем трансформацию id --> _id с помощью метода toClient
courseSchema.method('toClient', function(){
  const course = this.toObject();
  course.id = course._id;
  delete course._id;

  return course;
});

// 1м пар-м указываем название модели
// 2м параметром передаем схему
module.exports = model('Course', courseSchema);