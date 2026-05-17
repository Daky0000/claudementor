import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Claudementor — Design to Elementor",
  description:
    "Turn Claude AI website designs into editable Elementor JSON files. Design, preview, and export in seconds.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
