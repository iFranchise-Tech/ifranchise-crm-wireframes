"use client";

import { useState } from "react";
import { RiAddLine, RiArrowRightUpLine, RiCalendarLine, RiCheckLine, RiEditLine } from "@remixicon/react";
import { Button, ButtonLink } from "@/components/base/buttons/button";
import { Chip } from "@/components/base/badges/chip";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/base/modal/modal";
import { canManageRecord, canViewRecord, displayTime, followUpStatus, meetingReschedulable } from "../records";
import type { AuditEvent, MeetingProfile, MeetingsState } from "../types";
import { ActionForm, FollowUpForm, MinutesForm, minuteFields, type ActionMode } from "./meeting-forms";

export function StatusBadge({ status }: { status: string }) {
  return <Chip variant="caption" color={status === "Overdue" ? "rose" : ["Completed", "MOM submitted"].includes(status) ? "lime" : ["Cancelled", "Postponed"].includes(status) ? "gray" : status === "Awaiting MOM" || status === "Pending sync" ? "yellow" : "blue"}>{status}</Chip>;
}
export function AuditHistory({ events }: { events: AuditEvent[] }) {
  return <section className="flex flex-col gap-3"><h3 className="text-headline-medium text-text-primary">Activity history</h3><ol className="flex flex-col divide-y divide-separator-border">{[...events].sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).map(event => <li key={event.id} className="flex flex-col gap-1 py-3"><p className="text-body-medium text-text-primary">{event.action}</p><p className="whitespace-pre-wrap text-body-2-regular text-text-secondary">{event.detail}</p><p className="text-caption-1-regular text-text-tertiary">{event.actor} · {displayTime(event.at)} IST</p></li>)}</ol>{!events.length && <p className="text-body-2-regular text-text-secondary">No changes recorded yet.</p>}</section>;
}
export function EntityDetail({ kind, id, state, profile, now, onClose }: { kind: "meeting" | "follow-up"; id: string; state: MeetingsState; profile: MeetingProfile; now: number; onClose: () => void }) {
  const meeting = kind === "meeting" ? state.meetings.find(item => item.id === id) : undefined;
  const followUp = kind === "follow-up" ? state.followUps.find(item => item.id === id) : undefined;
  const item = meeting ?? followUp;
  const record = state.records.find(row => row.id === item?.recordId);
  const [mode, setMode] = useState<ActionMode | "minutes" | "follow-up" | null>(null);
  const [minutesVersion, setMinutesVersion] = useState<number | null>(null);
  if (!item || !canViewRecord(profile, record)) return null;
  const manage = canManageRecord(profile, record);
  const minutes = meeting?.minutes.find(entry => entry.version === minutesVersion) ?? meeting?.minutes.at(-1);
  const actionable = meeting ? meetingReschedulable(meeting) : followUp?.status === "Pending";
  if (mode === "follow-up" && meeting && manage) return <FollowUpForm state={state} profile={profile} record={record} source={{ id: meeting.id, recordId: meeting.recordId, title: meeting.title, type: "Meeting", when: displayTime(meeting.startAt) }} onClose={() => setMode(null)} />;
  if (mode === "minutes" && meeting && manage) return <MinutesForm meeting={meeting} profile={profile} onClose={() => setMode(null)} />;
  if (mode && mode !== "minutes" && mode !== "follow-up" && manage) return <ActionForm item={item} kind={kind} mode={mode} state={state} profile={profile} onClose={() => setMode(null)} />;
  return <Modal isOpen onOpenChange={open => { if (!open) onClose(); }} size="xl">
    <ModalHeader title={item.title} description={`${item.id} · ${record?.name} · ${record?.brand}`} />
    <ModalBody><div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><StatusBadge status={followUp ? followUpStatus(followUp, now) : meeting!.status} /><ButtonLink size="small" variant="secondary" trailingIcon={RiArrowRightUpLine} href={`/library/modules/leads?view=${encodeURIComponent(record?.category ?? "Franchise")}&enquiry=${encodeURIComponent(item.recordId)}`}>Customer details</ButtonLink></div>
      <dl className="grid gap-4 rounded-xl border border-separator-border bg-background-secondary-default p-4 sm:grid-cols-2">
        <div><dt className="text-caption-1-regular text-text-secondary">{meeting ? "Meeting time" : "Due date & time"}</dt><dd className="text-body-medium text-text-primary">{displayTime(meeting?.startAt ?? followUp!.dueAt)} IST</dd></div>
        <div><dt className="text-caption-1-regular text-text-secondary">Assigned employee</dt><dd className="text-body-medium text-text-primary">{item.assignedTo}</dd></div>
        <div><dt className="text-caption-1-regular text-text-secondary">Linked record</dt><dd className="text-body-medium text-text-primary">{followUp?.linkType ?? "Opportunity"} · {meeting?.opportunityId ?? (followUp?.linkType === "Opportunity" ? record?.opportunityId : item.recordId)}</dd></div>
        <div><dt className="text-caption-1-regular text-text-secondary">{meeting ? "Category & duration" : "Priority"}</dt><dd className="text-body-medium text-text-primary">{meeting ? `${meeting.category} · ${meeting.duration} minutes` : followUp?.priority}</dd></div>
      </dl>
      {followUp && <><section className="flex flex-col gap-2"><h3 className="text-headline-medium text-text-primary">Description</h3><p className="whitespace-pre-wrap text-body-regular text-text-secondary">{followUp.description}</p></section>{followUp.source && <section className="rounded-xl border border-separator-border p-4"><h3 className="text-body-medium text-text-primary">Created from activity</h3><p className="text-body-2-regular text-text-secondary">{followUp.source.title} · {followUp.source.type}<br />{followUp.source.when} · {followUp.source.id}</p></section>}</>}
      {meeting && <>
        <section className="flex flex-col gap-2"><h3 className="text-headline-medium text-text-primary">Meeting details</h3><p className="whitespace-pre-wrap text-body-regular text-text-secondary">{meeting.agenda}</p><p className="text-body-2-regular text-text-secondary">Participants: {meeting.participants.join(", ")}</p><p className="text-body-2-regular text-text-secondary">Customer: {record?.name} {meeting.customerEmail && `· ${meeting.customerEmail}`}</p>{meeting.category === "Brand meeting" && <p className="text-body-2-regular text-text-secondary">Brand representative: {meeting.brandRepresentative} · {meeting.brandEmail}</p>}{meeting.format === "In person" ? <p className="text-body-2-regular text-text-primary">In person · {meeting.location}<br />{meeting.address}</p> : meeting.meetLink ? <ButtonLink variant="secondary" size="small" className="self-start" href={meeting.meetLink} target="_blank" rel="noreferrer">Open Google Meet</ButtonLink> : <p className="text-body-2-regular text-text-secondary">Virtual · Meet link pending Calendar connection</p>}{meeting.remarks && <p className="text-body-2-regular text-text-secondary">Remarks: {meeting.remarks}</p>}</section>
        <p className="rounded-xl bg-background-secondary-default p-3 text-body-2-regular text-text-secondary">Calendar: not connected · Invitations: not sent. Reminders in this review are in-app only while the CRM is open.</p>
      </>}
      {item.outcome && <section className="flex flex-col gap-2"><h3 className="text-headline-medium text-text-primary">Recorded outcome</h3><p className="whitespace-pre-wrap text-body-regular text-text-secondary">{item.outcome}</p></section>}
      {manage && <div className="flex flex-wrap gap-2" aria-label="Record actions">
        {actionable && <><Button variant="secondary" size="small" leadingIcon={RiCalendarLine} onClick={() => setMode("reschedule")}>Reschedule</Button>{followUp && <><Button variant="secondary" size="small" onClick={() => setMode("reassign")}>Reassign</Button><Button size="small" leadingIcon={RiCheckLine} onClick={() => setMode("complete")}>Complete follow-up</Button></>}{meeting && <><Button variant="secondary" size="small" onClick={() => setMode("postpone")}>Postpone</Button><Button size="small" disabled={Date.parse(meeting.startAt) > now} onClick={() => setMode("outcome")}>Record outcome</Button></>}<Button variant="secondary" size="small" onClick={() => setMode("cancel")}>Cancel {kind}</Button></>}
        {meeting && <Button variant="secondary" size="small" leadingIcon={RiAddLine} onClick={() => setMode("follow-up")}>Create follow-up</Button>}
        {meeting && ["Awaiting MOM", "MOM submitted"].includes(meeting.status) && <Button size="small" leadingIcon={RiEditLine} onClick={() => setMode("minutes")}>{meeting.minutes.length ? "Correct minutes" : "Submit minutes"}</Button>}
        {meeting?.minutes.length && !meeting.minutes.at(-1)?.review && profile.scope !== "own" ? <Button variant="secondary" size="small" onClick={() => setMode("review")}>Review minutes</Button> : null}
      </div>}
      {minutes && meeting && <section className="flex flex-col gap-4 rounded-xl border border-separator-border p-4"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-headline-medium text-text-primary">Minutes of meeting</h3><div className="flex flex-wrap gap-2">{meeting.minutes.map(entry => <Button key={entry.version} size="small" variant={minutes.version === entry.version ? "primary" : "secondary"} onClick={() => setMinutesVersion(entry.version)}>Version {entry.version}</Button>)}</div></div><p className="text-caption-1-regular text-text-secondary">{minutes.author} · {displayTime(minutes.at)} IST</p>{minuteFields.map(field => <div key={field.key}><h4 className="text-body-medium text-text-primary">{field.label}</h4><p className="whitespace-pre-wrap text-body-2-regular text-text-secondary">{minutes[field.key]}</p></div>)}<p className="text-body-2-regular text-text-secondary">Interest: {minutes.interest}</p>{minutes.nextFollowUpAt && <p className="text-body-2-regular text-text-secondary">Next follow-up: {displayTime(minutes.nextFollowUpAt)} IST</p>}{minutes.remarks && <p className="text-body-2-regular text-text-secondary">Remarks: {minutes.remarks}</p>}{minutes.review ? <p className="rounded-xl bg-background-secondary-default p-3 text-body-2-regular text-text-secondary">Reviewed by {minutes.review.author} · {displayTime(minutes.review.at)} IST<br />{minutes.review.comment}</p> : <p className="text-caption-1-regular text-text-secondary">Awaiting manager review</p>}</section>}
      <AuditHistory events={item.history} />
    </div></ModalBody>
    <ModalFooter><Button variant="secondary" onClick={onClose}>Close</Button></ModalFooter>
  </Modal>;
}
