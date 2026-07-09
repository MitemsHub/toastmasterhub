import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Toast Masters Hub",
  description: "A focused VPE workspace for sending evaluator confirmations and reviewing club responses.",
  metadataBase: new URL("http://localhost:3000"),
};

export const viewport = {
  themeColor: "#f7f4ee",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Script
          id="strip-trae-preview-attrs"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (() => {
                const attrName = "data-trae-ref";
                const stripAttr = () => {
                  document.querySelectorAll("[" + attrName + "]").forEach((node) => {
                    node.removeAttribute(attrName);
                  });
                };

                stripAttr();

                const observer = new MutationObserver((mutations) => {
                  let shouldStrip = false;

                  for (const mutation of mutations) {
                    if (mutation.type === "attributes" && mutation.attributeName === attrName) {
                      shouldStrip = true;
                      break;
                    }
                  }

                  if (shouldStrip) {
                    stripAttr();
                  }
                });

                observer.observe(document.documentElement, {
                  subtree: true,
                  attributes: true,
                  attributeFilter: [attrName],
                });

                window.addEventListener("load", () => observer.disconnect(), { once: true });
              })();
            `,
          }}
        />
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <div id="main-content" className="flex min-h-full flex-1 flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
