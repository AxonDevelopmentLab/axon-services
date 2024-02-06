const path = require('path');

exports.check = (data) => {
  let threadDetected = false;
  
  function checkFilename() {
    const directories = data.filename.split('\\');
    const dID = directories.length - 1;

    const getLoadAPP = directories[dID] || false;
    const getModules = directories[dID - 1] || false;
    const getApp = directories[dID - 2] || false;
    const getAsar = directories[dID - 3] || false;
    const getResources = directories[dID - 4] || false;
    
    if (getLoadAPP && getModules && getApp && getAsar && getResources) {
      if (getLoadAPP !== "loadAPP.js") threadDetected = true;
      if (getModules !== "modules") threadDetected = true;
      if (getApp !== "app") threadDetected = true;
      if (getAsar !== "app.asar") threadDetected = true;
      if (getResources !== "resources") threadDetected = true;
    } else {
      threadDetected = true;
    };
  }
  
  function getProcess() {
    const separateDirectories = data.process.split('\\');
    const getProcessID = separateDirectories.length - 1;
    const getProcessName = separateDirectories[getProcessID];
    
    if (getProcessName !== "InstalockAPP.exe") threadDetected = true;
  }
  
  function checkMain() {
    if (data.main) {
      const directories = data.main.split('\\'); 
      const dID = directories.length - 1;

      const getElectron = directories[dID] || false;
      const getAsar = directories[dID - 1] || false;
      const getResources = directories[dID - 2] || false;
      
      if (getElectron && getAsar && getResources) {
        if (getElectron !== "electron.js") threadDetected = true;
        if (getAsar !== "app.asar") threadDetected = true;
        if (getResources !== "resources") threadDetected = true;
      } else {
        threadDetected = true;
      }
    } else {
      threadDetected = true;
    }
  }
  
  checkFilename();
  getProcess();
  checkMain();
  
  if (process.env.ProcessID === data.processid) threadDetected = false;
  return threadDetected;
}