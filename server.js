const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/voluntarios.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'voluntarios.html'));
});

app.get('/registrosoli.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'registrosoli.html'));
});

app.use(require('./outh')); 

app.use(require('./solicitudes'));

app.listen(3000, () => {
  console.log('🚀 Servidor Modular corriendo en http://localhost:3000');
});