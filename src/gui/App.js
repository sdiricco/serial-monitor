import "antd/dist/antd.css"; // or 'antd/dist/antd.less'
import React from "react";
import { Input, Button, Select, Row, Col, Typography, Popover } from "antd";
import {
  PauseOutlined,
  CaretRightOutlined,
  ClearOutlined,
  FieldTimeOutlined,
} from "@ant-design/icons";

import SmSender from "./components/SmSender";
import SmMonitor from "./components/SmMonitor";
import SmFooter from "./components/SmFooter";
import styles from "./App.module.css";

const { ipcRenderer } = window.require("electron");
const { TextArea } = Input;
const { Option } = Select;
const { Text, Link } = Typography;

const COLOR_ON = "#bae637";
const COLOR_OFF = "#ff9c6e";

const COLOR_BUTTON_START_STOP_ON = "#e6fffb";
const COLOR_BUTTON_START_STOP_OFF = "#e6fffb";
const COLOR_BUTTON_START_STOP_NOTSET = "rgba(230, 255, 251, 0.25)";
const BACKGROUND_BUTTON_START_STOP_ON = "#ffc53d";
const BACKGROUND_BUTTON_START_STOP_OFF = "#13c2c2";
const BACKGROUND_BUTTON_START_STOP_NOTSET = "rgba(19, 194, 194, 0.25)";

const COLOR_BUTTON_TIMESTAMP_ON = "#e6fffb";
const COLOR_BUTTON_TIMESTAMP_OFF = "#e6fffb";
const BACKGROUND_BUTTON_TIMESTAMP_ON = "#ffc53d";
const BACKGROUND_BUTTON_TIMESTAMP_OFF = "#13c2c2";

const COLOR_BUTTON_CLEAR = "#e6fffb";
const BACKGROUND_BUTTON_CLEAR = "#13c2c2";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.name = "Serial Monitor";
    this.state = {
      portSelected: undefined,
      baudRateSelected: undefined,
      delimiterSelected: {
        value: "none",
        label: "none",
      },
      delimiterList: [
        {
          value: "none",
          label: "none",
        },
        {
          value: "\n",
          label: "\\n",
        },
      ],
      portList: [],
      baudRateValues: [],
      serialMonitorData: [],
      isTimestampEnabled: false,
      helperButton: "",
      helperOption: "",
      info: {
        isStarted: false,
        color: "#f5f5f5",
        label: "Select Baud Rate, Port and then click on start",
      },
    };
    this.onClickShowPortList = this.onClickShowPortList.bind(this);
    this.onClickShowBauRateValues = this.onClickShowBauRateValues.bind(this);
    this.onChangePort = this.onChangePort.bind(this);
    this.onChangeBaudRate = this.onChangeBaudRate.bind(this);
    this.onChangeDelimiter = this.onChangeDelimiter.bind(this);
    this.onClickStartStop = this.onClickStartStop.bind(this);
    this.onSerialMonitorData = this.onSerialMonitorData.bind(this);
    this.onClickClearMonitor = this.onClickClearMonitor.bind(this);
    this.onSendData = this.onSendData.bind(this);
    this.onSerialMonitorError = this.onSerialMonitorError.bind(this);
    this.onClickEnableTimeStamp = this.onClickEnableTimeStamp.bind(this);
    this.onKeyPressInputSendData = this.onKeyPressInputSendData.bind(this);
  }

  onChangePort(port) {
    const portSelected = this.state.portList.find((el) => el.name === port);
    this.setState({ portSelected: portSelected.name });
  }

  onChangeBaudRate(baudRate) {
    this.setState({ baudRateSelected: parseInt(baudRate) });
  }

  async onChangeDelimiter(delimiter) {
    const delimiterSelected = this.state.delimiterList.find(
      (el) => el.label === delimiter
    );
    this.setState({ delimiterSelected: delimiterSelected });
  }

  async onClickShowBauRateValues() {
    let baudRateValues = [];
    try {
      baudRateValues = await ipcRenderer.invoke("get-baudrate-values");
    } catch (e) {}
    this.setState({ baudRateValues: baudRateValues });
  }

  async onClickShowPortList() {
    const portList = await ipcRenderer.invoke("get-port-list");
    this.setState({ portList: portList || [] });
  }

  async onClickStartStop() {
    if (!this.state.info.isStarted) {
      const portObj = this.state.portList.find(
        (el) => el.name === this.state.portSelected
      );
      try {
        await ipcRenderer.invoke(
          "set-option:baudrate",
          this.state.baudRateSelected
        );
        await ipcRenderer.invoke("set-option:port", portObj.port);
        await ipcRenderer.invoke(
          "set-option:delimiter",
          this.state.delimiterSelected.value
        );
        const ok = await ipcRenderer.invoke("start-serialmonitor");
        if (ok) {
          const info = {
            isStarted: true,
            color: COLOR_ON,
            label:
              "Active. Stop the connection if you want to change configuration",
          };
          this.setState({ info: info });
        }
      } catch (e) {
        console.log(e);
      }
    } else {
      try {
        const ok = await ipcRenderer.invoke("stop-serialmonitor");
        if (ok) {
          const info = {
            isStarted: false,
            color: COLOR_OFF,
            label: "Stopped. Active the connection if you want to send data",
          };
          this.setState({ info: info });
        }
      } catch (e) {
        console.log(e);
      }
    }
  }

  async onClickClearMonitor() {
    this.setState({ serialMonitorData: [] });
  }

  async onSendData(data) {
    try {
      const ok = await ipcRenderer.invoke("send-data", data);
      if (ok) {
        console.log(data);
      }
    } catch (e) {
      console.log(e);
    }
  }

  onKeyPressInputSendData(e) {
    if (e.key === "Enter" && this.state.info.isStarted) {
      this.onSendData();
    }
  }

  onClickEnableTimeStamp() {
    const isTimestampEnabled = this.state.isTimestampEnabled;
    this.setState({ isTimestampEnabled: !isTimestampEnabled });
  }

  onSerialMonitorData(event, dataStructure) {
    let line = "";
    if (this.state.isTimestampEnabled) {
      const dateObj = new Date(dataStructure.timestamp);
      const time = `${dateObj.getHours()}:${dateObj.getMinutes()}:${dateObj.getSeconds()}:${dateObj.getMilliseconds()}`;
      line = `[${time}] ${dataStructure.data}`;
    } else {
      line = dataStructure.data;
    }
    let serialMonitorData = this.state.serialMonitorData;
    serialMonitorData.push(line);
    if (serialMonitorData.length > 1000) {
      serialMonitorData = serialMonitorData.slice(-1000);
    }
    this.setState({ serialMonitorData: serialMonitorData });
  }

  onSerialMonitorError() {
    const info = {
      isStarted: false,
      color: "#f5f5f5",
      label: "Select Baud Rate, Port and then click on start",
    };
    this.setState({
      info: info,
      portSelected: undefined,
      portList: [],
      startStopColor: "#f5f5f5",
    });
  }

  componentDidUpdate() {
    let objDiv = document.getElementById("monitor");
    if (objDiv) {
      objDiv.scrollTop = objDiv.scrollHeight;
    }
  }

  componentDidMount() {
    ipcRenderer.on("on-serialmonitor-data", this.onSerialMonitorData);
    ipcRenderer.on("on-serialmonitor-error", this.onSerialMonitorError);
  }

  componentWillUnmount() {
    ipcRenderer.off("on-serialmonitor-data", this.onSerialMonitorData);
    ipcRenderer.off("on-serialmonitor-error", this.onSerialMonitorError);
  }

  render() {
    const baudRateValues = this.state.baudRateValues.map((el, i) => {
      return (
        <Option key={`baudrate_${i}`} value={el}>
          {el}
        </Option>
      );
    });

    const portNameList = this.state.portList.map((el, i) => {
      return (
        <Option key={`port_${i}`} value={el.name}>
          {el.name}
        </Option>
      );
    });

    const delimiterNameList = this.state.delimiterList.map((el, i) => {
      return (
        <Option key={`delimiter_${i}`} value={el.label}>
          {el.label}
        </Option>
      );
    });

    let iconStartStop = <CaretRightOutlined size="small" />;
    if (this.state.info.isStarted) {
      iconStartStop = <PauseOutlined size="small" />;
    }

    let backgroundButtonTimeStamp = BACKGROUND_BUTTON_TIMESTAMP_OFF;
    let colorButtonTimeStamp = COLOR_BUTTON_TIMESTAMP_OFF;
    if (this.state.isTimestampEnabled) {
      backgroundButtonTimeStamp = BACKGROUND_BUTTON_TIMESTAMP_ON;
      colorButtonTimeStamp = COLOR_BUTTON_TIMESTAMP_ON;
    }

    let backgroundButtonStartStop = BACKGROUND_BUTTON_START_STOP_NOTSET;
    let colorButtonStartStop = COLOR_BUTTON_START_STOP_NOTSET;
    if (
      this.state.info.isStarted &&
      this.state.portSelected !== undefined &&
      this.state.baudRateSelected !== undefined
    ) {
      backgroundButtonStartStop = BACKGROUND_BUTTON_START_STOP_ON;
      colorButtonStartStop = COLOR_BUTTON_START_STOP_ON;
    } else if (
      this.state.portSelected !== undefined &&
      this.state.baudRateSelected !== undefined
    ) {
      backgroundButtonStartStop = BACKGROUND_BUTTON_START_STOP_OFF;
      colorButtonStartStop = COLOR_BUTTON_START_STOP_OFF;
    }

    return (
      <div className={styles.mainContainer}>
        <div className={styles.buttonsGroup}>
          <Row justify="start" gutter={4}>
            {/* Start / Stop */}
            <Col flex="0 0 40px">
              <Button
                onMouseEnter={() => {
                  const helperButton = this.state.info.isStarted
                    ? "Stop"
                    : "Start";
                  this.setState({ helperButton: helperButton });
                }}
                onMouseLeave={() => {
                  this.setState({ helperButton: "" });
                }}
                onClick={this.onClickStartStop}
                className={styles.autoWidth}
                size="small"
                style={{
                  border: "none",
                  background: backgroundButtonStartStop,
                  color: colorButtonStartStop,
                }}
                disabled={
                  this.state.portSelected === undefined ||
                  this.state.baudRateSelected === undefined
                }
              >
                {iconStartStop}
              </Button>
            </Col>

            {/* timestamp */}
            <Col flex="0 0 40px">
              <Button
                onClick={this.onClickEnableTimeStamp}
                onMouseEnter={() => {
                  this.setState({ helperButton: "Timestamp" });
                }}
                onMouseLeave={() => {
                  this.setState({ helperButton: "" });
                }}
                className={styles.autoWidth}
                size="small"
                style={{
                  border: "none",
                  background: backgroundButtonTimeStamp,
                  color: colorButtonTimeStamp,
                }}
              >
                <FieldTimeOutlined size="small" />
              </Button>
            </Col>

            {/* Clear */}
            <Col flex="0 0 40px">
              <Button
                style={{
                  border: "none",
                  background: BACKGROUND_BUTTON_CLEAR,
                  color: COLOR_BUTTON_CLEAR,
                }}
                onClick={this.onClickClearMonitor}
                onMouseEnter={() => {
                  this.setState({ helperButton: "Clear Monitor" });
                }}
                onMouseLeave={() => {
                  this.setState({ helperButton: "" });
                }}
                className={styles.autoWidth}
                size="small"
              >
                <ClearOutlined size="small" />
              </Button>
            </Col>
            <Col flex="0 0 160px">
              <Text className={styles.colorWhite}>
                {this.state.helperButton}
              </Text>
            </Col>
          </Row>
        </div>

        <div className={styles.options}>
          <Row>
            {/*Options*/}

            <Col flex="auto" className={styles.optionsInput}>
              <Row gutter={4} wrap={false}>
                {/* Baud rate */}

                <Col flex="0 0 160px">
                  <Text className={styles.colorWhite}>Baud Rate</Text>
                  <Select
                    value={this.state.baudRateSelected}
                    className={styles.autoWidth}
                    onClick={this.onClickShowBauRateValues}
                    onChange={this.onChangeBaudRate}
                    size="small"
                    defaultValue="---"
                    disabled={this.state.info.isStarted}
                  >
                    {baudRateValues}
                  </Select>
                </Col>

                {/* Port */}
                <Col flex="0 0 160px">
                  <Text className={styles.colorWhite}>Port</Text>
                  <Select
                    style={{ border: "none" }}
                    value={this.state.portSelected}
                    className={styles.autoWidth}
                    onClick={this.onClickShowPortList}
                    onChange={this.onChangePort}
                    defaultValue="---"
                    size="small"
                    disabled={this.state.info.isStarted}
                  >
                    {portNameList}
                  </Select>
                </Col>

                {/* Parse Delimiter */}
                <Col flex="0 0 160px">
                  <Text className={styles.colorWhite}>Delimiter parser</Text>

                  <Select
                    style={{ border: "none" }}
                    value={this.state.delimiterSelected.label}
                    className={styles.autoWidth}
                    onChange={this.onChangeDelimiter}
                    size="small"
                    disabled={this.state.info.isStarted}
                  >
                    {delimiterNameList}
                  </Select>
                </Col>
              </Row>
            </Col>
          </Row>
        </div>

        <SmSender
          enable={this.state.info.isStarted}
          onPressEnter={this.onSendData}
        />
        <SmMonitor value={this.state.serialMonitorData.join("")} />
        <SmFooter
          statusColor={this.state.info.color}
          label={this.state.info.label}
        />
      </div>
    );
  }
}

export default App;
