import "./globals.css";

export const metadata = {
  title: "HariKnows Registrar",
  description: "Registrar administration dashboard"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
