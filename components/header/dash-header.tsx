import React from "react";
import { SidebarTrigger } from "../ui/sidebar";

function DashHeader() {
	return (
		<header className="border-b p-2">
			<nav className="size-12 p-2 flex items-center">
				<SidebarTrigger />
			</nav>
		</header>
	);
}

export default DashHeader;
