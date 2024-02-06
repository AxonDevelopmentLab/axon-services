exports.loadServices = (ServiceName, Security) => {
  return new Promise(async (resolve, reject) => {
    const threadFound = require('./security.js').check(Security);
    if (threadFound)  return resolve({ status: 400, message: { text: "Autenticação cancelada devido à vulnerabilidade.", color: "red" }});
    
    const getScheme = require(`../database/cryptokeys.js`);
    const getService = await getScheme.findOne({ Service: ServiceName });
    if (!getService) return resolve({ status: 400 });
    
    resolve({
      cryptographyKey: getService.CryptographyKey,
      scriptIVs: getService.ScriptIVs,
    });
  });
}