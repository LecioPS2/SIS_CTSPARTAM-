module.exports = {
  content: ['./src/**/*.{js,jsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        bg: '#040d1e',
        card: '#0a1428',
        surface: '#101c33',
        line: '#1c2a45',
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
