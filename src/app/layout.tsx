import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "KISS FM",
  description: "KISS FM — Luister live, playlist, programmering en meer.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/api/favicon" />
        <link rel="apple-touch-icon" href="/api/favicon" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  // Default is LIGHT. Only enable dark if user explicitly chose it.
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var keyPrefix = 'kiss-autosave:';
                  function fieldKey(el) {
                    var form = el.form;
                    var formName = (form && (form.getAttribute('name') || form.getAttribute('id') || form.getAttribute('action'))) || 'global';
                    var name = el.name || el.id;
                    if (!name) return null;
                    return keyPrefix + location.pathname + ':' + formName + ':' + name;
                  }
                  function restore() {
                    var fields = document.querySelectorAll('input, textarea, select');
                    fields.forEach(function(el) {
                      var type = (el.getAttribute('type') || '').toLowerCase();
                      if (type === 'password' || type === 'file') return;
                      var k = fieldKey(el);
                      if (!k) return;
                      var saved = localStorage.getItem(k);
                      if (saved == null) return;
                      if (el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')) {
                        el.checked = saved === '1';
                      } else {
                        el.value = saved;
                      }
                    });
                  }
                  function save(ev) {
                    var el = ev.target;
                    if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)) return;
                    var type = (el.getAttribute('type') || '').toLowerCase();
                    if (type === 'password' || type === 'file') return;
                    var k = fieldKey(el);
                    if (!k) return;
                    if (el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')) {
                      localStorage.setItem(k, el.checked ? '1' : '0');
                    } else {
                      localStorage.setItem(k, el.value || '');
                    }
                  }
                  document.addEventListener('DOMContentLoaded', restore);
                  document.addEventListener('input', save, true);
                  document.addEventListener('change', save, true);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased font-sans transition-colors duration-200">
        <Providers>
          <main className="min-h-screen"
                style={{ backgroundColor: 'var(--bg-dark)' }}>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
