/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
      },
      colors: {
        navy: {
          50: '#f0f4fa', 100: '#e0e9f3', 200: '#c7d4e9', 300: '#9fb5d4',
          400: '#6b8bba', 500: '#476a99', 600: '#34517a', 700: '#284063',
          800: '#1e3252', 900: '#0b1f3a', 950: '#061425',
        },
        gold: {
          50: '#fbf7ee', 100: '#f8edcf', 200: '#f0d89a', 300: '#e6c060',
          400: '#d9a82e', 500: '#bf8d1c', 600: '#9a7018', 700: '#765315',
          800: '#543d11', 900: '#33250a',
        },
      },
    },
  },
  plugins: [],
}
