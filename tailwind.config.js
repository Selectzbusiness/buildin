/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        'mint': {
          500: '#98FF98',
          600: '#7AFF7A',
        },
        'emerald': {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E40',
        },
        ocean: {
          light: '#00c6fb', // ocean blue
          dark: '#005bea',  // navy blue
        },
      },
      gridTemplateColumns: {
        'home-cols': '38% 38% 24%',
      },
      backgroundImage: {
        'ocean-gradient': 'linear-gradient(135deg, #00c6fb 0%, #005bea 100%)',
      },
    },
  },
  plugins: [],
} 