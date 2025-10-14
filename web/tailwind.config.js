/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Colores institucionales Gobierno de Hidalgo
        primary: {
          DEFAULT: '#9F2241', // Pantone 7420 C
          dark: '#691C32',    // Pantone 7421 C
        },
        secondary: {
          DEFAULT: '#235B4E', // Pantone 626 C
          dark: '#10312B',    // Pantone 627 C
        },
        accent: {
          gold: '#BC955C',    // Pantone 465 C
          light: '#DDC9A3',   // Pantone 468 C
        },
        neutral: {
          gray: '#6F7271',    // Pantone 424 C
          'cool-gray': '#98989A', // Cool Gray 7 C
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('daisyui'),
  ],
  daisyui: {
    themes: [
      {
        hidalgo: {
          'primary': '#9F2241',
          'primary-content': '#ffffff',
          'secondary': '#235B4E',
          'secondary-content': '#ffffff',
          'accent': '#BC955C',
          'accent-content': '#ffffff',
          'neutral': '#6F7271',
          'neutral-content': '#ffffff',
          'base-100': '#ffffff',
          'base-200': '#f5f5f5',
          'base-300': '#e5e5e5',
          'base-content': '#1f2937',
          'info': '#3abff8',
          'success': '#36d399',
          'warning': '#fbbd23',
          'error': '#f87272',
        },
        'hidalgo-dark': {
          'primary': '#9F2241',
          'primary-content': '#ffffff',
          'secondary': '#235B4E',
          'secondary-content': '#ffffff',
          'accent': '#BC955C',
          'accent-content': '#ffffff',
          'neutral': '#10312B',
          'neutral-content': '#DDC9A3',
          'base-100': '#1f2937',
          'base-200': '#111827',
          'base-300': '#0f172a',
          'base-content': '#f3f4f6',
          'info': '#3abff8',
          'success': '#36d399',
          'warning': '#fbbd23',
          'error': '#f87272',
        },
      },
    ],
    darkTheme: 'hidalgo-dark',
    base: true,
    styled: true,
    utils: true,
  },
};
