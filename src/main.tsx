import { createRoot } from "react-dom/client";
import CssBaseline from "@mui/material/CssBaseline";
import {
  ThemeProvider,
  createTheme,
  responsiveFontSizes,
} from "@mui/material/styles";
import App from "./App";
import muiTheme from "./theme";

const theme = responsiveFontSizes(createTheme(muiTheme));

const container = document.getElementById("root");
if (!container) {
  throw new Error('Root element "#root" not found');
}

createRoot(container).render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <App />
  </ThemeProvider>,
);
