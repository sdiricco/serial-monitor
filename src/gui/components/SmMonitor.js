import "antd/dist/antd.css"; // or 'antd/dist/antd.less'
import React from "react";
import {
  Input,
} from "antd";

import styles from "./SmMonitor.module.css";

const { TextArea } = Input;

class SmMonitor extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
  }

  componentDidUpdate() {
    let objDiv = document.getElementById("monitor");
    if (objDiv) {
      objDiv.scrollTop = objDiv.scrollHeight;
    }
  }

  render() {
    return (
        <div className={styles.monitor} id="monitor">
          <code>
            <TextArea
              bordered={false}
              autoSize={true}
              value={this.props.value || ''}
            ></TextArea>
          </code>
        </div>
    );
  }
}

export default SmMonitor;
