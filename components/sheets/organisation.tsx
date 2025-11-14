"use client";

import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import * as RadioGroup from "@radix-ui/react-radio-group";

import {
	Building2,
	CircleCheck,
	Settings,
	XIcon,
	Loader2,
	PlusIcon,
} from "lucide-react";
import { Button } from "../ui/button";
import {
	useOrganizationList,
	useSetActiveOrganization,
} from "@/queries/organization";
import { useSession } from "@/queries/auth";
import { useRouter } from "next/navigation";

function OrganisationSheet() {
	const { data: organizations, isLoading: isLoadingOrgs } =
		useOrganizationList();
	const { data: sessionData } = useSession();
	const { mutate: setActiveOrganization, isPending } =
		useSetActiveOrganization();
	const router = useRouter();

	const activeOrganizationId = sessionData?.session?.activeOrganizationId;

	const handleOrganizationChange = (organizationId: string) => {
		if (organizationId === activeOrganizationId) {
			return; // Already active, no need to switch
		}
		setActiveOrganization({ organizationId });
	};

	return (
		<Sheet>
			<SheetTrigger asChild>
				<Button variant="outline">
					<Building2 />
					<span>
						{organizations?.find((org) => org.id === activeOrganizationId)
							?.name || "Select Organization"}
					</span>
				</Button>
			</SheetTrigger>
			<SheetContent hideCloseButton className="gap-0">
				<SheetHeader className="bg-accent border-b py-5 px-6 flex flex-row items-center justify-between">
					<SheetTitle>Organisation</SheetTitle>
					<div className="flex items-center gap-2">
						<Button
							variant={"link"}
							onClick={() => router.push("/organizations")}>
							<Settings />
							Manage
						</Button>
						<SheetClose className="ring-offset-background focus:ring-ring data-[state=open]:bg-secondary rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none">
							<XIcon className="size-4" />
							<span className="sr-only">Close</span>
						</SheetClose>
					</div>
				</SheetHeader>
				<div className="py-4 px-6 border-b flex flex-row items-center justify-between">
					<h1 className="font-semibold">My Organisations</h1>
					<SheetClose asChild>
						<Button
							variant="link"
							onClick={() => router.push("/organizations/create")}>
							<PlusIcon className="size-4" />
							Create
						</Button>
					</SheetClose>
				</div>
				{isLoadingOrgs ? (
					<div className="flex items-center justify-center py-8">
						<Loader2 className="h-6 w-6 animate-spin" />
					</div>
				) : organizations && organizations.length > 0 ? (
					<RadioGroup.Root
						value={activeOrganizationId || organizations[0]?.id}
						onValueChange={handleOrganizationChange}
						className="space-y-0 divide-y border-b"
						disabled={isPending}>
						{organizations.map((organization) => (
							<RadioGroup.Item
								value={organization.id}
								asChild
								key={organization.id}
								disabled={isPending}>
								<div className="py-4 px-6 bg-accent flex items-center justify-between hover:bg-accent/80 cursor-pointer data-[state=checked]:bg-primary/5 group disabled:opacity-50 disabled:cursor-not-allowed">
									<div className="flex items-center gap-2">
										<div className="size-10 rounded-md bg-background flex items-center justify-center ">
											<Building2 className="size-4" />
										</div>
										<div className="flex flex-col gap-0">
											<h1 className="font-semibold">{organization.name}</h1>
											<p className="text-xs text-muted-foreground">
												{organization.slug}
											</p>
										</div>
									</div>
									{isPending && organization.id === activeOrganizationId ? (
										<Loader2 className="size-6 animate-spin text-primary" />
									) : (
										<CircleCheck className="size-6 text-muted-foreground group-data-[state=checked]:text-primary rounded-full transition-colors" />
									)}
								</div>
							</RadioGroup.Item>
						))}
					</RadioGroup.Root>
				) : (
					<div className="py-8 px-6 text-center text-muted-foreground">
						<p>No organizations found</p>
						<Button
							variant="link"
							className="mt-2"
							onClick={() => router.push("/organizations")}>
							Create Organization
						</Button>
					</div>
				)}
			</SheetContent>
		</Sheet>
	);
}

export default OrganisationSheet;
