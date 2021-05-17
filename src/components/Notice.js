import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import ErrorIcon from "@material-ui/icons/Error";
import InfoIcon from "@material-ui/icons/Info";
import WarningIcon from "@material-ui/icons/Warning";
import { withStyles } from "@material-ui/core/styles";

const variantIcon = {
  success: CheckCircleIcon,
  warning: WarningIcon,
  error: ErrorIcon,
  info: InfoIcon,
};

const styles = (theme) => ({
  success: {
    border: "1px solid #c6d880",
    backgroundColor: "#e6efc2",
    color: "#264409",
  },
  error: {
    border: "1px solid #fbc2c4",
    backgroundColor: "#fbe3e4",
    color: "#8a1f11",
  },
  info: {
    border: "1px solid #92cae4",
    backgroundColor: "#d5edf8",
    color: "#205791",
  },
  warning: {
    border: "1px solid #FED23D",
    backgroundColor: "#FEF4C1",
    color: "#514721",
  },
  icon: {
    fontSize: 20,
  },
  iconVariant: {
    opacity: 0.7,
    marginRight: theme.spacing(1),
  },
  message: {
    display: "flex",
    alignItems: "center",
    padding: "10px",
  },
});

function Notice(props) {
  const { classes, className, message, variant, style } = props;
  const Icon = variantIcon[variant];

  return (
    <div className={classNames(classes[variant], className)} style={style}>
      <span className={classes.message}>
        <Icon className={classNames(classes.icon, classes.iconVariant)} />
        {message}
      </span>
    </div>
  );
}

Notice.propTypes = {
  classes: PropTypes.object.isRequired,
  style: PropTypes.object,
  className: PropTypes.string,
  message: PropTypes.node,
  variant: PropTypes.oneOf(["success", "warning", "error", "info"]).isRequired,
};

export default withStyles(styles)(Notice);
