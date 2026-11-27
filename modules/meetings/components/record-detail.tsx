"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RiAddLine, RiArrowRightUpLine, RiCalendarLine, RiCheckboxCircleLine, RiCheckLine, RiCloseCircleLine, RiEyeLine, RiFileTextLine, RiMore2Fill, RiTimeLine, RiUserSharedLine } from "@remixicon/react";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button, ButtonLink } from "@/components/base/buttons/button";
import { Chip } from "@/components/base/badges/chip";
import { Dropdown, DropdownDivider, DropdownItem, DropdownPopover, DropdownTrigger } from "@/components/base/dropdown/dropdown";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/base/modal/modal";
import { portraitFor } from "@/modules/users-roles/portrait";
import { canManageRecord, canViewRecord, displayTime, followUpStatus, meetingReschedulable } from "../records";
import type { AuditEvent, MeetingProfile, MeetingsState } from "../types";
import { ActionForm, FollowUpForm, MinutesForm, minuteFields, type ActionMode } from "./meeting-forms";
import { MeetingPlatformLogo } from "./meeting-platform";

export function StatusBadge({ status }: { status: string }) {
  return <Chip variant="caption" color={status === "Overdue" ? "rose" : ["Completed", "MOM submitted"].includes(status) ? "lime" : ["Cancelled", "Postponed"].includes(status) ? "gray" : status === "Awaiting MOM" || status === "Pending sync" ? "yellow" : "blue"}>{status}</Chip>;
}
export function AuditHistory({ events }: { events: AuditEvent[] }) {
  return <section className="flex flex-col gap-3"><h3 className="text-headline-medium text-text-primary">Activity history</h3><ol className="flex flex-col divide-y divide-separator-border">{[...events].sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).map(event => <li key={event.id} className="flex flex-col gap-1 py-3"><p className="text-body-medium text-text-primary">{event.action}</p><p className="whitespace-pre-wrap text-body-2-regular text-text-secondary">{event.detail}</p><p className="text-caption-1-regular text-text-tertiary">{event.actor} · {displayTime(event.at)} IST</p></li>)}</ol>{!events.length && <p className="text-body-2-regular text-text-secondary">No changes recorded yet.</p>}</section>;
}

function initials(name: string) {
  return name.trim().split(/\s+/).map(part => part[0]).slice(0, 2).join("").toUpperCase();
}

export function EntityDetail({ kind, id, state, profile, now, onClose, initialMode = null }: { kind: "meeting" | "follow-up"; id: string; state: MeetingsState; profile: MeetingProfile; now: number; onClose: () => void; initialMode?: ActionMode | "minutes" | "follow-up" | null }) {
  const router = useRouter();
  const meeting = kind === "meeting" ? state.meetings.find(item => item.id === id) : undefined;
  const followUp = kind === "follow-up" ? state.followUps.find(item => item.id === id) : undefined;
  const item = meeting ?? followUp;
  const record = state.records.find(row => row.id === item?.recordId);
  const [mode, setMode] = useState<ActionMode | "minutes" | "follow-up" | null>(initialMode);
  const [minutesVersion, setMinutesVersion] = useState<number | null>(null);
  const [actionsOpen, setActionsOpen] = useState(false);
  if (!item || !canViewRecord(profile, record)) return null;
  const manage = canManageRecord(profile, record);
  const minutes = meeting?.minutes.find(entry => entry.version === minutesVersion) ?? meeting?.minutes.at(-1);
  const actionable = meeting ? meetingReschedulable(meeting) : followUp?.status === "Pending";
  const customerHref = `/library/modules/leads?view=${encodeURIComponent(record?.category ?? "Franchise")}&enquiry=${encodeURIComponent(item.recordId)}`;
  const selectAction = (action: () => void) => () => { setActionsOpen(false); action(); };
  if (mode === "follow-up" && meeting && manage) return <FollowUpForm state={state} profile={profile} record={record} source={{ id: meeting.id, recordId: meeting.recordId, title: meeting.title, type: "Meeting", when: displayTime(meeting.startAt) }} onClose={() => setMode(null)} />;
  if (mode === "minutes" && meeting && manage) return <MinutesForm meeting={meeting} profile={profile} onClose={() => setMode(null)} />;
  if (mode && mode !== "minutes" && mode !== "follow-up" && manage) return <ActionForm item={item} kind={kind} mode={mode} state={state} profile={profile} onClose={() => setMode(null)} />;
  return <Modal isOpen onOpenChange={open => { if (!open) onClose(); }} size="lg" overlayClassName="mf-meeting-detail-overlay" className="mf-meeting-detail-panel">
    <ModalHeader title={item.title} className="mf-meeting-detail-header" />
    <ModalBody><div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar size="lg" src={record ? portraitFor(record.name) : undefined} initials={initials(record?.name ?? "")} alt="" />
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-body-medium text-text-primary">{record?.name}</p>
            <p className="text-body-2-regular text-text-secondary">{item.id} · {record?.brand}</p>
          </div>
          <StatusBadge status={followUp ? followUpStatus(followUp, now) : meeting!.status} />
        </div>
        <div className="flex items-center gap-2">
          {meeting && <ButtonLink size="small" variant="secondary" href={meeting.meetLink || undefined} target={meeting.meetLink ? "_blank" : undefined} rel={meeting.meetLink ? "noreferrer" : undefined} aria-disabled={!meeting.meetLink} className={!meeting.meetLink ? "pointer-events-none opacity-50" : undefined}>
            <MeetingPlatformLogo platform={meeting.platform ?? "Google Meet"} className="size-5 shrink-0" /><span className="ms-1">Join {meeting.platform ?? "meeting"}</span>
          </ButtonLink>}
          <Dropdown isOpen={actionsOpen} onOpenChange={setActionsOpen}>
            <DropdownTrigger aria-label="Meeting actions" className="inline-flex size-8 items-center justify-center rounded-lg border border-border-button-default bg-background-primary-default text-foreground-icon-primary hover:bg-background-primary-hover focus-visible:ring-2 focus-visible:ring-border-focus-ring">
              <RiMore2Fill className="size-5" aria-hidden="true" />
            </DropdownTrigger>
            <DropdownPopover aria-label="Meeting actions" placement="bottom end">
              <DropdownItem onSelect={selectAction(() => router.push(customerHref))}><RiArrowRightUpLine className="size-4" aria-hidden="true" />Customer details</DropdownItem>
              {manage && <>
                <DropdownDivider />
                {actionable && <>
                  <DropdownItem onSelect={selectAction(() => setMode("reschedule"))}><RiCalendarLine className="size-4" aria-hidden="true" />Reschedule</DropdownItem>
                  {meeting && <DropdownItem onSelect={selectAction(() => setMode("postpone"))}><RiTimeLine className="size-4" aria-hidden="true" />Postpone</DropdownItem>}
                  {followUp && <>
                    <DropdownItem onSelect={selectAction(() => setMode("reassign"))}><RiUserSharedLine className="size-4" aria-hidden="true" />Reassign</DropdownItem>
                    <DropdownItem onSelect={selectAction(() => setMode("complete"))}><RiCheckboxCircleLine className="size-4" aria-hidden="true" />Complete follow-up</DropdownItem>
                  </>}
                  {meeting && <>
                    {Date.parse(meeting.startAt) <= now && <DropdownItem onSelect={selectAction(() => setMode("outcome"))}><RiCheckLine className="size-4" aria-hidden="true" />Record outcome</DropdownItem>}
                    <DropdownItem onSelect={selectAction(() => setMode("cancel"))}><RiCloseCircleLine className="size-4" aria-hidden="true" />Cancel meeting</DropdownItem>
                  </>}
                  {followUp && <DropdownItem onSelect={selectAction(() => setMode("cancel"))}><RiCloseCircleLine className="size-4" aria-hidden="true" />Cancel follow-up</DropdownItem>}
                </>}
                {meeting && <DropdownItem onSelect={selectAction(() => setMode("follow-up"))}><RiAddLine className="size-4" aria-hidden="true" />Create follow-up</DropdownItem>}
                {meeting && ["Awaiting MOM", "MOM submitted"].includes(meeting.status) && <DropdownItem onSelect={selectAction(() => setMode("minutes"))}><RiFileTextLine className="size-4" aria-hidden="true" />{meeting.minutes.length ? "Correct minutes" : "Submit minutes"}</DropdownItem>}
                {meeting?.minutes.length && !meeting.minutes.at(-1)?.review && profile.scope !== "own" ? <DropdownItem onSelect={selectAction(() => setMode("review"))}><RiEyeLine className="size-4" aria-hidden="true" />Review minutes</DropdownItem> : null}
              </>}
            </DropdownPopover>
          </Dropdown>
        </div>
      </div>
      <dl className="mf-meeting-detail-facts grid gap-4 sm:grid-cols-2">
        <div><dt className="text-caption-1-regular text-text-secondary">{meeting ? "Meeting time" : "Due date & time"}</dt><dd className="text-body-medium text-text-primary">{displayTime(meeting?.startAt ?? followUp!.dueAt)} IST</dd></div>
        <div><dt className="text-caption-1-regular text-text-secondary">Assigned employee</dt><dd className="mt-1 flex items-center gap-2 text-body-medium text-text-primary"><Avatar size="sm" src={portraitFor(item.assignedTo)} initials={initials(item.assignedTo)} alt="" />{item.assignedTo}</dd></div>
        <div><dt className="text-caption-1-regular text-text-secondary">Linked record</dt><dd className="text-body-medium text-text-primary">{followUp?.linkType ?? "Opportunity"} · {meeting?.opportunityId ?? (followUp?.linkType === "Opportunity" ? record?.opportunityId : item.recordId)}</dd></div>
        <div><dt className="text-caption-1-regular text-text-secondary">{meeting ? "Category & duration" : "Priority"}</dt><dd className="text-body-medium text-text-primary">{meeting ? `${meeting.category} · ${meeting.duration} minutes` : followUp?.priority}</dd></div>
      </dl>
      {followUp && <><section className="flex flex-col gap-2"><h3 className="text-headline-medium text-text-primary">Description</h3><p className="whitespace-pre-wrap text-body-regular text-text-secondary">{followUp.description}</p></section>{followUp.source && <section className="rounded-xl border border-separator-border p-4"><h3 className="text-body-medium text-text-primary">Created from activity</h3><p className="text-body-2-regular text-text-secondary">{followUp.source.title} · {followUp.source.type}<br />{followUp.source.when} · {followUp.source.id}</p></section>}</>}
      {meeting && <>
        <section className="mf-meeting-detail-section flex flex-col gap-3">
          <h3 className="text-headline-medium text-text-primary">Meeting details</h3>
          <p className="whitespace-pre-wrap text-body-regular text-text-secondary">{meeting.agenda}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <p className="text-body-2-regular text-text-secondary"><span className="text-text-primary">Participants</span><br />{meeting.participants.join(", ")}</p>
            <p className="text-body-2-regular text-text-secondary"><span className="text-text-primary">Customer</span><br />{record?.name}{meeting.customerEmail && ` · ${meeting.customerEmail}`}</p>
            {meeting.category === "Brand meeting" && <p className="text-body-2-regular text-text-secondary"><span className="text-text-primary">Brand representative</span><br />{meeting.brandRepresentative} · {meeting.brandEmail}</p>}
            {meeting.format === "In person" ? <p className="text-body-2-regular text-text-secondary"><span className="text-text-primary">Location</span><br />{meeting.location} · {meeting.address}</p> : <p className="text-body-2-regular text-text-secondary"><span className="text-text-primary">Format</span><br />Virtual · {meeting.platform ?? "Google Meet"}{!meeting.meetLink ? " connection required" : ""}</p>}
          </div>
          {meeting.remarks && <p className="text-body-2-regular text-text-secondary"><span className="text-text-primary">Remarks</span><br />{meeting.remarks}</p>}
          <p className="mf-meeting-detail-note text-caption-1-regular text-text-tertiary">Calendar: not connected · Invitations: not sent. Reminders in this review are in-app only while the CRM is open.</p>
        </section>
      </>}
      {item.outcome && <section className="flex flex-col gap-2"><h3 className="text-headline-medium text-text-primary">Recorded outcome</h3><p className="whitespace-pre-wrap text-body-regular text-text-secondary">{item.outcome}</p></section>}
      {minutes && meeting && <section className="mf-meeting-detail-section flex flex-col gap-4"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-headline-medium text-text-primary">Minutes of meeting</h3><div className="flex flex-wrap gap-2">{meeting.minutes.map(entry => <Button key={entry.version} size="small" variant={minutes.version === entry.version ? "primary" : "secondary"} onClick={() => setMinutesVersion(entry.version)}>Version {entry.version}</Button>)}</div></div><p className="text-caption-1-regular text-text-secondary">{minutes.author} · {displayTime(minutes.at)} IST</p>{minuteFields.map(field => <div key={field.key}><h4 className="text-body-medium text-text-primary">{field.label}</h4><p className="whitespace-pre-wrap text-body-2-regular text-text-secondary">{minutes[field.key]}</p></div>)}<p className="text-body-2-regular text-text-secondary">Interest: {minutes.interest}</p>{minutes.nextFollowUpAt && <p className="text-body-2-regular text-text-secondary">Next follow-up: {displayTime(minutes.nextFollowUpAt)} IST</p>}{minutes.remarks && <p className="text-body-2-regular text-text-secondary">Remarks: {minutes.remarks}</p>}{minutes.review ? <p className="mf-meeting-detail-note text-body-2-regular text-text-secondary">Reviewed by {minutes.review.author} · {displayTime(minutes.review.at)} IST<br />{minutes.review.comment}</p> : <p className="text-caption-1-regular text-text-secondary">Awaiting manager review</p>}</section>}
    </div></ModalBody>
    <ModalFooter className="mf-meeting-detail-footer"><Button variant="secondary" onClick={onClose}>Close</Button></ModalFooter>
  </Modal>;
}
