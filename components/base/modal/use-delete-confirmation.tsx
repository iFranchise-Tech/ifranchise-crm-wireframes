"use client";

import { useState } from "react";
import { RiDeleteBinLine } from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/base/modal/modal";

type PendingDelete = { label: string; onConfirm: () => void };

export function useDeleteConfirmation() {
  const [pending, setPending] = useState<PendingDelete | null>(null);
  const requestDelete = (label: string, onConfirm: () => void) => setPending({ label, onConfirm });
  const confirmationDialog = <Modal isOpen={!!pending} onOpenChange={open => { if (!open) setPending(null); }} size="sm">
    {pending && <>
      <ModalHeader title={`Delete ${pending.label}?`} description="This action can’t be undone." icon={RiDeleteBinLine} />
      <ModalBody><p className="py-4 text-body-2-regular text-text-secondary">Are you sure you want to delete this item?</p></ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={() => setPending(null)}>Cancel</Button>
        <Button variant="danger" leadingIcon={RiDeleteBinLine} onClick={() => { pending.onConfirm(); setPending(null); }}>Delete</Button>
      </ModalFooter>
    </>}
  </Modal>;
  return { requestDelete, confirmationDialog };
}
