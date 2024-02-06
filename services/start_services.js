const schemas = {
  account: {
    file: require('../database/account.js'),
    requireSecurity: false,
    emptyObject: {
      ID: undefined,
      Username: "",
      Password: undefined,
      Token: undefined,
      LoginAttempts: undefined,
      Details: {}
    }
  },
  instalock: {
    file: require('../database/instalock.js'),
    requireSecurity: true,
    emptyObject: {
      ID: undefined,
      TotalMatches: 0,
      SucessfullyMatches: 0,
      FreePicks: 30,
      Agents: []
    }
  }
};

exports.createSchemes = async (ID) => {
  for (const service in schemas) {
    if (service === "account") continue;
    schemas[service].emptyObject.ID = ID;
    let createScheme = new schemas[service].file(schemas[service].emptyObject);
    createScheme.save();
  }
};

exports.getData = async (ID, AllDatasArray, Security) => {  
  return new Promise(async (resolve, reject) => {
    const AllDatasObject = {};
    
    for (const service of AllDatasArray) {
      const getService = await schemas[service].file.findOne({ ID: ID });
      if (!getService) continue;
      
      let createCopy = JSON.parse(JSON.stringify(getService));
      if (createCopy.ID) delete createCopy.ID;
      if (createCopy.Token && service !== "account") delete createCopy.Token;
      if (createCopy._id) delete createCopy._id;
      if (createCopy.__v) delete createCopy.__v;
      if (createCopy.Username && service !== "account") delete createCopy.Username;
      if (createCopy.Password) delete createCopy.Password;
      if (createCopy.LoginAttempts) delete createCopy.LoginAttempts;
      
      if (schemas[service].requireSecurity) {
        const threadFound = require('./security.js').check(Security);
        if (threadFound) return resolve({ status: 400, message: { text: "Autenticação cancelada devido à vulnerabilidade.", color: "red" }});
        AllDatasObject[service] = createCopy;
      } else {
        AllDatasObject[service] = createCopy;
      };
    }
    
    resolve(AllDatasObject);
  });
};