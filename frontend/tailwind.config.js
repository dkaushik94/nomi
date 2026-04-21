/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        body: ['Figtree', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
      },
      colors: {
        bg: 'var(--bg)',
        card: 'var(--card)',
        'card-b': 'var(--card-b)',
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        faint: 'var(--faint)',
        accent: 'var(--accent)',
        'accent-pressed': 'var(--accent-pressed)',
        'accent-soft': 'var(--accent-soft)',
        'accent-fg': 'var(--accent-fg)',
        brd: 'var(--border)',
        'brd-strong': 'var(--border-strong)',
        red: 'var(--red)',
        'red-bg': 'var(--red-bg)',
        warn: 'var(--warn)',
        'warn-bg': 'var(--warn-bg)',
      },
      borderRadius: {
        sm: '8px',
        DEFAULT: '12px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
        full: '9999px',
      },
      boxShadow: {
        card: 'var(--shadow)',
        lg: 'var(--shadow-lg)',
      },
    },
  },
  plugins: [],
}
