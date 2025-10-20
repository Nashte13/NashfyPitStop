/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/**/*.html", "./public/**/*.js"],
  theme: {
    extend: {
      colors: {
        // Lakers-inspired palette
        lakers: {
          gold: "#FDB927",
          purple: "#552583",
          black: "#121212",
          offwhite: "#F7F7F7",
        },
        kenya: {
          green: "#006600",
          red: "#BB2020",
          black: "#000000",
          white: "#FFFFFF",
        }
      },
      boxShadow: {
        card: "0 10px 25px -10px rgba(0,0,0,0.4)",
      },
      fontFamily: {
        display: ["Poppins", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Ubuntu", "Cantarell", "Noto Sans", "Helvetica Neue", "Arial", "sans-serif"],
      }
    },
  },
  plugins: [],
};


