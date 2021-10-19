const { app, BrowserWindow, ipcMain, dialog } = require("electron");

const path = require("path");
const isDev = require("electron-is-dev");
const {SerialMonitor} = require("./modules/serialMonitor");

let mainWindow;
let sm = new SerialMonitor();

const showMessageBox=(options) => {
  //dialog box
  let __options = {
    buttons: options.buttons || ["ok"],
    message: options.message || "Are you sure?",
    title: options.title || "Info",
    type: options.type || "question",
  };
  return dialog.showMessageBoxSync(mainWindow, __options);
}


const onSerialMonitorData = (dataStructure) => {
  mainWindow.webContents.send("on-serialmonitor-data", dataStructure);
}

const onSerialMonitorInfo = (dataStructure) => {
  console.log(dataStructure)
  mainWindow.webContents.send("on-serialmonitor-info", dataStructure);
}

const onSerialMonitorError = (data) =>{
  mainWindow.webContents.send("on-serialmonitor-error", data);
  console.log(data)
  showMessageBox({
    title: "Error",
    type: "error",
    message:data,
  });
}

ipcMain.handle("get-port-list", async (event) => {
  let portList = undefined;
  try {
    portList = await SerialMonitor.getDevics();
  } catch (e) {
    throw(e)
  }
  return portList;
});

ipcMain.handle("get-baudrate-values", async (event) => {
  let baudRateValues = undefined;
  try {
    baudRateValues = await SerialMonitor.getBaudRateValues();
  } catch (e) {
    return e
  }
  return baudRateValues;
});

ipcMain.handle("set-option:baudrate", async(event, baudRate) => {
  sm.baudRate = baudRate;
})

ipcMain.handle("set-option:port", async(event, port) => {
  sm.port = port;
})

ipcMain.handle("set-option:delimiter", async(event, delimiter) => {
  sm.delimiter = delimiter;
})



ipcMain.handle("start-serialmonitor", async (event) => {
  try {
    //initialize serial monitor
    const state = await sm.initialize();
    onSerialMonitorInfo(state)

    //enable events
    sm.onData(onSerialMonitorData);
    sm.onError(onSerialMonitorError);
    sm.onInfo(onSerialMonitorInfo);

    return true;
  } catch (e) {
    onSerialMonitorError(e.message);
    return false;
  }
});

ipcMain.handle("stop-serialmonitor", async (event) => {
  try {
    await sm.disconnect();
    return true;
  } catch (e) {
    showMessageBox({
      title: "Error",
      type: "error",
      message:e.message,
    });
    return false
  }
  
});

ipcMain.handle("send-data", async (event, data) => {
  try {
    await sm.write(data);
    return true;
  } catch (e) {
    showMessageBox({
      title: "Error",
      type: "error",
      message:e.message,
    });
    return false;
  }
});

function createWindow() {
  mainWindow = new BrowserWindow({
    minWidth: 600,
    minHeight: 400,
    show: true,
    title: "Serial Monitor App ",
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
    },
  });
  const startURL = isDev
    ? "http://localhost:3000"
    : `file://${path.join(__dirname, "../build/index.html")}`;

  mainWindow.loadURL(startURL);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    // mainWindow.toggleDevTools();
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  mainWindow.removeMenu();

}

app.allowRendererProcessReuse = false;
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
