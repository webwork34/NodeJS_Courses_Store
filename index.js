const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
// подключим переменную, для добавления защиты
const csrf = require('csurf');
// подключим пакет для обработки ошибок
const flash = require('connect-flash');
// подключим пакет для защиты
const helmet = require('helmet');
// подключим пакет для компрессии файлов
const compression = require('compression');
const Handlebars = require('handlebars');
const {allowInsecurePrototypeAccess} = require('@handlebars/allow-prototype-access');
const session = require('express-session');
// возвращает определенную ф-ю, которую должны вызвать, куда передаем тот пакет
// который будем использовать для синхронизации. После этого данный конструктор 
// вернет класс, который сможем использовать
const MongoStore = require('connect-mongodb-session')(session);
const exphbs = require('express-handlebars');
const homeRoutes = require('./routes/home');
const addRoutes = require('./routes/add');
const cardRoutes = require('./routes/card');
const coursesRoutes = require('./routes/courses');
const ordersRoutes = require('./routes/orders');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const varMiddleware = require('./middleware/variables');
const userMiddleware = require('./middleware/user');
const errorHandler = require('./middleware/error');
// подключим новый middleware для загрузки файлов
const fileMiddleware = require('./middleware/file');
const keys = require('./keys/index');  
//  /index можно не писать, по умолчанию будет смотреть этот файл

const PORT = process.env.PORT || 3000;

const app = express();
const hbs = exphbs.create({
  defaultLayout: 'main',
  extname: 'hbs',

  handlebars: allowInsecurePrototypeAccess(Handlebars),
  // передадим доп пар-р для скрытия кнопки редактирования
  helpers: require('./utils/hbs-helpers')
});

// создадим класс MongoStore
const store = new MongoStore({
  // определим коллекцию(таблицу) в БД, где будем хранить все сессии
  collection: 'sessions',
  // передадим url адресс БД
  uri: keys.MONGODB_URI
});


app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', 'views');

app.use(express.static(path.join(__dirname, 'public')));
// сделаем статической папку images
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(express.urlencoded({extended: true}));

// настроим сессию
app.use(session({
  // secret - строка, на основе которой сессия будет шифроваться
  //  'some secret value' - вынесим в config
  // secret: 'some secret value',
  secret: keys.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store
}));

// подключим новый middleware для загрузки файлов
// single говорит, что мы загружаем всего 1 файл
// в этот метод передаем название того поля, куда файл будет складываться
app.use(fileMiddleware.single('avatar'));

// Добавим переменную csrf как middleware для защиты
app.use(csrf());
// добавим niddleware для обработки ошибок
app.use(flash());
// подключим helmet для защиты
app.use(helmet());
// подключим compression для компресии файлов
app.use(compression());
app.use(varMiddleware);
app.use(userMiddleware);

// ========== регистрация роутов ==========
app.use('/', homeRoutes);
app.use('/add', addRoutes);
app.use('/courses', coursesRoutes);
app.use('/card', cardRoutes);
app.use('/orders', ordersRoutes);
app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use(errorHandler);

// подключимся к mongoDB с помощбю mongoose
// делаем эту ф-ю, чтобы можно было использовать async-await, чтобы более комфортно рабоать с промисами
async function start(){
  try{
    await mongoose.connect(keys.MONGODB_URI, {
      useUnifiedTopology: true, 
      useNewUrlParser: true,
      useFindAndModify: false  
    });

    // и потом запускаем наше приложение, чтобы на момент запуска приложения,
    // уже точно была доступна DB
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  }catch(error){
    console.log(error);
  }
}

start();
