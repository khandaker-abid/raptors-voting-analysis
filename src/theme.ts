import { createTheme } from "@mui/material/styles";

const theme = createTheme({
	palette: {
		primary: {
			main: "#474442ff",
			light: "#a09e9eff",
			dark: "#191919ff",
		},
		secondary: {
			main: "#f50057",
			light: "#ff5983",
			dark: "#c51162",
		},
		background: {
			default: "#fafafa",
			paper: "#ffffff",
		},
		text: {
			primary: "#2c3e50",
			secondary: "#546e7a",
		},
	},
	typography: {
		fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
		h1: {
			fontWeight: 700,
			letterSpacing: "-0.02em",
		},
		h2: {
			fontWeight: 600,
			letterSpacing: "-0.01em",
		},
		h3: {
			fontWeight: 600,
		},
		h4: {
			fontWeight: 600,
		},
		h5: {
			fontWeight: 600,
		},
		h6: {
			fontWeight: 600,
		},
		button: {
			fontWeight: 600,
			textTransform: "none",
		},
	},
	shape: {
		borderRadius: 12,
	},
	components: {
		MuiPaper: {
			styleOverrides: {
				root: {
					boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
				},
				elevation1: {
					boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
				},
				elevation2: {
					boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
				},
				elevation3: {
					boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
				},
			},
		},
		MuiButton: {
			styleOverrides: {
				root: {
					borderRadius: 8,
					textTransform: "none",
					fontWeight: 600,
					paddingTop: 10,
					paddingBottom: 10,
				},
			},
		},
		MuiContainer: {
			styleOverrides: {
				root: {
					paddingLeft: 24,
					paddingRight: 24,
				},
			},
		},
	},
});

export default theme;
