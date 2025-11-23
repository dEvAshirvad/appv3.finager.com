import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title:
		"Finager - Automated Accounting & GST Reconciliation Platform for Indian Businesses",
	description:
		"Transform your accounting with Finager's dynamic ledger templates and rule-based engine. Automated GST reconciliation, Ind AS compliance, and real-time dashboards for CAs and small businesses in India.",
	keywords:
		"accounting software, GST reconciliation, Ind AS compliance, DPDP Act 2023, chartered accountant software, small business accounting, automated bookkeeping, Indian accounting standards",
	authors: [{ name: "Finager Team" }],
	creator: "Finager",
	publisher: "Finager",
	formatDetection: {
		email: false,
		address: false,
		telephone: false,
	},
	metadataBase: new URL("https://finagerindia.com"),
	alternates: {
		canonical: "/",
	},
	openGraph: {
		title: "Finager - Automated Accounting & GST Reconciliation Platform",
		description:
			"Transform your accounting with Finager's dynamic ledger templates and rule-based engine. Automated GST reconciliation, Ind AS compliance, and real-time dashboards for CAs and small businesses in India.",
		url: "https://finagerindia.com",
		siteName: "Finager",
		images: [
			{
				url: "/vercel.svg",
				width: 1200,
				height: 630,
				alt: "Finager - Accounting Automation Platform",
			},
		],
		locale: "en_IN",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "Finager - Automated Accounting & GST Reconciliation Platform",
		description:
			"Transform your accounting with Finager's dynamic ledger templates and rule-based engine. Automated GST reconciliation, Ind AS compliance, and real-time dashboards for CAs and small businesses in India.",
		images: ["/vercel.svg"],
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
	verification: {
		google: "your-google-verification-code",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
				suppressHydrationWarning>
				<QueryProvider>
					{children}
					<Toaster />
				</QueryProvider>
			</body>
		</html>
	);
}
