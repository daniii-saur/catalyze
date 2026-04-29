import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      keyframes: {
        fadeInUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseScale: {
          '0%':   { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        fadeInUp:   'fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        pulseScale: 'pulseScale 0.3s ease-out forwards',
      },
      colors: {
        brand: {
          50:  '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        },
        sky: {
          nav: '#90D9FB',
          bg:  '#8FD9FB',
        },
        accent: {
          orange: '#E28331',
          'orange-dark': '#A92804',
        },
      },
    },
  },
  plugins: [],
}

export default config
