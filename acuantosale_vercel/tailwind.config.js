/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        farmatodo: {
          green: '#00a651',
          dark: '#007a3d',
        },
        locatel: {
          blue: '#0055a5',
          dark: '#003f7d',
        },
        gama: {
          red:  '#E30613',
          dark: '#b0000e',
        },
        luvebras: {
          green: '#2e7d32',
          dark:  '#1b5e20',
        },
      },
    },
  },
  plugins: [],
}
