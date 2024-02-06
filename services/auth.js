function passwordCrypt(password) {
  const cipher = crypto.createCipher("aes-256-ecb", password);
  let encrypted = cipher.update(password, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
};
const accountScheme = require("../database/account");
const crypto = require('crypto');

exports.main = (UserIP, RequestData, UserHTTP) => {
  if (!UserIP) return UserHTTP.send({ status: 400 });
  if (!RequestData) return UserHTTP.send({ status: 400 });
  
  const requestDataLoad = {
    missingRequirements: false,
    requestRequirements: [
      { key: 'function', type: 'string', required: true },
      { key: 'username', type: 'string', required: true },
      { key: 'password', type: 'string', required: true },
      { key: 'repeat_password', type: 'string', required: false },
      { key: 'getdatafrom', type: 'object', required: false },
      { key: 'security', type: 'object', required: false },
      { key: 'serviceacess', type: 'string', required: false }
    ]
  };
  for (const requirement of requestDataLoad.requestRequirements) {
    if (!RequestData.hasOwnProperty(requirement.key)) {
      if (requirement.required) {
        requestDataLoad.missingRequirements = true;
        break;
      };
    } else {
        if (typeof(RequestData[requirement.key]) !== requirement.type) {
        requestDataLoad.missingRequirements = true;
        break;
      }
    }
  };
  if (requestDataLoad.missingRequirements) return UserHTTP.send({ status: 400 });
  
  const services = {
    login: async () => {
      let { username, password } = RequestData;
      password = passwordCrypt(password);
      
      let getAccountDetails = await accountScheme.findOne({ Username: username });
      if (!getAccountDetails) return UserHTTP.send({ status: 401, message: { text: "Credênciais inválidas.", color: "red" }});
      const findAttemptByIP = getAccountDetails.LoginAttempts.find(object => object.IP === UserIP);
      
      if (getAccountDetails.Password !== password) {
        if (!findAttemptByIP) {
          UserHTTP.send({ status: 401, message: { text: "Credênciais inválidas.", color: "red" }})
          await accountScheme.findOneAndUpdate({ ID: getAccountDetails.ID }, { LoginAttempts: [{ IP: UserIP, Attempts: 1 }] });
          return;
        }
        
        if (findAttemptByIP.Attempts > 3) return UserHTTP.send({ status: 401, message: { text: "Aguarde e tente novamente.", color: "red" }})
        
        findAttemptByIP.Attempts++;
        await accountScheme.findOneAndUpdate({ ID: getAccountDetails.ID }, { LoginAttempts: getAccountDetails.LoginAttempts });
        UserHTTP.send({ status: 401, message: { text: "Credênciais inválidas.", color: "red" }})

        if (findAttemptByIP.Attempts > 3) {
          setTimeout(async () => {
            let getAgainAccountDetails = await accountScheme.findOne({ ID: getAccountDetails.ID });
            const refindAttemptByIP = getAgainAccountDetails.LoginAttempts.find(object => object.IP === UserIP);
            if (refindAttemptByIP.Attempts > 3) {
              refindAttemptByIP.Attempts = refindAttemptByIP.Attempts = 0;
              await accountScheme.findOneAndUpdate({ ID: getAccountDetails.ID }, { LoginAttempts: getAgainAccountDetails.LoginAttempts });
            }
          }, 1000 * 60 * 5)
        }
      } else {
        if (findAttemptByIP) {
          const newAttempts = getAccountDetails.LoginAttempts.filter(object => object.IP !== UserIP);
          await accountScheme.findOneAndUpdate({ ID: getAccountDetails.ID }, { LoginAttempts: newAttempts });
        };
        
        let callbackObject = { status: 200, Token: getAccountDetails.Token }
        if (RequestData.getdatafrom && RequestData.getdatafrom.length > 0) {
          const allDatas = await require('./start_services.js').getData(getAccountDetails.ID, RequestData.getdatafrom, RequestData.security || false)
          if (allDatas?.status && allDatas.status === 400) return UserHTTP.send(allDatas) 
          callbackObject['getdatafrom'] = allDatas;
          //Object.defineProperty(callbackObject, 'getdatafrom', allDatas);
        }
          
        if (RequestData.serviceacess) {
           const loadData = await require('./service_acess.js').loadServices(RequestData.serviceacess, RequestData.security || false)
          if (loadData?.status && loadData.status === 400) return UserHTTP.send(loadData) 
          callbackObject['loaddata'] = loadData;
          //Object.defineProperty(callbackObject, 'loaddata', loadData);
        }
          
        return UserHTTP.send(callbackObject) 
      }
    },
    register: async () => {
      let { username, password, repeat_password } = RequestData;
      
      const incorrectUsername = username.match(/[^\w\s]/g);
      if (incorrectUsername) return UserHTTP.send({ status: 401, message: { text: "Nome de usuário não aceito.", color: "red" }});
      
      const incorrectPassword = password.match(/\s/g);
      if (incorrectPassword) return UserHTTP.send({ status: 401, message: { text: "Senha não aceita.", color: "red" }});
      if (password !== repeat_password) return UserHTTP.send({ status: 401, message: { text: "As senhas não batem.", color: "red" }});
      if (password.length < 8) return UserHTTP.send({ status: 401, message: { text: "A senha necessita no mínimo 8 caracteres.", color: "red" }});
      
      
      const findAccount = await accountScheme.findOne({ Username: username });
      if (findAccount) return UserHTTP.send({ status: 401, message: { text: "Já existe uma conta com esse username.", color: "red" }});
      
      const generateAccountToken = crypto.randomBytes(32).toString('hex');
      const generateAccountID = crypto.randomBytes(32).toString('hex');
      let accountCreate = new accountScheme({
        ID: generateAccountID,
        Username: username,
        Password: passwordCrypt(password),
        Token: generateAccountToken,
        Details: {
          Plan: 'Básico'
        }
      });
      accountCreate.save();
      
      UserHTTP.send({ status: 201, message: { text: "A sua conta foi criada com sucesso.", color: "green" }});
      return require('./start_services.js').createSchemes(generateAccountID);
    }
  };
  
  try {
    services[RequestData.function]();
  } catch (error) {
    console.log(error);
    return UserHTTP.send({ status: 500 });
  }
}