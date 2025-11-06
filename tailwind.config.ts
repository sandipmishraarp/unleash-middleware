import type { Config } from 'tailwindcss';

const config: Config = {

  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        success: '#22c55e',
        warning: '#f97316',
        danger: '#ef4444',
      },
    },

  },
  plugins: [],
};

export default config;
