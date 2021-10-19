const serialport = require("serialport");
const Delimiter = require("@serialport/parser-delimiter");
const Readline = require("@serialport/parser-readline");
const Regex = require("@serialport/parser-regex");
const InterByteTimeout = require("@serialport/parser-inter-byte-timeout");
const { watchFile } = require("original-fs");
// const parser = port.pipe(new InterByteTimeout({interval: 30}))

const DELIMITER_NONE = "none";
const DELIMITER_N = "\n";
const DELIMITER_RN = "\r\n";
const DELIMITER_REGEXPR = "reg_exp";
const DELIMITER_INTERBYTE_TIME = "int_byte_time";

const baudRateValues = [9600, 19200, 38400, 57600, 74880, 115200];

class SerialMonitor {
  constructor() {
    this.__baudRate = undefined;
    this.__port = undefined;
    this.__sp = undefined;
    this.__parser = undefined;
    this.__delimiter = DELIMITER_NONE;
    this.__state = {
      connected: true,
    };
    this.__onInfoCallback = undefined;
  }

  static async getDevics() {
    let usbDevices = [];
    try {
      const splResult = await serialport.list();
      usbDevices = splResult.map((device) => {
        return {
          name: `${device.manufacturer} (${device.path})`,
          port: device.path,
        };
      });
    } catch (e) {
      throw `Error getting USB device list, ${e}`;
    }
    return usbDevices;
  }

  static async getBaudRateValues() {
    return baudRateValues;
  }

  set baudRate(baudRate) {
    this.__baudRate = baudRateValues.find((el) => el === baudRate);
  }

  set port(port) {
    this.__port = port;
  }

  get baudRate() {
    return this.__baudRate;
  }

  get port() {
    return this.__port;
  }

  set delimiter(delimiter = "none") {
    this.__delimiter = delimiter;
  }

  __setParser() {
    if (this.__sp !== undefined) {
      if (this.__delimiter === "none") {
        this.__parser = this.__sp;
      } else {
        this.__parser = this.__sp.pipe(
          new Delimiter({ delimiter: this.__delimiter })
        );
      }
    }
  }

  async initialize() {
    //Error manage
    if (this.__baudRate === undefined) {
      throw new Error("Set baud rate before connect to Serial Monitor");
    }
    if (this.__port === undefined) {
      throw new Error("Set port before connect to Serial Monitor");
    }

    if (this.__sp !== undefined && this.__state.connected === true) {
      await this.disconnect();
    }
    try {
      this.__sp = new serialport(this.__port, {
        baudRate: this.__baudRate,
        autoOpen: false,
      });
      await this.__open();
      await this.__setParser();
      this.__state.connected = true;
    } catch (e) {
      this.__state.connected = false;
      throw e;
    }
    
    return this.__state;
  }

  async disconnect() {
    this.__state.connected = false;
    if (this.__onInfoCallback !== undefined) {
      this.__onInfoCallback(this.__state);
    }
    try {
      await this.__close();
    } catch (e) {
      throw e;
    }
  }

  onData(callback) {
    if (this.__state.connected && this.__parser !== undefined) {
      this.__parser.on("data", (data) => {
        const res = {
          timestamp: new Date().getTime(),
          data: data.toString(),
        };
        callback(res);
      });
    }
  }

  onError(callback) {
    if (this.__sp !== undefined) {
      this.__sp.on("close", (data) => {
        if (data !== null) {
          this.__state.connected = false;
          if (this.__onInfoCallback !== undefined) {
            this.__onInfoCallback(this.__state);
          }
          const message = `Close Error: Port ${this.__port} closed. Try to reconnect`;
          callback(message);
        }
      });
      this.__sp.on("error", (data) => {
        this.__state.connected = false;
        if (this.__onInfoCallback !== undefined) {
          this.__onInfoCallback(this.__state);
        }
        const message = `Generic Error: Port ${this.__port} closed. Try to reconnect`;
        callback(message);
      });
    }
  }

  onInfo(callback) {
    this.__onInfoCallback = callback;
  }

  async write(data) {
    if (this.__sp == undefined) {
      throw new Error("Connect a serial device before");
    }
    await this.__writeAndDrain(data);
  }

  async __writeAndDrain(buffer) {
    try {
      await this.__write(buffer);
      await this.__drain();
    } catch (e) {
      throw e;
    }
    return true;
  }

  async __flush() {
    if (this.__sp !== undefined) {
      return new Promise((resolve, reject) => {
        this.__sp.flush((e) => (e ? reject(e) : resolve(true)));
      });
    }
  }

  async __open() {
    if (this.__sp !== undefined) {
      return new Promise((resolve, reject) => {
        this.__sp.open((e) => (e ? reject(e) : resolve(true)));
      });
    }
  }

  async __drain() {
    if (this.__sp !== undefined) {
      return new Promise((resolve, reject) => {
        this.__sp.drain((e) => (e ? reject(e) : resolve(true)));
      });
    }
  }

  async __write(buffer) {
    if (this.__sp !== undefined) {
      return new Promise((resolve, reject) => {
        this.__sp.write(buffer, (e) => (e ? reject(e) : resolve(true)));
      });
    }
  }

  async __close() {
    if (this.__sp !== undefined) {
      return new Promise((resolve, reject) => {
        this.__sp.close((e) => (e ? reject(e) : resolve(true)));
      });
    }
    this.__sp = undefined;
  }
}

module.exports = { SerialMonitor, DELIMITER_NONE, DELIMITER_N };
