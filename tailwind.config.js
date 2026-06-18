/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Tła
        'bg-page': '#FBEAF0', // pudrowy róż - tło strony głównej
        'bg-ink': '#1A1A1A', // czarny obrys

        // Akcenty
        'accent': '#D4537E', // magenta/róż - główny akcent tekstu/CTA
        'accent-soft': '#F6D3DF',

        // WhatsApp CTA
        'whatsapp': '#639922',
        'whatsapp-fg': '#EAF3DE',

        // Bąbelek komentarza / podgląd / status omówione
        'bubble': '#EAF3DE',
        'bubble-border': '#C9DCAF',

        // Status zaplanowane
        'scheduled': '#FAEEDA',
        'scheduled-border': '#EAD2A0',

        // Błędy / usuń
        'danger-bg': '#FCEBEB',
        'danger-fg': '#791F1F',
        'danger-border': '#F0B8B8',
      },
      borderRadius: {
        'card': '20px',
        'card-lg': '28px',
        'pill': '999px',
      },
      borderWidth: {
        '3': '3px',
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        sans: ['var(--font-body)', 'sans-serif'],
      },
      boxShadow: {
        chunky: '4px 4px 0 0 #1A1A1A',
        'chunky-sm': '2px 2px 0 0 #1A1A1A',
      },
      keyframes: {
        'fade-slide-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-slide-in': 'fade-slide-in 180ms ease-out',
      },
    },
  },
  plugins: [],
};
