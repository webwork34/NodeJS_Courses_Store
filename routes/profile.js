const {Router} = require('express');
const auth = require('./../middleware/auth');
const User = require('./../models/user');
const router = Router();

// auth добавляем для того, чтобы неавторизованные пользователи не имели 
// доступ к странице
router.get('/', auth, async (req, res) => {
  res.render('profile', {
    title: 'Профиль',
    isProfile: true,
    user: req.user.toObject()
  });
});

// реализуем роут загрузки файла
router.post('/', auth, async (req, res) => {
  try {
    // получим обьект пользователя, 
    // у которого будем изменять какие-то данные
    const user = await User.findById(req.user._id);
    const toChange = {
      // берется из поля input во views/profile.hbs
      name: req.body.name
    };

    // если в обьекте req есть поле, которое называется file
    // если есть файл в форме, то тогда будем изменять toChange.avatarUrl
    if (req.file) {
      toChange.avatarUrl = req.file.path;
    }

    // добавим новые поля обьекту user
    Object.assign(user, toChange);
    // далее подождем, пока пользователь сохраниться
    await user.save();
    // после того, как пользователь сохранится - делаем редирект
    res.redirect('/profile'); 
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;