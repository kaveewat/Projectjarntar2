import { createTheme } from '@mui/material/styles';

const muiTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1F6FEB',
      light: '#388BFD',
      dark: '#0C4CB0',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#238636',
      light: '#2EA043',
      dark: '#1A6328',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#0D1117',
      paper: '#161B22',
    },
    divider: '#30363D',
    text: {
      primary: '#F0F6FC',
      secondary: '#8B949E',
    },
    success: {
      main: '#2EA043',
      light: '#3FB950',
      dark: '#238636',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#D29922',
      light: '#E3B341',
      dark: '#9E6A03',
      contrastText: '#0D1117',
    },
    error: {
      main: '#F85149',
      light: '#FF7B72',
      dark: '#DA3633',
      contrastText: '#FFFFFF',
    },
    info: {
      main: '#58A6FF',
      light: '#79C0FF',
      dark: '#1F6FEB',
      contrastText: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: "'Inter', 'Kanit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    h1: { fontWeight: 800, letterSpacing: '-0.025em' },
    h2: { fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontWeight: 700, letterSpacing: '-0.015em' },
    h4: { fontWeight: 600, letterSpacing: '-0.01em' },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#0D1117',
          color: '#F0F6FC',
          scrollbarColor: '#30363D #0D1117',
          '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
            width: 8,
            height: 8,
          },
          '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
            borderRadius: 8,
            backgroundColor: '#30363D',
          },
          '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
            backgroundColor: '#484F58',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        containedPrimary: {
          backgroundColor: '#1F6FEB',
          '&:hover': {
            backgroundColor: '#388BFD',
          },
        },
        containedSecondary: {
          backgroundColor: '#238636',
          '&:hover': {
            backgroundColor: '#2EA043',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#161B22',
          border: '1px solid #30363D',
          backgroundImage: 'none',
          borderRadius: 12,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#161B22',
          borderBottom: '1px solid #30363D',
          boxShadow: 'none',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#161B22',
          borderRight: '1px solid #30363D',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 6,
        },
      },
    },
  },
});

export default muiTheme;
