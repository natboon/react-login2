var express = require('express')
var cors = require('cors')
var app = express()
var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()
const bcrypt = require('bcrypt')
const saltRounds = 10
var jwt = require('jsonwebtoken')
const secret = 'Login-2023'

app.use(cors())

const mysql = require('mysql2');
// create the connection to database
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'mydb'
  });

app.use(express.json())

app.post('/register', jsonParser, function (req, res, next) {
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    connection.execute(
      'INSERT INTO users (email, password, fname, lname) VALUES (?, ?, ?, ?)',
      [req.body.email, hash, req.body.fname, req.body.lname],
    function(err, results, fields) {
      if (err) {
        res.json({status: 'error', message: err})
        return
      }
      res.json({status: 'ok'})
    }
   );
 });
})

app.post('/login', jsonParser, function (req, res, next) {
  connection.execute(
    'SELECT * FROM users WHERE email=?',
    [req.body.email],
  function(err, users, fields) {
    if (err) {res.json({status: 'error', message: err}); return}
    if (users.length == 0) {res.json({status: 'error', message: 'no user found'}); return}
    bcrypt.compare(req.body.password, users[0].password, function(err, isLogin) {
    if (isLogin) {
      var token = jwt.sign({ email: users[0].email }, secret, { expiresIn: '1h' });
      res.json({status: 'ok', message: 'login seccess', token})
    } else {
      res.json({status: 'error', message: 'login failed'})
    }
    });
  }
 );
})

app.get('/', (req, res) => {
  res.json('Hello this is the backend!')
})

app.get('/books', (req, res) => {
  const q = "SELECT * FROM books"
  connection.query(q, (err,data) => {
    if(err) return res.json(err)
    return res.json(data)
  })
})

app.post('/books', jsonParser, (req, res) => {
  const q = "INSERT INTO books (`title`, `desc`, `price`, `cover`) VALUES (?)"
  const values = [req.body.title,
                  req.body.desc,
                  req.body.price,
                  req.body.cover,];

  connection.query(q, [values], (err, data) => {
    if(err) return res.json(err)
    return res.json("Book has been created successfully.")    
  })
})

app.delete("/books/:id", (req, res) => {
  const bookId = req.params.id;
  const q = " DELETE FROM books WHERE id = ? ";

  connection.query(q, [bookId], (err, data) => {
    if (err) return res.send(err);
    return res.json("Book has been deleted successfully.");
  });
});

app.put("/books/:id", (req, res) => {
  const bookId = req.params.id;
  const q = "UPDATE books SET `title` = ?, `desc` = ?, `price` = ?, `cover` = ?  WHERE id = ?";

  const values = [
    req.body.title,
    req.body.desc,
    req.body.price,
    req.body.cover,
  ]

  connection.query(q, [...values,bookId], (err, data) => {
    if (err) return res.send(err);
    return res.json("Book has been updated successfully.");
  });
});

app.get('/books/:id', (req, res) => {
  const id = req.params.id
  const q = "SELECT * FROM `books` WHERE `id`= ?"

  connection.query(q, [id], (err, data) => {
    if (err) return res.send(err);
    return res.json(data);
  });
})

app.listen(3333, () => {
  console.log('Connected to backend!')
})