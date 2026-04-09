/**
 * app/layout.js — Root layout with Inter font + dark mode toggle support
 */
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'TruthLens AI — Hallucination Detector',
  description: 'Detect AI hallucinations instantly. Verify AI-generated content for factual accuracy.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* Prevent flash on dark mode */}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var theme = localStorage.getItem('theme');
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                }
              } catch(e) {}
            })();
          `
        }} />
      </head>
      <body>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            className: 'text-sm',
            style: { fontFamily: 'Inter, system-ui, sans-serif' },
            success: { duration: 3000 },
            error: { duration: 4000 },
          }}
        />
      </body>
    </html>
  );
}
