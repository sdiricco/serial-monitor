import "antd/dist/antd.css"; // or 'antd/dist/antd.less'
import React from "react";
import {
  Input,
  Row,
  Col,
} from "antd";

import styles from "./SmSender.module.css";

class SmSender extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
        dataToSend: ''
    }
  }

  render() {
    return (
        <div className={styles.sender}>
          <Row gutter={4}>
            {/* Input */}
            <Col flex="auto">
              <code>
                <Input
                  placeholder="type something and press Enter to send"
                  value={this.state.dataToSend}
                  onChange={(e)=>{
                    this.setState({ dataToSend: e.target.value });
                  }}
                  onKeyPress={(e)=>{
                    if (e.key === "Enter" && this.props.enable) {
                        this.props.onPressEnter(this.state.dataToSend)
                        this.setState({dataToSend: ''})
                    }
                  }}
                  size="small"
                  disabled={!this.props.enable}
                ></Input>
              </code>
            </Col>
          </Row>
        </div>
    );
  }
}

export default SmSender;
