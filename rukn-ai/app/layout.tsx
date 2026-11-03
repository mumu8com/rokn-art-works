import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RUKN AI | الذكاء الاصطناعي لركن",
  description: "المساعد المعرفي الخاص بركن للأعمال الفنية",
  robots: { index: false, follow: false }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl"><body>{children}</body></html>;
}