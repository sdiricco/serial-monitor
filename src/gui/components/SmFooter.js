import "antd/dist/antd.css"; // or 'antd/dist/antd.less'
import React from "react";
import {
  Row,
  Col,
} from "antd";

import styles from "./SmFooter.module.css"

class SmFooter extends React.Component {
  constructor(props) {
    super(props);
    this.props = props
  }

  render() {
    return (
        <div className={styles.footer}>
          <Row gutter={4} wrap={false} className={styles.content}>
            <Col>
              <div
                className={styles.status}
                style={{ background: this.props.statusColor || "#ffffff" }}
              ></div>
            </Col>
            <Col style={{ color: "#ffffff" }} className={styles.overflowHidden}>
              {this.props.label || ''}
            </Col>
          </Row>
        </div>
    );
  }
}

export default SmFooter;
