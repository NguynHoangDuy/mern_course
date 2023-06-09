import React from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
const Alert = ({ alerts }) => {
  if (alerts !== null && alerts.length > 0)
    return (
      <section className="container">
        {alerts.map((alert) => (
          <div key={alert.id} className={`alert alert-${alert.alertType}`}>
            {alert.msg}
          </div>
        ))}
      </section>
    );
  else return "";
};

Alert.prototype = {
  alerts: PropTypes.array.isRequired,
};

const mapStateToProps = (state) => ({
  alerts: state.alert,
});

export default connect(mapStateToProps)(Alert);
