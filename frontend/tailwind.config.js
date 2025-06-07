/** @type {import('tailwindcss').Config} */

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Merriweather', 'serif'],
        display: ['Cormorant Garamond', 'serif'],
		fantasy: ['"Cinzel Decorative"', 'serif'],
      },
      colors: {
        parchment: '#faf3e0',
        textDark: '#3b2f2f',
        accentGreen: '#4b7f52',
        accentBlue: '#3c6e71',
      },
    },
  },
  plugins: [],
};

