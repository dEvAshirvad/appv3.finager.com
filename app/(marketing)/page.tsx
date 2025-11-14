import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
	Calculator,
	Shield,
	Zap,
	BarChart3,
	CheckCircle,
	Users,
	Building2,
	ArrowRight,
	Star,
	Mail,
	Phone,
	MapPin,
	FileText,
	TrendingUp,
} from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
			{/* Navigation */}
			<nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-16">
						<div className="flex items-center">
							<span className="text-xl font-bold text-gray-900">
								Finager India
							</span>
						</div>
						<div className="hidden md:flex items-center space-x-8">
							<Link
								href="#features"
								className="text-gray-600 hover:text-primary transition-colors">
								Features
							</Link>
							<Link
								href="#pricing"
								className="text-gray-600 hover:text-primary transition-colors">
								Pricing
							</Link>
							<Link
								href="#testimonials"
								className="text-gray-600 hover:text-primary transition-colors">
								Testimonials
							</Link>
							<Link
								href="#contact"
								className="text-gray-600 hover:text-primary transition-colors">
								Contact
							</Link>
						</div>
						<div className="flex items-center space-x-4">
							<Link href="#">
								<Button variant="ghost">Coming Soon</Button>
							</Link>
						</div>
					</div>
				</div>
			</nav>

			{/* Hero Section */}
			<section className="py-20 px-4 sm:px-6 lg:px-8">
				<div className="max-w-7xl mx-auto">
					<div className="text-center">
						<Badge variant="secondary" className="mb-4">
							<Shield className="w-4 h-4 mr-1" />
							Ind AS & DPDP Act 2023 Compliant
						</Badge>
						<h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
							Automate Your Accounting &
							<span className="text-primary"> GST Reconciliation</span>
						</h1>
						<p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
							The only platform that combines dynamic ledger templates with
							rule-based engines for seamless third-party data integration.
							Built for CAs and small businesses in India.
						</p>
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<Link href="#">
								<Button size="lg" className="w-full sm:w-auto">
									Start Free Trial
									<ArrowRight className="ml-2 h-4 w-4" />
								</Button>
							</Link>
							<Button variant="outline" size="lg" className="w-full sm:w-auto">
								Request Demo
							</Button>
						</div>
						<p className="text-sm text-gray-500 mt-4">
							No credit card required • 14-day free trial • Setup in 5 minutes
						</p>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section id="features" className="py-20 bg-white">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center mb-16">
						<h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
							Everything You Need for Modern Accounting
						</h2>
						<p className="text-xl text-gray-600 max-w-2xl mx-auto">
							Our MVP features are designed to streamline your accounting
							workflow and ensure compliance with Indian regulations.
						</p>
					</div>

					<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
						<Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
							<CardHeader>
								<div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
									<Calculator className="h-6 w-6 text-primary" />
								</div>
								<CardTitle>Dynamic Ledger Templates</CardTitle>
								<CardDescription>
									Rule-based engine automatically processes third-party data
									from POS, e-commerce, and banking systems into your accounting
									ledgers.
								</CardDescription>
							</CardHeader>
						</Card>

						<Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
							<CardHeader>
								<div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
									<Zap className="h-6 w-6 text-primary" />
								</div>
								<CardTitle>Automated GST Reconciliation</CardTitle>
								<CardDescription>
									Seamlessly reconcile GST returns with your books, reducing
									errors and saving hours of manual work every month.
								</CardDescription>
							</CardHeader>
						</Card>

						<Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
							<CardHeader>
								<div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
									<BarChart3 className="h-6 w-6 text-primary" />
								</div>
								<CardTitle>Real-time Dashboards</CardTitle>
								<CardDescription>
									User-friendly dashboards provide instant insights into your
									financial health with customizable reports and analytics.
								</CardDescription>
							</CardHeader>
						</Card>

						<Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
							<CardHeader>
								<div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
									<Shield className="h-6 w-6 text-primary" />
								</div>
								<CardTitle>Compliance Ready</CardTitle>
								<CardDescription>
									Built-in compliance with Ind AS, Companies Act 2013, and DPDP
									Act 2023 ensures you&rsquo;re always audit-ready.
								</CardDescription>
							</CardHeader>
						</Card>

						<Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
							<CardHeader>
								<div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
									<Users className="h-6 w-6 text-primary" />
								</div>
								<CardTitle>Multi-Client Management</CardTitle>
								<CardDescription>
									Perfect for CAs managing multiple clients with separate
									workspaces, user permissions, and client-specific
									configurations.
								</CardDescription>
							</CardHeader>
						</Card>

						<Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
							<CardHeader>
								<div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
									<FileText className="h-6 w-6 text-primary" />
								</div>
								<CardTitle>Automated Reports</CardTitle>
								<CardDescription>
									Generate P&L, Balance Sheet, Cash Flow, and GST reports
									automatically with customizable templates and scheduling.
								</CardDescription>
							</CardHeader>
						</Card>
					</div>
				</div>
			</section>

			{/* USP Section */}
			<section className="py-20 bg-gradient-to-r from-primary/5 to-blue-50">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="grid lg:grid-cols-2 gap-12 items-center">
						<div>
							<h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
								Why Choose Finager?
							</h2>
							<div className="space-y-6">
								<div className="flex items-start">
									<CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
									<div>
										<h3 className="text-lg font-semibold text-gray-900 mb-2">
											Built for Indian Businesses
										</h3>
										<p className="text-gray-600">
											Specifically designed for Indian accounting standards and
											GST requirements, with local compliance built-in.
										</p>
									</div>
								</div>
								<div className="flex items-start">
									<CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
									<div>
										<h3 className="text-lg font-semibold text-gray-900 mb-2">
											IBITF Mentored
										</h3>
										<p className="text-gray-600">
											Backed by IBITF mentoring program, ensuring
											enterprise-grade quality and continuous innovation.
										</p>
									</div>
								</div>
								<div className="flex items-start">
									<CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
									<div>
										<h3 className="text-lg font-semibold text-gray-900 mb-2">
											Licensing Ready
										</h3>
										<p className="text-gray-600">
											Platform designed for commercialization through licensing
											to fintech startups and CA firms.
										</p>
									</div>
								</div>
							</div>
						</div>
						<div className="relative">
							<div className="bg-white rounded-2xl shadow-2xl p-8">
								<div className="text-center mb-6">
									<div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
										<TrendingUp className="h-8 w-8 text-primary" />
									</div>
									<h3 className="text-xl font-semibold text-gray-900">
										ROI Calculator
									</h3>
								</div>
								<div className="space-y-4">
									<div className="flex justify-between items-center">
										<span className="text-gray-600">Time Saved per Month</span>
										<span className="font-semibold text-primary">
											40+ hours
										</span>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-gray-600">Error Reduction</span>
										<span className="font-semibold text-primary">95%</span>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-gray-600">Compliance Score</span>
										<span className="font-semibold text-primary">100%</span>
									</div>
									<Separator />
									<div className="flex justify-between items-center text-lg font-bold">
										<span>Monthly Savings</span>
										<span className="text-green-600">₹50,000+</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Testimonials Section */}
			<section id="testimonials" className="py-20 bg-white">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center mb-16">
						<h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
							Trusted by Accounting Professionals
						</h2>
						<p className="text-xl text-gray-600">
							See what our users say about Finager
						</p>
					</div>

					<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
						<Card className="border-0 shadow-lg">
							<CardContent className="p-6">
								<div className="flex items-center mb-4">
									{[...Array(5)].map((_, i) => (
										<Star
											key={i}
											className="h-5 w-5 text-yellow-400 fill-current"
										/>
									))}
								</div>
								<p className="text-gray-600 mb-4">
									&ldquo;Finager has revolutionized how we handle client
									accounts. The automated GST reconciliation alone saves us 20
									hours per month per client.&rdquo;
								</p>
								<div className="flex items-center">
									<div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
										<Users className="h-5 w-5 text-primary" />
									</div>
									<div>
										<p className="font-semibold text-gray-900">Rajesh Kumar</p>
										<p className="text-sm text-gray-500">
											Chartered Accountant
										</p>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card className="border-0 shadow-lg">
							<CardContent className="p-6">
								<div className="flex items-center mb-4">
									{[...Array(5)].map((_, i) => (
										<Star
											key={i}
											className="h-5 w-5 text-yellow-400 fill-current"
										/>
									))}
								</div>
								<p className="text-gray-600 mb-4">
									&ldquo;The dynamic ledger templates are a game-changer. Our
									e-commerce data flows seamlessly into our books without any
									manual intervention.&rdquo;
								</p>
								<div className="flex items-center">
									<div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
										<Building2 className="h-5 w-5 text-primary" />
									</div>
									<div>
										<p className="font-semibold text-gray-900">Priya Sharma</p>
										<p className="text-sm text-gray-500">Business Owner</p>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card className="border-0 shadow-lg">
							<CardContent className="p-6">
								<div className="flex items-center mb-4">
									{[...Array(5)].map((_, i) => (
										<Star
											key={i}
											className="h-5 w-5 text-yellow-400 fill-current"
										/>
									))}
								</div>
								<p className="text-gray-600 mb-4">
									&ldquo;Compliance has never been easier. The platform ensures
									we&rsquo;re always audit-ready with Ind AS and DPDP Act
									compliance built-in.&rdquo;
								</p>
								<div className="flex items-center">
									<div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
										<Shield className="h-5 w-5 text-primary" />
									</div>
									<div>
										<p className="font-semibold text-gray-900">Amit Patel</p>
										<p className="text-sm text-gray-500">CA Firm Partner</p>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* Pricing Section */}
			<section
				id="pricing"
				className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center mb-16">
						<h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
							Simple, Transparent Pricing
						</h2>
						<p className="text-xl text-gray-600">
							Choose the plan that fits your business needs
						</p>
					</div>

					<div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
						<Card className="border-0 shadow-lg">
							<CardHeader className="text-center">
								<CardTitle className="text-xl">Starter</CardTitle>
								<div className="text-3xl font-bold text-gray-900 mt-4">
									₹2,999<span className="text-lg text-gray-500">/month</span>
								</div>
								<CardDescription>Perfect for small businesses</CardDescription>
							</CardHeader>
							<CardContent>
								<ul className="space-y-3">
									<li className="flex items-center">
										<CheckCircle className="h-4 w-4 text-green-500 mr-2" />
										Up to 5 clients
									</li>
									<li className="flex items-center">
										<CheckCircle className="h-4 w-4 text-green-500 mr-2" />
										Basic GST reconciliation
									</li>
									<li className="flex items-center">
										<CheckCircle className="h-4 w-4 text-green-500 mr-2" />
										Standard reports
									</li>
									<li className="flex items-center">
										<CheckCircle className="h-4 w-4 text-green-500 mr-2" />
										Email support
									</li>
								</ul>
								<Button className="w-full mt-6" variant="outline">
									Start Free Trial
								</Button>
							</CardContent>
						</Card>

						<Card className="border-2 border-primary shadow-xl relative">
							<div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
								<Badge className="bg-primary text-white">Most Popular</Badge>
							</div>
							<CardHeader className="text-center">
								<CardTitle className="text-xl">Professional</CardTitle>
								<div className="text-3xl font-bold text-gray-900 mt-4">
									₹7,999<span className="text-lg text-gray-500">/month</span>
								</div>
								<CardDescription>For growing CA practices</CardDescription>
							</CardHeader>
							<CardContent>
								<ul className="space-y-3">
									<li className="flex items-center">
										<CheckCircle className="h-4 w-4 text-green-500 mr-2" />
										Up to 25 clients
									</li>
									<li className="flex items-center">
										<CheckCircle className="h-4 w-4 text-green-500 mr-2" />
										Advanced GST reconciliation
									</li>
									<li className="flex items-center">
										<CheckCircle className="h-4 w-4 text-green-500 mr-2" />
										Dynamic ledger templates
									</li>
									<li className="flex items-center">
										<CheckCircle className="h-4 w-4 text-green-500 mr-2" />
										Priority support
									</li>
									<li className="flex items-center">
										<CheckCircle className="h-4 w-4 text-green-500 mr-2" />
										API access
									</li>
								</ul>
								<Button className="w-full mt-6">Start Free Trial</Button>
							</CardContent>
						</Card>

						<Card className="border-0 shadow-lg">
							<CardHeader className="text-center">
								<CardTitle className="text-xl">Enterprise</CardTitle>
								<div className="text-3xl font-bold text-gray-900 mt-4">
									Custom<span className="text-lg text-gray-500">/month</span>
								</div>
								<CardDescription>For large CA firms</CardDescription>
							</CardHeader>
							<CardContent>
								<ul className="space-y-3">
									<li className="flex items-center">
										<CheckCircle className="h-4 w-4 text-green-500 mr-2" />
										Unlimited clients
									</li>
									<li className="flex items-center">
										<CheckCircle className="h-4 w-4 text-green-500 mr-2" />
										White-label solution
									</li>
									<li className="flex items-center">
										<CheckCircle className="h-4 w-4 text-green-500 mr-2" />
										Custom integrations
									</li>
									<li className="flex items-center">
										<CheckCircle className="h-4 w-4 text-green-500 mr-2" />
										Dedicated support
									</li>
									<li className="flex items-center">
										<CheckCircle className="h-4 w-4 text-green-500 mr-2" />
										On-premise deployment
									</li>
								</ul>
								<Button className="w-full mt-6" variant="outline">
									Contact Sales
								</Button>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* Contact Section */}
			<section id="contact" className="py-20 bg-white">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center mb-16">
						<h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
							Ready to Transform Your Accounting?
						</h2>
						<p className="text-xl text-gray-600">
							Get in touch with our team to learn more about Finager
						</p>
					</div>

					<div className="mx-auto max-w-xl">
						<div>
							<h3 className="text-2xl font-semibold text-gray-900 mb-6">
								Get Started Today
							</h3>
							<form className="space-y-6">
								<div className="grid md:grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											First Name
										</label>
										<Input placeholder="Enter your first name" />
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Last Name
										</label>
										<Input placeholder="Enter your last name" />
									</div>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Email
									</label>
									<Input type="email" placeholder="Enter your email" />
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Company
									</label>
									<Input placeholder="Enter your company name" />
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Message
									</label>
									<Textarea
										placeholder="Tell us about your accounting needs"
										className="resize-none h-24"
									/>
								</div>
								<Button className="w-full" size="lg">
									Send Message
									<ArrowRight className="ml-2 h-4 w-4" />
								</Button>
							</form>
						</div>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="bg-gray-900 text-white py-12">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="grid md:grid-cols-4 gap-8">
						<div>
							<div className="flex items-center mb-4">
								<Building2 className="h-8 w-8 text-primary mr-2" />
								<span className="text-2xl font-bold">Finager</span>
							</div>
							<p className="text-gray-400 mb-4">
								Automating accounting and taxation for modern Indian businesses.
							</p>
						</div>
						<div>
							<h3 className="text-lg font-semibold mb-4">Product</h3>
							<ul className="space-y-2">
								<li>
									<Link
										href="#features"
										className="text-gray-400 hover:text-white transition-colors">
										Features
									</Link>
								</li>
								<li>
									<Link
										href="#pricing"
										className="text-gray-400 hover:text-white transition-colors">
										Pricing
									</Link>
								</li>
								<li>
									<Link
										href="#"
										className="text-gray-400 hover:text-white transition-colors">
										API
									</Link>
								</li>
								<li>
									<Link
										href="#"
										className="text-gray-400 hover:text-white transition-colors">
										Integrations
									</Link>
								</li>
							</ul>
						</div>
						<div>
							<h3 className="text-lg font-semibold mb-4">Company</h3>
							<ul className="space-y-2">
								<li>
									<Link
										href="#"
										className="text-gray-400 hover:text-white transition-colors">
										About
									</Link>
								</li>
								<li>
									<Link
										href="#"
										className="text-gray-400 hover:text-white transition-colors">
										Blog
									</Link>
								</li>
								<li>
									<Link
										href="#"
										className="text-gray-400 hover:text-white transition-colors">
										Careers
									</Link>
								</li>
								<li>
									<Link
										href="#contact"
										className="text-gray-400 hover:text-white transition-colors">
										Contact
									</Link>
								</li>
							</ul>
						</div>
						<div>
							<h3 className="text-lg font-semibold mb-4">Legal</h3>
							<ul className="space-y-2">
								<li>
									<Link
										href="#"
										className="text-gray-400 hover:text-white transition-colors">
										Privacy Policy
									</Link>
								</li>
								<li>
									<Link
										href="#"
										className="text-gray-400 hover:text-white transition-colors">
										Terms of Service
									</Link>
								</li>
								<li>
									<Link
										href="#"
										className="text-gray-400 hover:text-white transition-colors">
										Compliance
									</Link>
								</li>
								<li>
									<Link
										href="#"
										className="text-gray-400 hover:text-white transition-colors">
										Security
									</Link>
								</li>
							</ul>
						</div>
					</div>
					<Separator className="my-8 bg-gray-700" />
					<div className="flex flex-col md:flex-row justify-between items-center">
						<p className="text-gray-400 text-sm">
							© 2024 Finager. All rights reserved.
						</p>
						<p className="text-gray-400 text-sm mt-2 md:mt-0">
							Built with ❤️ for Indian businesses
						</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
