const express = require('express');
const compression = require('compression');
const bodyParser = require('body-parser');
const cors = require("cors");

const app = express();
app.use(express.json(), compression(), bodyParser.json(), cors());

const mongoose = require('mongoose')
mongoose.connect(process.env.mongoose, { useNewUrlParser: true, useUnifiedTopology: true });

app.post('/auth', (req, res) => {
  const RequestIP = req.headers['x-forwarded-for']?.split(',').shift() || req.socket?.remoteAddress
  const getService = require('./services/auth.js');
  getService.main(RequestIP, req.body, res);
});

app.listen(8080, () => {
  console.log('[AxonLAB] Service is running.')
});
