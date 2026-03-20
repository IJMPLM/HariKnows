import "./globals.css";

export const metadata = {
  title: "HariKnows Helpdesk",
  description: "Registrar helpdesk chatbot"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
