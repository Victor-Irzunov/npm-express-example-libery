/* 
 * Зависимости модулей
 */
var express = require('../..');
var hash = require('pbkdf2-password')()
var path = require('path');
var session = require('express-session');

var app = module.exports = express();

// config

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// промежуточный слой

app.use(express.urlencoded({ extended: false }))
app.use(session({
  resave: false, // не сохраняйте сеанс, если он не изменен
  saveUninitialized: false, // не создавайте сеанс до тех пор, пока что-то не сохранится
  secret: 'str22, very secret'
}));

// Промежуточное программное обеспечение для сохраняемых сообщений сеанса

app.use(function(req, res, next){
  var err = req.session.error;
  var msg = req.session.success;
  delete req.session.error;
  delete req.session.success;
  res.locals.message = '';
  if (err) res.locals.message = '<p class="msg error">' + err + '</p>';
  if (msg) res.locals.message = '<p class="msg success">' + msg + '</p>';
  next();
});

// фиктивная база данных

var users = {
  tj: { name: 'tj' }
};

// когда вы создаете пользователя, сгенерируйте соль
// и хэшируйте пароль ('foobar' - это пропуск здесь)

hash({ password: 'foobar' }, function (err, pass, salt, hash) {
  if (err) throw err;
  // храните соль и хэш в "БД"
  users.tj.salt = salt;
  users.tj.hash = hash;
});


// Аутентифицируйтесь, используя нашу базу данных простых объектов doom!

function authenticate(name, pass, fn) {
  if (!module.parent) console.log('--58--authenticating %s:%s', name, pass);
  var user = users[name];
  // запрос к БД для данного пользователя
  if (!user) return fn(new Error('cannot find user'));
  // примените тот же алгоритм к опубликованному паролю, применив
  // хэш против паса / соли, если есть совпадение мы
  // найден пользователь
  hash({ password: pass, salt: user.salt }, function (err, pass, salt, hash) {
    if (err) return fn(err);
    if (hash === user.hash) return fn(null, user)
    fn(new Error('invalid password'));
  });
}

function restrict(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    req.session.error = 'Access denied!';
    res.redirect('/login');
  }
}

app.get('/', function(req, res){
  res.redirect('/login');
});

app.get('/restricted', restrict, function(req, res){
  res.send('Wahoo! restricted area, click to <a href="/logout">logout</a>');
});

app.get('/logout', function(req, res){
  // уничтожьте сеанс пользователя, чтобы выйти из него
  // будет воссоздан следующий запрос
  req.session.destroy(function(){
    res.redirect('/');
  });
});

app.get('/login', function(req, res){
  res.render('login');
});

app.post('/login', function(req, res){
  authenticate(req.body.username, req.body.password, function(err, user){
    if (user) {
      // Регенерация сеанса при входе в систему
      // чтобы предотвратить фиксацию
      req.session.regenerate(function(){
        // Хранить первичный ключ пользователя
        // в хранилище сеансов, которое будет извлечено,
        // или в этом случае весь объект пользователя
        req.session.user = user;
        req.session.success = 'Authenticated as ' + user.name
          + ' click to <a href="/logout">logout</a>. '
          + ' You may now access <a href="/restricted">/restricted</a>.';
        res.redirect('back');
      });
    } else {
      req.session.error = 'Authentication failed, please check your '
        + ' username and password.'
        + ' (use "tj" and "foobar")';
      res.redirect('/login');
    }
  });
});

/* Стамбул игнорирует следующий */
if (!module.parent) {
  app.listen(3000);
  console.log('Express started on port 3000 -----------------');
}
