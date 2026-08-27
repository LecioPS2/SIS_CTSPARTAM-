module.exports = {
  content: ['./src/**/*.{js,jsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        bg: '#0A0A0A',
        card: '#121212',
        surface: '#1A1A1A',
        line: '#27272A',
        accent: '#FF3B30',
        accenth: '#FF645A',
        muted: '#A1A1AA',
        ok: '#22C55E',
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        sans: ['"DM Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
