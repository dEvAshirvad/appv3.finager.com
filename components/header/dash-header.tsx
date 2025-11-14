import React from "react";
import { SidebarTrigger } from "../ui/sidebar";
import OrganisationSheet from "../sheets/organisation";
import NotificationSheet from "../sheets/notifications";
import ProfileSheet from "../sheets/profile";
import { Separator } from "../ui/separator";

function DashHeader() {
	return (
		<header className="flex h-16 shrink-0 items-center w-full gap-2 border-b px-4 text-sm justify-between">
			<div className="flex items-center gap-2">
				<SidebarTrigger className="-ml-1" />
				<Separator
					orientation="vertical"
					className="mr-2 data-[orientation=vertical]:h-4"
				/>
			</div>
			<div className="flex items-center gap-2">
				<OrganisationSheet />
				<NotificationSheet />
				<ProfileSheet />
			</div>
		</header>
	);
}

export default DashHeader;
