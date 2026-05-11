/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,ts,jsx,tsx,md}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        surface2: 'var(--surface-2)',
        border: 'var(--border)',
        borderSoft: 'var(--border-soft)',
        fg: 'var(--fg)',
        muted: 'var(--muted)',
        dim: 'var(--dim)',
        faint: 'var(--faint)',
        accent: 'var(--accent)',
        accentDim: 'var(--accent-dim)',
        warn: 'var(--warn)',
        warnDim: 'var(--warn-dim)',
        err: 'var(--err)',
        errDim: 'var(--err-dim)',
        ok: 'var(--ok)',
        okDim: 'var(--ok-dim)',
        codeBg: 'var(--code-bg)',
        codeFg: 'var(--code-fg)',
        codeBorder: 'var(--code-border)',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'monospace'],
        serif: ['Newsreader', 'ui-serif', 'Georgia', 'serif'],
        sans: ['Inter Tight', 'system-ui', '-apple-system', 'sans-serif'],
      },
      letterSpacing: {
        eyebrow: '0.22em',
        nano: '0.18em',
        display: '-0.02em',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.2, 0.6, 0.2, 1)',
      },
    },
  },
  plugins: [],
}