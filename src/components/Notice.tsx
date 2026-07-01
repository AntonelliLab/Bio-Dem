import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import InfoIcon from "@mui/icons-material/Info";
import WarningIcon from "@mui/icons-material/Warning";
import Box from "@mui/material/Box";

const variantIcon = {
  success: CheckCircleIcon,
  warning: WarningIcon,
  error: ErrorIcon,
  info: InfoIcon,
};

const variantStyles = {
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
};

function Notice({ className, message, variant, style, ref }) {
  const Icon = variantIcon[variant];

  return (
    <Box ref={ref} className={className} sx={variantStyles[variant]} style={style}>
      <Box
        component="span"
        sx={{ display: "flex", alignItems: "center", padding: "10px" }}
      >
        <Icon sx={{ fontSize: 20, opacity: 0.7, mr: 1 }} />
        {message}
      </Box>
    </Box>
  );
}

export default Notice;
