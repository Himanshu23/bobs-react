import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  typography: {
    // Warm, friendly sans to complement the curved logo
    fontFamily:
      'Figtree, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: {
      fontSize: '2.4rem',
      fontWeight: 800,
      color: '#d7261f', // strong red, close to logo text
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      color: '#f25c19', // warm orange
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      color: '#ff9f1c', // tagline‑like accent
    },
    body1: {
      fontSize: '1rem',
      color: '#4a3b35',
    },
    body2: {
      fontSize: '0.9rem',
      color: '#6d5b54',
    },
    button: {
      textTransform: 'none',
      fontWeight: 700,
      letterSpacing: 0.4,
    },
  },
  palette: {
    primary: {
      // main warm orange from the logo swoosh
      main: '#f25c19',
      light: '#ff9f1c',
      dark: '#c3440f',
      contrastText: '#ffffff',
    },
    secondary: {
      // deep red from “Bob’s”
      main: '#d7261f',
      light: '#ff4b3a',
      dark: '#a31514',
      contrastText: '#ffffff',
    },
    error: {
      main: '#e63946',
    },
    success: {
      main: '#3cb371',
    },
    warning: {
      main: '#ffb703',
    },
    info: {
      main: '#118ab2',
    },
    text: {
      primary: '#2b2624',
      secondary: '#6d5b54',
    },
    background: {
      // subtle warm background instead of cool gray
      default: '#fff8f2',
      paper: '#ffffff',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999, // pill buttons to match circular logo motion
          paddingInline: '1.4rem',
        },
        containedPrimary: {
          boxShadow: '0 6px 16px rgba(242, 92, 25, 0.35)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        colorPrimary: {
          background:
            'linear-gradient(135deg, #f25c19 0%, #ff9f1c 60%, #ffd166 100%)',
          color: '#ffffff',
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          marginBottom: '0.2rem',
        },
      },
    },
  },
});

export default theme;
