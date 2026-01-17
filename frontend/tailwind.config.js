/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // 品牌色
        primary: '#8b5cf6', // 紫色
        secondary: '#3b82f6', // 蓝色
        accent: '#06b6d4', // 青色

        // 功能色
        success: '#10b981', // 绿色 - 上涨/利好
        danger: '#ef4444', // 红色 - 下跌/利空
        warning: '#f59e0b', // 橙色 - 警告
        info: '#3b82f6', // 蓝色 - 信息

        // 背景色
        'bg-primary': '#0a0a0f', // 深黑
        'bg-secondary': '#1a1a24', // 次级背景
        'bg-card': 'rgba(255, 255, 255, 0.05)', // 卡片背景

        // 文本色
        'text-primary': '#ffffff',
        'text-secondary': '#a0a0b0',
        'text-tertiary': '#606070',

        // 边框色
        border: 'rgba(255, 255, 255, 0.1)',
      },
      backgroundImage: {
        'gradient-primary':
          'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 50%, #06b6d4 100%)',
        'gradient-card':
          'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
        'gradient-button':
          'linear-gradient(90deg, #8b5cf6 0%, #3b82f6 100%)',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: ['SF Mono', 'Monaco', 'Courier New', 'monospace'],
      },
      fontSize: {
        xs: '12px',
        sm: '14px',
        base: '16px',
        lg: '18px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '30px',
        '4xl': '36px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        pulse: 'pulse 1s ease-in-out infinite',
        spin: 'spin 1s linear infinite',
        shimmer: 'shimmer 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
