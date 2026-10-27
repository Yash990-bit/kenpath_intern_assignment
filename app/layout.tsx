import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "वृद्धा पेंशन समीक्षा प्रणाली – हरियाणा",
  description:
    "तहसील/ब्लॉक स्तरीय अधिकारियों के लिए वृद्धा पेंशन आवेदन समीक्षा उपकरण",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hi" dir="ltr">
      <body>{children}</body>
    </html>
  );
}
