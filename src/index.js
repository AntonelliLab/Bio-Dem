import React from 'react';
import { render } from 'react-dom';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import CssBaseline from '@material-ui/core/CssBaseline';
import { ThemeProvider } from '@material-ui/styles';
import { createMuiTheme, responsiveFontSizes } from '@material-ui/core/styles';
import muiTheme from './theme';

const theme = responsiveFontSizes(createMuiTheme(muiTheme));

const Index = () => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <App />
  </ThemeProvider>
)

const rootElement = document.getElementById('root');
render(<Index />, rootElement);

registerServiceWorker();
