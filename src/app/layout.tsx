import type { Metadata } from "next";
import { EssentialStorageNotice } from "@/components/consent/essential-storage-notice";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIBAU Degree Advisor",
  description:
    "Independent guidance for exploring Sukkur IBA University undergraduate programs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <EssentialStorageNotice />
      </body>
    </html>
  );
}
