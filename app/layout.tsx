import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";

export const metadata: Metadata = {
  title: "वृद्धा पेंशन समीक्षा प्रणाली – हरियाणा | Old Age Pension Review Portal",
  description:
    "तहसील/ब्लॉक स्तरीय अधिकारियों के लिए वृद्धा पेंशन आवेदन समीक्षा उपकरण | Review Tool for Haryana Pension Officers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hi" dir="ltr">
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
