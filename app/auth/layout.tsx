import { Book } from "lucide-react";
import React from "react";

function AuthLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="h-screen flex justify-center pt-10 bg-primary/5">
			<div className="max-w-2xl w-full">
				<div className="flex gap-6 py-5 items-center">
					<div className="flex gap-2 items-center">
						<Book className="size-10" />
						<div className="flex flex-col gap-0.5">
							<h1 className="text-sm font-medium leading-none">Finager</h1>
							<h1 className="text-2xl font-bold leading-none">India</h1>
						</div>
					</div>
					<div className="w-0.5 h-14 bg-border"></div>
					<p className="w-3/5 text-sm text-muted-foreground text-balance leading-snug">
						Finager India is your end-to-end online accounting automation
						software.
					</p>
				</div>
				<div className="bg-background p-12 shadow-md border-t-2 border-primary">
					{children}
				</div>
			</div>
		</div>
	);
}

export default AuthLayout;
