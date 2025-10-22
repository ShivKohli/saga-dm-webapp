// app/layout.tsx
import "./globals.css";

export const metadata = {
  title: "Saga DM",
  description: "AI Dungeon Master",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
