const schemas = {
  instalock: {
    file: require('../database/instalock.js'),
    requireSecurity: true,
    emptyObject: {
      ID: undefined,
      TotalMatches: 0,
      SucessfullyMatches: 0,
      FreePicks: 5,
      Agents: []
    }
  }
};

exports.createSchemes = async (ID) => {
  for (const service in schemas) {
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
      delete createCopy.ID;
      delete createCopy.Token;
      delete createCopy._id;
      delete createCopy.__v;
      
      if (schemas[service].requireSecurity) {
        const threadFound = require('./security.js').check(Security);
        if (!threadFound) {
          AllDatasObject[service] = createCopy;
        } else {
          resolve({ status: 400, message: { text: "Autenticação cancelada devido à vulnerabilidade.", color: "red" }});
        }
      } else {
        AllDatasObject[service] = createCopy;
      };
    }
    
    resolve(AllDatasObject);
  });
};