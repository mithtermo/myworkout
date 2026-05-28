/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 50:'#EBF3FB',100:'#D5E8F4',200:'#A8D0EA',300:'#7AB7DF',400:'#4D9FD5',500:'#2E6DA4',600:'#245589',700:'#1A3C5E' },
        health: { green:'#1D6A3A', greenBg:'#D8EFDF', amber:'#7A4F00', amberBg:'#FEF3D0', red:'#8B1A1A', redBg:'#FDECEA' },
      },
      fontFamily: { sans: ['Inter','system-ui','sans-serif'] },
    },
  },
  plugins: [],
};
