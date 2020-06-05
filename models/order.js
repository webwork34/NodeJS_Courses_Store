const {Schema, model} = require('mongoose');

const orderSchema = new Schema({
  // передаем роля, которые будут присутствовать у заказов
  // какие курсы были куплены и
  // какой пользователь сделал заказ и
  // дата, когда был сделан заказ
  courses: [
    {
      course: {
        type: Object,
        required: true
      },
      count: {
        type: Number,
        required: true
      }
    }
  ],
  user: {
    name: String,
    // userId - референция на модель пользователя
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  date: {
    type: Date,
    default: Date.now
  }
});


module.exports = model('Order', orderSchema);