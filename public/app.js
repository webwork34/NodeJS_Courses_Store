const toCurrency = price => {
  return price = new Intl.NumberFormat('ru-Ru', {
    currency: 'uah',
    style: 'currency'
  }).format(price);
};


// создадим ф-ю для красивого отображения даты на странице
const toDate = date => {
  return new Intl.DateTimeFormat('ru-Ru', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date(date));
};

document.querySelectorAll('.price').forEach(node => {
  node.textContent = toCurrency(node.textContent);
});

// вставим красивый формат даты на страницу
document.querySelectorAll('.date').forEach(node => {
  node.textContent = toDate(node.textContent);
});

// сначала нужно выяснить, есть ли такой эл-т <div id="card">
// $ используем, если хотим показать, что это или jQuery обьект или HTML эл-т
const $card = document.querySelector('#card');
if($card){
  $card.addEventListener('click', event => {
    // проверяем куда именно кликнули
    if(event.target.classList.contains('js-remove')){
      // получаем id того курса, который нужно обработать
      const id = event.target.dataset.id;

      // добавим новую переменную, для получения обьекта защиты - csrf 
      // из шаблона views/card.hbs
      const csrf = event.target.dataset.csrf;

      // далее нужно вызвать AJAX запрос с клиента и отправть его на сервер
      // для этого используем метод fetch()
      // указываем путь, по которому хотим совершить запрос
      // и добавляем id, чтобы можно было понять, какой именно курс(id) нужно удалить
      // 2м параметром fetch принимает обьект, который необходимо сконфигурировать
      fetch('/card/remove/' + id, {
        // специальный http метод, который говорит, что нужно удалять определенные эл-ты
        method: 'delete',
        // добавим header, с полем для защиты
        // также необходимо подправить шаблон во views/cart.hbs
        headers: {
          'X-XSRF-TOKEN': csrf
        }
      }).then(res => res.json())
      .then(card => {
        if(card.courses.length){
          // будем обновлять таблицу, если есть какойто контент.
          // сначала в цикле нужно сформировать все строчки tr
          const html = card.courses.map(c => {
            return `
              <tr>
                <td>${c.title}</td>
                <td>${c.count}</td>
                <td>
                  <button 
                    class="btn btn-small js-remove" 
                    data-id="${c.id}"
                    data-csrf="${csrf}"
                  >Удалить</button>
                </td>
              </tr>
            `;
          }).join('');
          $card.querySelector('tbody').innerHTML = html;
          $card.querySelector('.price').textContent = toCurrency(card.price);

        }else{
          // если контента нет
          $card.innerHTML = '<p>Корзина пуста</p>';
        }
      });
    }
  });
}

// инициализируем табы страница входа/авторизации
M.Tabs.init(document.querySelectorAll('.tabs'));