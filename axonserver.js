const express = require('express');
const compression = require('compression');
const bodyParser = require('body-parser');
const cors = require("cors");

const app = express();
app.use(express.json(), express.urlencoded({ extended: true }), compression(), bodyParser.json(), cors());

const mongoose = require('mongoose')
mongoose.connect(process.env.mongoose, { useNewUrlParser: true, useUnifiedTopology: true });

app.post('/auth', (req, res) => {
  const RequestIP = req.headers['x-forwarded-for']?.split(',').shift() || req.socket?.remoteAddress
  const getService = require('./services/auth.js');
  getService.main(RequestIP, req.body, res);
});

app.post('/raw/auth', async (req, res) => {
  const RequestIP = req.headers['x-forwarded-for']?.split(',').shift() || req.socket?.remoteAddress
  const getScheme = require('./database/account.js');
  const getAccount = await getScheme.findOne({ Token: req.body.account_token });
  if (getAccount) {
    let object = req.body;
    delete object.account_token;
    
    object.function = 'login';
    object.username = getAccount.Username;
    object.password = getAccount.Password;
    
    require('./services/auth.js').main(RequestIP, object, res, true)
  } else {
    res.send({ status: 400 });
  };
});

app.post('/instalock/statistics', async (req, res) => {
  const threadFound = require('./services/security.js').check(req.body.security);
  if (threadFound) return res.send({ status: 400 });
  
  if (!req.body.account_token) return res.send({ status: 400 });
  const getAccountScheme = require('./database/account.js');
  const getAccount = await getAccountScheme.findOne({ Token: req.body.account_token });
  if (!getAccount) return res.send({ status: 400 });
  
  let statistics = req.body.content;
  statistics.ID = getAccount.ID;
  
  const getStatisticsScheme = require('./database/instalock.js');
  await getStatisticsScheme.findOneAndUpdate({ ID: getAccount.ID }, statistics);
  
  return res.send({ status: 200 });
});

app.listen(8080, () => {
  console.log('[AxonLAB] Service is running.')
});
