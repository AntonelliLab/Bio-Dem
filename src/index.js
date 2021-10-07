import React from "react";
import { render } from "react-dom";
import App from "./App";
import * as serviceWorker from "./serviceWorker";
import CssBaseline from "@material-ui/core/CssBaseline";
import { ThemeProvider } from "@material-ui/styles";
import { createTheme, responsiveFontSizes } from "@material-ui/core/styles";
import muiTheme from "./theme";

const theme = responsiveFontSizes(createTheme(muiTheme));

const Index = () => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <App />
  </ThemeProvider>
);

const rootElement = document.getElementById("root");
render(<Index />, rootElement);

serviceWorker.unregister();
