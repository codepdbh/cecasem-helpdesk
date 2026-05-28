/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cecasem: {
          navy: '#123653',
          blue: '#146b8f',
          teal: '#1e8a87',
          mist: '#edf4f6',
          gold: '#d9a441',
        },
      },
      boxShadow: {
        panel: '0 8px 30px rgba(18, 54, 83, 0.08)',
      },
    },
  },
  plugins: [],
};

