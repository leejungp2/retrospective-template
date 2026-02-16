import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "회고 - 일일/주간/연간 회고 웹앱",
  description: "템플릿과 대화형 코치로 쉽게 회고를 작성하고, Action Item을 추적하세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased bg-gray-50 text-gray-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
