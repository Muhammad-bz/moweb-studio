/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        void: '#080808',
        ash: '#1a1a1a',
        mist: '#888888',
        silk: '#d4d4d4',
        pure: '#f5f5f5',
      },
    },
  },
  plugins: [],
}
