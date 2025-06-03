import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
	title: "Log Parser",
	description: "Upload, parse, and visualize server logs with interactive analytics and cloud storage.",
};

export default function RootLayout({
	children,
}: Readonly<{
children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<div className="w-full px-4 pt-8">
					{children}
				</div>
			</body>
		</html>
	);
}
