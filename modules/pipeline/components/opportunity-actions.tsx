"use client";

import { useState } from "react";
import { RiAddLine, RiArrowRightSLine, RiCloseLine, RiCoinsLine, RiDeleteBinLine, RiEditLine, RiExternalLinkLine, RiFileCopyLine, RiMore2Fill } from "@remixicon/react";
import { Dropdown, DropdownDivider, DropdownItem, DropdownPopover, DropdownTrigger } from "@/components/base/dropdown/dropdown";

export type OpportunityAction = "details" | "edit" | "stage" | "activity" | "payment" | "lost" | "clone" | "delete";

export function OpportunityActions({ name, isLost, onAction }: { name: string; isLost: boolean; onAction: (action: OpportunityAction) => void }) {
  const [open, setOpen] = useState(false);
  const select = (action: OpportunityAction) => { setOpen(false); onAction(action); };
  return <Dropdown isOpen={open} onOpenChange={setOpen}>
    <DropdownTrigger aria-label={`Actions for ${name}`} className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-lg text-foreground-icon-secondary hover:bg-background-secondary-hover"><RiMore2Fill className="size-5" aria-hidden /></DropdownTrigger>
    <DropdownPopover aria-label={`Opportunity actions for ${name}`} placement="bottom end" dialogClassName="[&_svg]:size-4 [&_svg]:shrink-0">
      <DropdownItem onSelect={() => select("details")}><RiExternalLinkLine />View lead details</DropdownItem>
      <DropdownItem onSelect={() => select("edit")}><RiEditLine />Edit opportunity</DropdownItem>
      <DropdownItem onSelect={() => select("stage")}><RiArrowRightSLine />{isLost ? "Reopen opportunity" : "Update stage"}</DropdownItem>
      <DropdownItem onSelect={() => select("activity")}><RiAddLine />Add activity</DropdownItem>
      <DropdownItem onSelect={() => select("payment")}><RiCoinsLine />Record payment</DropdownItem>
      <DropdownItem onSelect={() => select("lost")}><RiCloseLine />Mark as Lost</DropdownItem>
      <DropdownItem onSelect={() => select("clone")}><RiFileCopyLine />Clone opportunity</DropdownItem>
      <DropdownDivider />
      <DropdownItem className="text-text-error-primary" onSelect={() => select("delete")}><RiDeleteBinLine />Delete opportunity</DropdownItem>
    </DropdownPopover>
  </Dropdown>;
}
