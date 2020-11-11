/**
 * Module dependencies.
 */

var express = require('../../');
var path = require('path');

var app = module.exports = express();

// Зарегистрировать EJS по состоянию .HTML-код. Если
// бы мы не называли это, нам нужно было бы
// назвать наши взгляды foo.ejs вместо foo.html
// . Метод __express
// - это просто функция, которую движки
// используют для подключения к системе Express view по
// умолчанию, поэтому, если мы хотим
// изменить "foo.js" чтобы "foo.html"
// мы просто передаем функции _любой_, в этом
// случае `EJS по.__экспресс

app.engine('.html', require('ejs').__express);

// Optional since express defaults to CWD/views

app.set('views', path.join(__dirname, 'views'));

// Path to our public directory

app.use(express.static(path.join(__dirname, 'public')));

// Without this you would need to
// supply the extension to res.render()
// ex: res.render('users.html').
app.set('view engine', 'html');

// Dummy users
var users = [
  { name: 'tobi', email: 'tobi@learnboost.com' },
  { name: 'loki', email: 'loki@learnboost.com' },
  { name: 'jane', email: 'jane@learnboost.com' }
];

app.get('/', function(req, res){
  res.render('users', {
    users: users,
    title: "EJS example",
    header: "Some users"
  });
});

/* istanbul ignore next */
if (!module.parent) {
  app.listen(3000);
  console.log('Express started on port 3000');
}
