/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#d9c5a0',
          100: '#c8ab76',
          200: '#bd9a5a',
          300: '#8f7139',
          400: '#735b2e',
          500: '#574523',
          600: '#3b2e18',
          700: '#1f180c',
          800: '#110d07',
          900: '#030201',
        },
      },
      borderRadius: {
        lg: '8px',
      },
    },
  },
  plugins: [],
}


