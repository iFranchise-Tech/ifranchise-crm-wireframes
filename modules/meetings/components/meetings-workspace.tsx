"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RiAddLine, RiArchiveLine, RiArrowDownSLine, RiArrowLeftSLine, RiArrowRightSLine, RiArrowRightUpLine, RiBarChartBoxLine, RiCalendarLine, RiCheckLine, RiCheckboxCircleLine, RiCloseCircleLine, RiDeleteBinLine, RiEyeLine, RiFilter3Line, RiInboxUnarchiveLine, RiLayoutColumnLine, RiListUnordered, RiMailLine, RiMailUnreadLine, RiMore2Fill, RiNotification3Line, RiSettings3Line, RiStarFill, RiStarLine, RiTimeLine, RiUserSharedLine } from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { useDeleteConfirmation } from "@/components/base/modal/use-delete-confirmation";
import { IconButton } from "@/components/base/buttons/icon-button";
import { Avatar } from "@/components/base/avatar/avatar";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { SearchField } from "@/components/base/search-field/search-field";
import { Select, SelectItem } from "@/components/base/select/select";
import { Input } from "@/components/base/input/input";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@/components/base/table/table";
import { Dropdown, DropdownItem, DropdownPopover, DropdownTrigger } from "@/components/base/dropdown/dropdown";
import { DirectionProvider } from "@/components/foundations/direction/direction";
import { ScrollFade, useScrollFade } from "@/components/foundations/scroll-fade/scroll-fade";
import { ReviewShell } from "@/modules/screen-library/components/review-shell";
import { ColumnManagerModal } from "@/modules/screen-library/components/column-manager-modal";
import { readTableColumns, saveActiveCrmRole, savePersonalTableColumns } from "@/modules/screen-library/lib/table-columns";
import { AdvancedLeadFilters, type LeadAdvancedFilters, type LeadFilterField } from "@/modules/leads/components/advanced-lead-filters";
import { cx } from "@/utils/cx";
import { canManageRecord, canViewRecord, displayTime, followUpStatus, istParts, meetingProfiles, reminderIsCurrent, updateReminderSettings } from "../records";
import { updateMeetings, useMeetingProfile, useMeetings } from "../store";
import type { FollowUp, Meeting, MeetingProfile, MeetingsState, ReminderPolicy } from "../types";
import { FollowUpForm, MeetingForm, fieldClass, type ActionMode } from "./meeting-forms";
import { AuditHistory, EntityDetail, StatusBadge } from "./record-detail";
import { MeetingPlatformLogo } from "./meeting-platform";
import { portraitFor } from "@/modules/users-roles/portrait";
import "@/modules/leads/components/leads.css";
import "./meetings.css";

type View = "Meetings" | "Follow-ups" | "Notifications" | "Reminder settings";
const baseColumns = [{ id: "title", name: "Activity" }, { id: "customer", name: "Customer / enquiry" }, { id: "brand", name: "Brand" }, { id: "owner", name: "Assigned to" }, { id: "due", name: "Date & time (IST)" }, { id: "status", name: "Status" }];
const statusOptions = ["Pending sync", "Scheduled", "Rescheduled", "Awaiting MOM", "MOM submitted", "Postponed", "Customer did not attend", "Internal participant did not attend", "Cancelled"];
export function MeetingsWorkspace() {
  const { requestDelete, confirmationDialog } = useDeleteConfirmation();
  const router = useRouter();
  const { state, now, error, ready } = useMeetings(); const [profile, setProfile] = useMeetingProfile();
  const [view, setView] = useState<View>("Meetings"); const [overview, setOverview] = useState(false);
  const [sectionsOpen, setSectionsOpen] = useState(true);
  const [meetingDisplay, setMeetingDisplay] = useState<"calendar" | "list">("calendar");
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(2000, 0, 1));
  const [notificationFilter, setNotificationFilter] = useState<NotificationFilter>("All");
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null);
  const [query, setQuery] = useState(""); const [status, setStatus] = useState("all"); const [owner, setOwner] = useState("all"); const [category, setCategory] = useState("all");
  const [advanced, setAdvanced] = useState(false); const [filters, setFilters] = useState<LeadAdvancedFilters | null>(null); const [columnsOpen, setColumnsOpen] = useState(false);
  const [columnIds, setColumnIds] = useState(baseColumns.map(column => column.id)); const [page, setPage] = useState(1);
  const [create, setCreate] = useState<"meeting" | "follow-up" | null>(null); const [meetingInitialDate, setMeetingInitialDate] = useState(""); const [detail, setDetail] = useState<{ kind: "meeting" | "follow-up"; id: string; action?: ActionMode | "minutes" | "follow-up" } | null>(null);
  const [openMeetingMenuId, setOpenMeetingMenuId] = useState<string | null>(null);
  const [notice, setNotice] = useState(""); const fade = useScrollFade();
  const follow = view === "Follow-ups"; const listView = follow || (view === "Meetings" && meetingDisplay === "list"); const activityView = follow || view === "Meetings";
  const columns = [...baseColumns.map(column => column.id === "title" ? { ...column, name: follow ? "Follow-up" : "Meeting" } : column), { id: "category", name: follow ? "Priority" : "Category" }, { id: "source", name: follow ? "Source activity" : "Format" }];
  const scope = follow ? "follow-ups" : "meetings";
  useEffect(() => { setColumnIds(readTableColumns(scope, profile.id, columns, ["title"], [...baseColumns.filter(item => item.id !== "brand").map(item => item.id), "category"])); }, [scope, profile.id]); // Column definitions are stable by scope.
  useEffect(() => { if (ready && now > 0 && calendarMonth.getFullYear() === 2000) { const date = new Date(now); setCalendarMonth(new Date(date.getFullYear(), date.getMonth(), 1)); } }, [ready, now, calendarMonth]);
  useEffect(() => { setPage(1); }, [query, status, owner, category, filters, view, profile.id]);
  const recordFor = (id: string) => state.records.find(record => record.id === id);
  const scopedRecords = state.records.filter(record => canViewRecord(profile, record));
  const entries: (Meeting | FollowUp)[] = (follow ? state.followUps : state.meetings).filter(item => canViewRecord(profile, recordFor(item.recordId)));
  const statusFor = (item: Meeting | FollowUp) => "dueAt" in item ? followUpStatus(item, now) : item.status;
  const dateFor = (item: Meeting | FollowUp) => "dueAt" in item ? item.dueAt : item.startAt;
  const valueFor = (item: Meeting | FollowUp, field: string) => {
    const record = recordFor(item.recordId);
    return field === "title" ? item.title : field === "id" ? item.id : field === "customer" ? record?.name ?? "" : field === "brand" ? record?.brand ?? "" : field === "owner" ? item.assignedTo : field === "due" ? istParts(dateFor(item)).date : field === "status" ? statusFor(item) : field === "category" ? "priority" in item ? item.priority : item.category : field === "source" ? "source" in item ? item.source?.type ?? "Direct follow-up" : "format" in item ? item.format : "Direct follow-up" : "";
  };
  const matches = (item: Meeting | FollowUp, applied: LeadAdvancedFilters | null) => !applied || applied.rules.every(rule => {
    if (!rule.value && !["is empty", "is not empty"].includes(rule.operator)) return true;
    const actual = valueFor(item, rule.field).toLowerCase().trim(), value = rule.value.toLowerCase().trim();
    return rule.operator === "is empty" ? !actual : rule.operator === "is not empty" ? !!actual : rule.operator === "is not" ? actual !== value : rule.operator === "starts with" ? actual.startsWith(value) : rule.operator === "before" ? actual < value : rule.operator === "after" ? actual > value : actual === value;
  });
  const basic = entries.filter(item => [item.title, item.id, recordFor(item.recordId)?.name, item.recordId].join(" ").toLowerCase().includes(query.trim().toLowerCase()) && (status === "all" || statusFor(item) === status) && (owner === "all" || item.assignedTo === owner) && (category === "all" || valueFor(item, "category") === category));
  const filtered = basic.filter(item => matches(item, filters)).sort((a, b) => Date.parse(dateFor(a)) - Date.parse(dateFor(b)));
  const lastPage = Math.max(1, Math.ceil(filtered.length / 10)); const currentPage = Math.min(page, lastPage); const rows = filtered.slice((currentPage - 1) * 10, currentPage * 10);
  const fields: LeadFilterField[] = [{ id: "title", name: follow ? "Follow-up title" : "Meeting title", type: "text" }, { id: "id", name: follow ? "Follow-up ID" : "Meeting ID", type: "text", placeholder: `Enter a ${follow ? "follow-up" : "meeting"} ID` }, { id: "customer", name: "Customer", type: "select", options: scopedRecords.map(item => item.name) }, { id: "brand", name: "Brand", type: "select", options: [...new Set(scopedRecords.map(item => item.brand))] }, { id: "owner", name: "Assigned employee", type: "select", options: [...new Set(entries.map(item => item.assignedTo))] }, { id: "status", name: "Status", type: "select", options: follow ? ["Pending", "Completed", "Overdue", "Cancelled"] : statusOptions }, { id: "due", name: follow ? "Due date" : "Meeting date", type: "date", placeholder: follow ? "Select a due date" : "Select a meeting date" }];
  const notifications = state.notifications.filter(item => !item.deletedBy?.includes(profile.id) && canViewRecord(profile, recordFor(item.recordId)) && reminderIsCurrent(state, item.id)).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const inboxNotifications = notifications.filter(item => !item.archivedBy?.includes(profile.id));
  const unread = inboxNotifications.filter(item => !item.readBy.includes(profile.id)).length;
  const visibleColumns = columnIds.map(id => columns.find(column => column.id === id)).filter((column): column is typeof columns[number] => !!column);
  function changeView(next: View) { setView(next); setQuery(""); setStatus("all"); setOwner("all"); setCategory("all"); setFilters(null); setAdvanced(false); setOverview(false); setNotice(""); }
  function focusNotifications() { changeView("Notifications"); }
  const summaries = follow ? ["Pending", "Overdue", "Completed", "Cancelled"].map(label => ({ label, value: filtered.filter(item => statusFor(item) === label).length })) : [
    { label: "Meetings today", value: filtered.filter(item => istParts(dateFor(item)).date === istParts(now).date).length },
    { label: "Upcoming", value: filtered.filter(item => Date.parse(dateFor(item)) > now && !["Cancelled", "Postponed"].includes(item.status)).length },
    { label: "Awaiting minutes", value: filtered.filter(item => item.status === "Awaiting MOM").length },
    { label: "Conducted", value: filtered.filter(item => ["MOM submitted", "Awaiting MOM"].includes(item.status)).length },
    { label: "Rescheduled", value: filtered.filter(item => item.history.some(event => event.action === "Meeting rescheduled")).length },
    { label: "Cancelled", value: filtered.filter(item => item.status === "Cancelled").length },
  ];
  function markRead(id?: string) { try { updateMeetings(current => ({ ...current, notifications: current.notifications.map(item => (!id || item.id === id) && !item.deletedBy?.includes(profile.id) && (id || !item.archivedBy?.includes(profile.id)) && canViewRecord(profile, current.records.find(record => record.id === item.recordId)) ? { ...item, readBy: [...new Set([...item.readBy, profile.id])] } : item) })); } catch (failure) { setNotice((failure as Error).message); } }
  function markNotificationsRead(ids: string[]) { try { const selectedIds = new Set(ids); updateMeetings(current => ({ ...current, notifications: current.notifications.map(item => selectedIds.has(item.id) ? { ...item, readBy: [...new Set([...item.readBy, profile.id])] } : item) })); } catch (failure) { setNotice((failure as Error).message); } }
  function setNotificationRead(id: string, isRead: boolean) { try { updateMeetings(current => ({ ...current, notifications: current.notifications.map(item => item.id === id ? { ...item, readBy: isRead ? [...new Set([...item.readBy, profile.id])] : item.readBy.filter(userId => userId !== profile.id) } : item) })); } catch (failure) { setNotice((failure as Error).message); } }
  function updateNotification(id: string, action: "archive" | "restore" | "delete" | "star") { if (action === "delete") { const item = state.notifications.find(notification => notification.id === id); if (item) requestDelete("notification", () => { try { updateMeetings(current => ({ ...current, notifications: current.notifications.map(entry => entry.id === id ? { ...entry, deletedBy: [...new Set([...(entry.deletedBy ?? []), profile.id])] } : entry) })); setSelectedNotificationId(null); } catch (failure) { setNotice((failure as Error).message); } }); return; } try { updateMeetings(current => ({ ...current, notifications: current.notifications.map(item => {
    if (item.id !== id) return item;
    if (action === "archive") return { ...item, archivedBy: [...new Set([...(item.archivedBy ?? []), profile.id])] };
    if (action === "star") return { ...item, starredBy: item.starredBy?.includes(profile.id) ? item.starredBy.filter(userId => userId !== profile.id) : [...new Set([...(item.starredBy ?? []), profile.id])] };
    return { ...item, archivedBy: (item.archivedBy ?? []).filter(userId => userId !== profile.id) };
  }) })); if (action !== "star") setSelectedNotificationId(null); } catch (failure) { setNotice((failure as Error).message); } }
  function deleteNotifications(ids: string[]) { if (!ids.length) return; requestDelete(ids.length === 1 ? "notification" : `${ids.length} notifications`, () => { try { const selectedIds = new Set(ids); updateMeetings(current => ({ ...current, notifications: current.notifications.map(item => selectedIds.has(item.id) ? { ...item, deletedBy: [...new Set([...(item.deletedBy ?? []), profile.id])] } : item) })); setSelectedNotificationId(null); } catch (failure) { setNotice((failure as Error).message); } }); }
  const visibleNotifications = notifications.filter(item => {
    const archived = item.archivedBy?.includes(profile.id) ?? false;
    if (notificationFilter === "Archived") return archived;
    if (archived) return false;
    if (notificationFilter === "Favorites") return item.starredBy?.includes(profile.id) ?? false;
    return notificationFilter === "All" || (notificationFilter === "Unread" ? !item.readBy.includes(profile.id) : notificationFilter === "Meetings" ? item.kind === "meeting" : item.kind === "follow-up");
  });
  const selectedNotification = visibleNotifications.find(item => item.id === selectedNotificationId) ?? visibleNotifications[0] ?? null;
  const navItems = [{ name: "Meetings", icon: RiCalendarLine }, { name: "Follow-ups", icon: RiTimeLine }, { name: "Notifications", icon: RiNotification3Line }, ...(profile.admin ? [{ name: "Reminder settings", icon: RiSettings3Line }] : [])];
  const navigation = <nav className="review-navigation mf-navigation" aria-label="Meeting navigation"><div className="flex flex-col gap-2">
    <div className="flex items-stretch gap-0 rounded-xl bg-button-primary p-1 text-text-white">
      <button type="button" className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-2 text-start text-caption-2-semibold tracking-tight text-text-white outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring" aria-current={view === "Meetings" ? "page" : undefined} onClick={() => changeView("Meetings")}><RiCalendarLine className="size-4 shrink-0" /><span className="truncate whitespace-nowrap">Meetings &amp; Follow-ups</span></button>
      <button type="button" className="flex w-7 shrink-0 items-center justify-center rounded-lg text-text-white hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring" aria-label={sectionsOpen ? "Collapse meeting sections" : "Expand meeting sections"} aria-expanded={sectionsOpen} onClick={() => setSectionsOpen(open => !open)}><RiArrowDownSLine className={`size-4 transition-transform ${sectionsOpen ? "" : "-rotate-90"}`} /></button>
    </div>
    {sectionsOpen && <div className="ms-3 flex flex-col gap-1 border-s border-separator-border ps-2">{navItems.map(item => <Button key={item.name} variant="ghost" leadingIcon={item.icon} className={cx("w-full justify-start", view === item.name ? "bg-accent-50 text-accent-800 hover:bg-accent-100" : "bg-background-primary-default text-text-secondary hover:bg-background-secondary-hover")} aria-current={view === item.name ? "page" : undefined} onClick={() => item.name === "Notifications" ? focusNotifications() : changeView(item.name as View)}>{item.name}{item.name === "Notifications" && unread > 0 ? ` (${unread})` : ""}</Button>)}</div>}
  </div></nav>;
  return <DirectionProvider locale="en-US"><ReviewShell moduleName="Meetings & Follow-ups" icon="calendar" subtitle="Conversations & next steps" overviewHref="/library/modules/meetings" title={view} className="mf-shell" navigation={navigation} sidebarAccount={<div className="h-2" aria-hidden="true" />} controls={<Select aria-label="Review as employee" selectedKey={profile.id} onSelectionChange={key => { const next = meetingProfiles.find(item => item.id === key)!; setProfile(next); saveActiveCrmRole(next); setDetail(null); setCreate(null); changeView("Meetings"); }} className="mf-profile"><SelectItem id="ceo" textValue="Mohammad Abrar · Superadmin">Mohammad Abrar · Superadmin</SelectItem>{meetingProfiles.slice(1).map(item => <SelectItem key={item.id} id={item.id} textValue={`${item.name} · ${item.title}`}>{item.name} · {item.title}</SelectItem>)}</Select>}>
    <div className="relative min-h-0 min-w-0 flex-1"><div className="mf-page" onScroll={fade.onScroll}>
      {view !== "Meetings" && <><header className="flex flex-wrap items-center justify-between gap-4"><div className="flex flex-col gap-2"><h2 className="text-title-2-medium text-text-primary">{view}</h2><p className="text-body-regular text-text-secondary">{follow ? "Keep every customer commitment on track." : view === "Notifications" ? "Meeting and follow-up updates in one place." : "Set when employees receive meeting and follow-up reminders."}</p></div><div className="flex flex-wrap items-center gap-2">{follow && <Button leadingIcon={RiAddLine} disabled={!profile.readOnly && (!ready || !scopedRecords.some(item => canManageRecord(profile, item)))} onClick={() => setCreate("follow-up")}>Create follow-up</Button>}</div></header></>}
      {(error || notice) && <p role="status" className="rounded-xl border border-separator-border p-3 text-body-2-regular text-text-primary">{error || notice}</p>}
      {overview && activityView && <section className={cx("grid grid-cols-2 gap-3", follow ? "xl:grid-cols-4" : "xl:grid-cols-6")} aria-label="Quick overview">{summaries.map(item => <div key={item.label} className="flex flex-col gap-2 rounded-3xl border border-border-button-default bg-background-primary-default p-5"><span className="text-body-2-regular text-text-secondary">{item.label}</span><strong className="text-title-2-medium text-text-primary">{item.value}</strong></div>)}</section>}
      {view === "Meetings" && <section className={cx("mf-calendar-panel rounded-3xl border border-border-button-default bg-background-primary-default", meetingDisplay === "list" && "mf-list-panel")}>
        <div className="mf-meeting-toolbar">
          {meetingDisplay === "calendar" && <div className="mf-month-nav" aria-label="Calendar month">
            <IconButton icon={RiArrowLeftSLine} aria-label="Previous month" className="mf-month-nav-button" disabled={!ready} onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))} />
            <span className="text-body-medium">{ready ? calendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "Loading calendar"}</span>
            <IconButton icon={RiArrowRightSLine} aria-label="Next month" className="mf-month-nav-button" disabled={!ready} onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))} />
          </div>}
          {meetingDisplay === "list" && <SearchField aria-label="Search meetings or customers" placeholder="Search meetings or customers" value={query} onChange={setQuery} className="mf-search mf-meeting-search" />}
          <div className="mf-meeting-filter-controls">
            <Select className="mf-meeting-filter" aria-label="Filter meetings by status" selectedKey={status} onSelectionChange={key => setStatus(String(key))}><SelectItem id="all">All statuses</SelectItem>{statusOptions.map(value => <SelectItem key={value} id={value}>{value}</SelectItem>)}</Select>
            <Select className="mf-meeting-filter" aria-label="Filter meetings by assignee" selectedKey={owner} onSelectionChange={key => setOwner(String(key))}><SelectItem id="all">All assignees</SelectItem>{[...new Set(entries.map(item => item.assignedTo))].map(value => <SelectItem key={value} id={value}>{value}</SelectItem>)}</Select>
            <Select className="mf-meeting-filter" aria-label="Filter meetings by category" selectedKey={category} onSelectionChange={key => setCategory(String(key))}><SelectItem id="all">All categories</SelectItem>{["Manager meeting", "Brand meeting", "Follow-up meeting"].map(value => <SelectItem key={value} id={value}>{value}</SelectItem>)}</Select>
            <IconButton icon={RiBarChartBoxLine} aria-label="Quick overview" title="Quick overview" aria-pressed={overview} className={cx("mf-tool", overview && "border-accent-600 bg-accent-50 text-accent-700")} onClick={() => setOverview(!overview)} />
            <Button leadingIcon={RiAddLine} disabled={profile.readOnly || !ready || !scopedRecords.some(item => canManageRecord(profile, item) && item.opportunityId)} onClick={() => { setMeetingInitialDate(istParts(now || Date.now()).date); setCreate("meeting"); }}>New meeting</Button>
            <div className="mf-view-toggle" aria-label="Meeting view">
              <IconButton icon={RiCalendarLine} aria-label="Calendar view" title="Calendar view" aria-pressed={meetingDisplay === "calendar"} onClick={() => { setQuery(""); setMeetingDisplay("calendar"); }} />
              <IconButton icon={RiListUnordered} aria-label="List view" title="List view" aria-pressed={meetingDisplay === "list"} onClick={() => { setQuery(""); setMeetingDisplay("list"); }} />
            </div>
          </div>
        </div>
        {meetingDisplay === "calendar" ? ready ? <MeetingCalendarView meetings={filtered.filter((item): item is Meeting => "startAt" in item)} month={calendarMonth} now={now} onOpen={id => setDetail({ kind: "meeting", id })} onAddForDate={date => { setMeetingInitialDate(date); setCreate("meeting"); }} /> : <p className="mf-calendar-empty">Loading calendar…</p> : <div className={cx("mf-list-content", advanced && "mf-with-filters")}>
          <div className="min-w-0"><Table aria-label="Meetings" className="mf-table"><TableHeader>{visibleColumns.map(column => <TableColumn key={column.id} id={column.id} isRowHeader={column.id === "title"}>{column.name}</TableColumn>)}<TableColumn aria-label="Actions"> </TableColumn></TableHeader><TableBody renderEmptyState={() => <div className="p-8 text-center text-body-regular text-text-secondary">{!ready ? "Loading your meetings…" : entries.length ? "No meetings match these filters." : "No meetings in your authorised records yet."}</div>}>{rows.map(item => {
            const record = recordFor(item.recordId);
            const canManage = canManageRecord(profile, record);
            const customerHref = `/library/modules/leads?view=${encodeURIComponent(record?.category ?? "Franchise")}&enquiry=${encodeURIComponent(item.recordId)}`;
            return <TableRow key={item.id} id={item.id} className="mf-meeting-row" onAction={() => { setOpenMeetingMenuId(null); setDetail({ id: item.id, kind: "meeting" }); }}>
              {visibleColumns.map(column => <TableCell key={column.id}>{column.id === "title" ? <span className="mf-title-copy"><span className="text-body-medium">{item.title}</span><span className="text-caption-1-regular text-text-tertiary">{item.id}</span></span> : column.id === "status" ? <StatusBadge status={statusFor(item)} /> : column.id === "due" ? <span className="text-body-2-regular text-text-secondary">{displayTime(dateFor(item))}</span> : column.id === "customer" ? <div className="flex flex-col gap-1"><span>{record?.name}</span><span className="text-caption-1-regular text-text-tertiary">{item.recordId}</span></div> : valueFor(item, column.id)}</TableCell>)}
              <TableCell><Dropdown isOpen={openMeetingMenuId === item.id} onOpenChange={isOpen => setOpenMeetingMenuId(isOpen ? item.id : null)}><DropdownTrigger aria-label={`Actions for ${item.title}`} className="rounded-xl p-2 text-foreground-icon-secondary" onClick={event => event.stopPropagation()}><RiMore2Fill className="size-5" /></DropdownTrigger><DropdownPopover aria-label="Meeting actions">
                <DropdownItem onSelect={() => { setOpenMeetingMenuId(null); setDetail({ id: item.id, kind: "meeting" }); }}>View</DropdownItem>
                <DropdownItem onSelect={() => { setOpenMeetingMenuId(null); router.push(customerHref); }}>Customer details</DropdownItem>
                {canManage && <DropdownItem onSelect={() => { setOpenMeetingMenuId(null); setDetail({ id: item.id, kind: "meeting", action: "follow-up" }); }}>Create follow-up</DropdownItem>}
                {canManage && !("dueAt" in item) && ["Awaiting MOM", "MOM submitted"].includes(item.status) && <DropdownItem onSelect={() => { setOpenMeetingMenuId(null); setDetail({ id: item.id, kind: "meeting", action: "minutes" }); }}>{item.minutes.length ? "Correct minutes" : "Submit minutes"}</DropdownItem>}
              </DropdownPopover></Dropdown></TableCell>
            </TableRow>;
          })}</TableBody></Table><ActivityPagination filteredCount={filtered.length} currentPage={currentPage} lastPage={lastPage} page={page} scope={scope} onPage={setPage} hasAdvancedFilters={!!filters?.rules.length} filterCount={filters?.rules.length ?? 0} /></div>
          {advanced && <AdvancedLeadFilters key={`${scope}:${profile.id}`} fields={fields} scope={scope} userId={profile.id} title="Filter meetings" description="Find the customer conversations you need." recordLabel={scope} resultCount={filtered.length} activeFilterCount={filters?.rules.length ?? 0} initialFilters={filters} countFor={draft => basic.filter(item => matches(item, draft)).length} onApply={setFilters} onClear={() => setFilters(null)} onClose={() => setAdvanced(false)} />}
        </div>}
        {meetingDisplay === "calendar" && advanced && <AdvancedLeadFilters key={`calendar:${profile.id}`} fields={fields} scope={scope} userId={profile.id} title="Filter meetings" description="Find the customer conversations you need." recordLabel={scope} resultCount={filtered.length} activeFilterCount={filters?.rules.length ?? 0} initialFilters={filters} countFor={draft => basic.filter(item => matches(item, draft)).length} onApply={setFilters} onClear={() => setFilters(null)} onClose={() => setAdvanced(false)} />}
      </section>}
      {follow && <div className="mf-screen-grid"><section className="mf-list rounded-3xl border border-border-button-default bg-background-primary-default">
        <div className="mf-filters"><SearchField aria-label={`Search ${scope}`} placeholder={follow ? "Search follow-ups or customers" : "Search meetings or customers"} value={query} onChange={setQuery} className="mf-search" /><Select aria-label="Filter by status" selectedKey={status} onSelectionChange={key => setStatus(String(key))}><SelectItem id="all">All statuses</SelectItem>{(follow ? ["Pending", "Completed", "Overdue", "Cancelled"] : statusOptions).map(value => <SelectItem key={value} id={value}>{value}</SelectItem>)}</Select><Select aria-label="Filter by assigned employee" selectedKey={owner} onSelectionChange={key => setOwner(String(key))}><SelectItem id="all">All assignees</SelectItem>{[...new Set(entries.map(item => item.assignedTo))].map(value => <SelectItem key={value} id={value}>{value}</SelectItem>)}</Select><Select aria-label={follow ? "Filter by priority" : "Filter by category"} selectedKey={category} onSelectionChange={key => setCategory(String(key))}><SelectItem id="all">{follow ? "All priorities" : "All categories"}</SelectItem>{(follow ? ["High", "Medium", "Low"] : ["Manager meeting", "Brand meeting", "Follow-up meeting"]).map(value => <SelectItem key={value} id={value}>{value}</SelectItem>)}</Select><IconButton icon={RiFilter3Line} aria-label="Advanced filters" title="Advanced filters" aria-expanded={advanced} className={cx("mf-tool", advanced && "border-accent-600 bg-accent-50 text-accent-700")} onClick={() => setAdvanced(!advanced)} /><Button variant="secondary" leadingIcon={RiLayoutColumnLine} className="mf-columns" title="Customize columns" onClick={() => setColumnsOpen(true)}><span>Customize columns</span></Button></div>
        <div className={cx("mf-list-content", advanced && "mf-with-filters")}>
          <div className="min-w-0"><Table aria-label={view} className="mf-table"><TableHeader>{visibleColumns.map(column => <TableColumn key={column.id} id={column.id} isRowHeader={column.id === "title"}>{column.name}</TableColumn>)}<TableColumn aria-label="Actions"> </TableColumn></TableHeader><TableBody renderEmptyState={() => <div className="p-8 text-center text-body-regular text-text-secondary">{!ready ? "Loading your activities…" : entries.length ? "No activities match these filters." : "No activities in your authorised records yet."}</div>}>{rows.map(item => {
            const record = recordFor(item.recordId);
            const canManage = canManageRecord(profile, record);
            const customerHref = `/library/modules/leads?view=${encodeURIComponent(record?.category ?? "Franchise")}&enquiry=${encodeURIComponent(item.recordId)}`;
            return <TableRow key={item.id} id={item.id} className="mf-meeting-row" onAction={() => setDetail({ id: item.id, kind: follow ? "follow-up" : "meeting" })}>
              {visibleColumns.map(column => <TableCell key={column.id}>{column.id === "title" ? <span className="mf-title-copy"><span className="text-body-medium">{item.title}</span><span className="text-caption-1-regular text-text-tertiary">{item.id}</span></span> : column.id === "status" ? <StatusBadge status={statusFor(item)} /> : column.id === "due" ? <span className={cx("text-body-2-regular", statusFor(item) === "Overdue" ? "text-text-error-primary" : "text-text-secondary")}>{displayTime(dateFor(item))}</span> : column.id === "customer" ? <div className="flex flex-col gap-1"><span>{record?.name}</span><span className="text-caption-1-regular text-text-tertiary">{item.recordId}</span></div> : valueFor(item, column.id)}</TableCell>)}
              <TableCell><Dropdown><DropdownTrigger aria-label={`Actions for ${item.title}`} className="rounded-xl p-2 text-foreground-icon-secondary" onClick={event => event.stopPropagation()}><RiMore2Fill className="size-5" /></DropdownTrigger><DropdownPopover aria-label="Follow-up actions">
                <DropdownItem onSelect={() => setDetail({ id: item.id, kind: follow ? "follow-up" : "meeting" })}><RiEyeLine className="size-4" aria-hidden="true" />View details</DropdownItem>
                <DropdownItem onSelect={() => router.push(customerHref)}><RiArrowRightUpLine className="size-4" aria-hidden="true" />Customer details</DropdownItem>
                {follow && canManage && item.status === "Pending" && <><DropdownItem onSelect={() => setDetail({ id: item.id, kind: "follow-up", action: "reschedule" })}><RiCalendarLine className="size-4" aria-hidden="true" />Reschedule</DropdownItem><DropdownItem onSelect={() => setDetail({ id: item.id, kind: "follow-up", action: "reassign" })}><RiUserSharedLine className="size-4" aria-hidden="true" />Reassign</DropdownItem><DropdownItem onSelect={() => setDetail({ id: item.id, kind: "follow-up", action: "complete" })}><RiCheckboxCircleLine className="size-4" aria-hidden="true" />Complete follow-up</DropdownItem><DropdownItem onSelect={() => setDetail({ id: item.id, kind: "follow-up", action: "cancel" })}><RiCloseCircleLine className="size-4" aria-hidden="true" />Cancel follow-up</DropdownItem></>}
              </DropdownPopover></Dropdown></TableCell>
            </TableRow>;
          })}</TableBody></Table><footer className="flex flex-wrap items-center justify-between gap-3 border-t border-separator-border p-4"><p className="text-caption-1-regular text-text-secondary">{filtered.length ? `${(currentPage - 1) * 10 + 1}–${Math.min(currentPage * 10, filtered.length)} of ${filtered.length}` : "0"} {scope}{filters?.rules.length ? ` · ${filters.rules.length} advanced filters` : ""}</p><div className="flex items-center gap-3"><IconButton icon={RiArrowLeftSLine} aria-label="Previous page" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)} /><span className="text-caption-1-regular text-text-secondary">Page {currentPage} of {lastPage}</span><IconButton icon={RiArrowRightSLine} aria-label="Next page" disabled={currentPage >= lastPage} onClick={() => setPage(currentPage + 1)} /></div></footer></div>
          {advanced && <AdvancedLeadFilters key={`${scope}:${profile.id}`} fields={fields} scope={scope} userId={profile.id} title={follow ? "Filter follow-ups" : "Filter meetings"} description="Find the customer actions you need." recordLabel={scope} resultCount={filtered.length} activeFilterCount={filters?.rules.length ?? 0} initialFilters={filters} countFor={draft => basic.filter(item => matches(item, draft)).length} onApply={setFilters} onClear={() => setFilters(null)} onClose={() => setAdvanced(false)} />}
        </div>
      </section></div>}
      {view === "Notifications" && <MeetingsNotifications notifications={visibleNotifications} selected={selectedNotification} unread={unread} now={now} filter={notificationFilter} onFilter={value => { setNotificationFilter(value); setSelectedNotificationId(null); }} profile={profile} state={state} onSelect={item => { setSelectedNotificationId(item.id); if (!item.readBy.includes(profile.id)) markRead(item.id); }} onSetRead={setNotificationRead} onMarkManyRead={markNotificationsRead} onUpdate={updateNotification} onDeleteMany={deleteNotifications} />}
      {view === "Reminder settings" && profile.admin && <ReminderSettingsPanel state={state} profile={profile} />}
    </div><ScrollFade progress={fade.progress} surfaceClassName="from-background-primary-default" /></div>
    {create === "follow-up" && <FollowUpForm state={state} profile={profile} onClose={() => setCreate(null)} onSaved={id => setDetail({ kind: "follow-up", id })} />}
    {create === "meeting" && <MeetingForm state={state} profile={profile} initialDate={meetingInitialDate} onClose={() => setCreate(null)} onSaved={id => setDetail({ kind: "meeting", id })} />}
    {detail && !create && <EntityDetail key={`${detail.kind}:${detail.id}:${detail.action ?? "view"}`} {...detail} initialMode={detail.action ?? null} state={state} profile={profile} now={now} onClose={() => setDetail(null)} />}
    {columnsOpen && <ColumnManagerModal isOpen onOpenChange={setColumnsOpen} availableColumns={columns} selectedIds={columnIds} requiredIds={["title"]} scopeLabel={scope} onSave={ids => { try { savePersonalTableColumns(scope, profile.id, ids); setColumnIds(ids); setColumnsOpen(false); } catch { setNotice("Column preferences could not be saved."); } }} />}
    {confirmationDialog}
  </ReviewShell></DirectionProvider>;
}

function ReminderSettingsPanel({ state, profile }: { state: MeetingsState; profile: MeetingProfile }) {
  const [draft, setDraft] = useState({ followUps: state.settings.followUps, meetings: state.settings.meetings }); const [message, setMessage] = useState("");
  function setPolicy(key: "followUps" | "meetings", value: ReminderPolicy) { setDraft(current => ({ ...current, [key]: value })); setMessage(""); }
  return <form className="flex flex-col gap-5" onSubmit={event => { event.preventDefault(); try { updateMeetings(current => updateReminderSettings(current, profile, draft)); setMessage("Reminder settings saved."); } catch (failure) { setMessage((failure as Error).message); } }}>
    <section className="rounded-3xl border border-border-button-default bg-background-primary-default p-5"><h3 className="text-headline-medium text-text-primary">Notification delivery</h3><p className="mt-2 text-body-regular text-text-secondary">In-app reminders are available while the CRM is open. Google Calendar, Google Meet generation, email invitations, and background notifications require an organisation integration.</p></section>
    <div className="grid gap-5 xl:grid-cols-2">{(["followUps", "meetings"] as const).map(key => <PolicyEditor key={key} title={key === "followUps" ? "Follow-up reminders" : "Meeting reminders"} policy={draft[key]} onChange={value => setPolicy(key, value)} />)}</div>
    {message && <p role="status" className="text-body-2-medium text-text-primary">{message}</p>}
    <Button type="submit" className="self-end">Save reminder settings</Button>
    <section className="rounded-3xl border border-border-button-default bg-background-primary-default p-5"><AuditHistory events={state.settings.history} /></section>
  </form>;
}

function MeetingCalendarView({ meetings, month, now, onOpen, onAddForDate }: { meetings: Meeting[]; month: Date; now: number; onOpen: (id: string) => void; onAddForDate: (date: string) => void }) {
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay());
  const days = Array.from({ length: 42 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));
  const todayKey = istParts(new Date(now).toISOString()).date;
  return <section className="mf-calendar-board" aria-label="Meeting schedule">
    <div className="mf-calendar-overflow"><div className="mf-calendar-weekdays">{weekdays.map(day => <span key={day} className="text-body-2-medium">{day}</span>)}</div><div className="mf-calendar-grid">{days.map(day => {
      const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
      const dayMeetings = meetings.filter(item => istParts(item.startAt).date === key).sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt));
      return <article key={key} className={cx("mf-calendar-day", day.getMonth() !== month.getMonth() && "is-adjacent", key === todayKey && "is-today")}>
        <div className="mf-calendar-day-heading"><span className="mf-calendar-day-number text-body-2-medium" aria-current={key === todayKey ? "date" : undefined}>{day.getDate()}</span><IconButton icon={RiAddLine} aria-label={`New meeting on ${day.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}`} title="New meeting on this day" className="mf-calendar-add" onClick={() => onAddForDate(key)} /></div>
        <div className="mf-calendar-events">{dayMeetings.map((meeting, index) => <button type="button" key={meeting.id} className={cx("mf-calendar-event focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring", `is-color-${index % 3}`)} onClick={() => onOpen(meeting.id)} title={`${meeting.title} · ${meeting.assignedTo}`}><span className="text-caption-1-medium">{meeting.title}</span><time className="text-caption-1-regular">{new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(new Date(meeting.startAt))}</time></button>)}</div>
      </article>;
    })}</div></div>
    {!meetings.length && <p className="mf-calendar-empty">No meetings match the current filters.</p>}
  </section>;
}

type NotificationFilter = "All" | "Unread" | "Meetings" | "Follow-ups" | "Archived" | "Favorites";
function notificationInitials(name: string) { return name.trim().split(/\s+/).map(part => part[0]).slice(0, 2).join("").toUpperCase(); }
function MeetingsNotifications({ notifications, selected, unread, now, filter, onFilter, profile, state, onSelect, onSetRead, onMarkManyRead, onUpdate, onDeleteMany }: { notifications: MeetingsState["notifications"]; selected: MeetingsState["notifications"][number] | null; unread: number; now: number; filter: NotificationFilter; onFilter: (filter: NotificationFilter) => void; profile: MeetingProfile; state: MeetingsState; onSelect: (item: MeetingsState["notifications"][number]) => void; onSetRead: (id: string, isRead: boolean) => void; onMarkManyRead: (ids: string[]) => void; onUpdate: (id: string, action: "archive" | "restore" | "delete" | "star") => void; onDeleteMany: (ids: string[]) => void }) {
  const filters: NotificationFilter[] = ["All", "Unread", "Meetings", "Follow-ups", "Archived", "Favorites"];
  const groups = ["Today", "Earlier"] as const;
  const today = istParts(new Date(now).toISOString()).date;
  const groupFor = (item: MeetingsState["notifications"][number]) => istParts(item.createdAt).date === today ? "Today" : "Earlier";
  const shownSelected = notifications.find(item => item.id === selected?.id) ?? notifications[0] ?? null;
  const recordName = (id: string) => state.records.find(record => record.id === id)?.name ?? "Customer record";
  const relatedRecord = shownSelected ? state.records.find(record => record.id === shownSelected.recordId) : undefined;
  const meeting = shownSelected?.kind === "meeting" ? state.meetings.find(item => item.id === shownSelected.entityId) : undefined;
  const followUp = shownSelected?.kind === "follow-up" ? state.followUps.find(item => item.id === shownSelected.entityId) : undefined;
  const relatedStatus = meeting?.status ?? (followUp ? followUpStatus(followUp, now) : "");
  const relatedRecordHref = relatedRecord ? `/library/modules/leads?view=${encodeURIComponent(relatedRecord.category)}&enquiry=${encodeURIComponent(relatedRecord.id)}` : "#";
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const visibleIds = notifications.map(item => item.id).join("|");
  useEffect(() => { const ids = new Set(notifications.map(item => item.id)); setSelectedIds(current => current.filter(id => ids.has(id))); }, [visibleIds]);
  const toggleSelected = (id: string) => setSelectedIds(current => current.includes(id) ? current.filter(itemId => itemId !== id) : [...current, id]);
  const allSelected = notifications.length > 0 && notifications.every(item => selectedIds.includes(item.id));
  const someSelected = notifications.some(item => selectedIds.includes(item.id));
  const toggleAll = () => setSelectedIds(allSelected ? [] : notifications.map(item => item.id));
  const notificationFade = useScrollFade();
  return <section className="mf-notifications-layout" aria-label="Meeting and follow-up notifications">
    <div className="mf-notification-list-panel">
      <header className="mf-notification-list-head"><Checkbox size="sm" aria-label="Select all notifications" isSelected={allSelected} isIndeterminate={someSelected && !allSelected} isDisabled={!notifications.length} onChange={toggleAll} /><div className="mf-notification-list-actions"><Select aria-label="Filter notifications" selectedKey={filter} onSelectionChange={key => { setSelectedIds([]); onFilter(String(key) as NotificationFilter); }} className="mf-notification-filter">{filters.map(item => <SelectItem key={item} id={item}>{item}{item === "Unread" && unread > 0 ? ` (${unread})` : ""}</SelectItem>)}</Select>{someSelected && <div className="flex items-center gap-1"><IconButton size="small" icon={RiDeleteBinLine} aria-label={`Delete ${selectedIds.length} selected notifications`} title="Delete selected" className="text-text-error-primary" onClick={() => { onDeleteMany(selectedIds); setSelectedIds([]); }} /><IconButton size="small" icon={RiCheckLine} aria-label={`Mark ${selectedIds.length} selected notifications as read`} title="Mark selected as read" onClick={() => onMarkManyRead(selectedIds)} /></div>}</div></header>
      <div className="mf-notifications-scroll-wrap"><div className="mf-notification-list" onScroll={notificationFade.onScroll}>{groups.map(group => {
        const items = notifications.filter(item => groupFor(item) === group);
        if (!items.length) return null;
        return <section className="mf-notification-group" key={group}><h4 className="text-body-2-medium">{group}</h4>{items.map(item => {
          const isUnread = !item.readBy.includes(profile.id);
          const relatedPerson = item.kind === "meeting" ? state.meetings.find(entity => entity.id === item.entityId)?.assignedTo : state.followUps.find(entity => entity.id === item.entityId)?.assignedTo;
          const person = relatedPerson ?? state.records.find(record => record.id === item.recordId)?.owner ?? recordName(item.recordId);
          return <div className="mf-notification-row" data-selected={item.id === shownSelected?.id} data-unread={isUnread} key={item.id}>
            <Checkbox size="sm" aria-label={`Select ${item.title}`} isSelected={selectedIds.includes(item.id)} onChange={() => toggleSelected(item.id)} />
            <Avatar size="lg" src={portraitFor(person)} initials={notificationInitials(person)} alt="" />
            <button type="button" className="mf-notification-row-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring" onClick={() => onSelect(item)}><span className="mf-notification-copy"><strong className="text-body-2-medium">{item.title}</strong><small className="text-caption-1-regular">{recordName(item.recordId)} · {item.kind === "meeting" ? "Meeting" : "Follow-up"}</small></span></button>
            <time className="text-caption-1-regular">{new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(new Date(item.createdAt))}</time>
            <IconButton size="small" icon={item.starredBy?.includes(profile.id) ? RiStarFill : RiStarLine} aria-label={item.starredBy?.includes(profile.id) ? `Remove ${item.title} from favorites` : `Add ${item.title} to favorites`} title={item.starredBy?.includes(profile.id) ? "Remove favorite" : "Add favorite"} className={item.starredBy?.includes(profile.id) ? "text-accent-600" : "text-foreground-icon-tertiary"} onClick={() => onUpdate(item.id, "star")} />
          </div>;
        })}</section>;
      })}{!notifications.length && <p className="mf-notifications-empty">{filter === "Unread" ? "You have no unread notifications." : filter === "Favorites" ? "You have no favorite notifications." : "You’re up to date. New reminders will appear here."}</p>}</div><ScrollFade progress={notificationFade.progress} surfaceClassName="from-background-primary-default" /></div>
    </div>
    {shownSelected ? <aside className="mf-notification-detail" key={shownSelected.id}>
      <div className="mf-notice-detail-toolbar"><Avatar size="lg" src={portraitFor(meeting?.assignedTo ?? followUp?.assignedTo ?? relatedRecord?.owner ?? relatedRecord?.name ?? "")} initials={notificationInitials(meeting?.assignedTo ?? followUp?.assignedTo ?? relatedRecord?.owner ?? relatedRecord?.name ?? "")} alt="" /><div className="flex items-center gap-2">
        <IconButton icon={shownSelected.archivedBy?.includes(profile.id) ? RiInboxUnarchiveLine : RiArchiveLine} aria-label={shownSelected.archivedBy?.includes(profile.id) ? "Restore notification" : "Archive notification"} title={shownSelected.archivedBy?.includes(profile.id) ? "Restore" : "Archive"} onClick={() => onUpdate(shownSelected.id, shownSelected.archivedBy?.includes(profile.id) ? "restore" : "archive")} />
        <IconButton icon={RiDeleteBinLine} aria-label="Delete notification" title="Delete" className="text-text-error-primary" onClick={() => onUpdate(shownSelected.id, "delete")} />
        <Button variant="secondary" size="small" leadingIcon={shownSelected.readBy.includes(profile.id) ? RiMailUnreadLine : RiMailLine} aria-label={shownSelected.readBy.includes(profile.id) ? "Mark as unread" : "Mark as read"} onClick={() => onSetRead(shownSelected.id, !shownSelected.readBy.includes(profile.id))}>{shownSelected.readBy.includes(profile.id) ? "Mark unread" : "Mark read"}</Button>
      </div></div>
      <span className="mf-notice-category text-caption-1-semibold">{shownSelected.kind === "meeting" ? "Meeting" : "Follow-up"}</span><h3 className="text-title-2-medium">{shownSelected.title}</h3><p className="mf-notice-time text-body-2-regular">{displayTime(shownSelected.createdAt)} IST</p>
      <p className="mf-notice-description text-body-regular">{relatedRecord?.name ?? "Customer record"} · Due {displayTime(shownSelected.dueAt)} IST</p>
      <section className="mf-notice-context" aria-label="Related record details">
        {relatedStatus && <div className="mf-notice-status-row"><StatusBadge status={relatedStatus} /></div>}
        {relatedRecord && <a className="mf-notice-record-link text-body-2-regular" href={relatedRecordHref}>Open customer record · {relatedRecord.id}{relatedRecord.opportunityId ? ` · ${relatedRecord.opportunityId}` : ""}</a>}
        {(meeting || followUp) && <span className="text-body-2-regular">Assigned to · {meeting?.assignedTo ?? followUp?.assignedTo}</span>}
        {meeting && <><span className="text-body-2-regular">{meeting.category} · {meeting.duration} minutes · {meeting.format}{meeting.format === "Virtual" ? ` · ${meeting.platform ?? "Google Meet"}` : ""}</span>{meeting.customerEmail && <span className="text-body-2-regular">Customer email · {meeting.customerEmail}</span>}{meeting.meetLink && <a className="flex items-center gap-2 text-body-2-regular text-accent-700 underline" href={meeting.meetLink} target="_blank" rel="noreferrer"><MeetingPlatformLogo platform={meeting.platform ?? "Google Meet"} className="size-5" />Join {meeting.platform ?? "meeting"}</a>}</>}
        {followUp && <><span className="text-body-2-regular">Priority · {followUp.priority} · {followUp.linkType}</span><p className="text-body-2-regular text-text-secondary">{followUp.description}</p></>}
      </section>
    </aside> : <aside className="mf-notification-detail mf-notification-placeholder"><RiNotification3Line className="size-8 text-foreground-icon-tertiary" /><p className="text-body-regular text-text-secondary">Select an update to see its details.</p></aside>}
  </section>;
}

function ActivityPagination({ filteredCount, currentPage, lastPage, page, scope, onPage, hasAdvancedFilters, filterCount }: { filteredCount: number; currentPage: number; lastPage: number; page: number; scope: string; onPage: (page: number) => void; hasAdvancedFilters: boolean; filterCount: number }) {
  return <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-separator-border p-4"><p className="text-caption-1-regular text-text-secondary">{filteredCount ? `${(currentPage - 1) * 10 + 1}–${Math.min(currentPage * 10, filteredCount)} of ${filteredCount}` : "0"} {scope}{hasAdvancedFilters ? ` · ${filterCount} advanced filters` : ""}</p><div className="flex items-center gap-3"><IconButton icon={RiArrowLeftSLine} aria-label="Previous page" disabled={currentPage <= 1} onClick={() => onPage(page - 1)} /><span className="text-caption-1-regular text-text-secondary">Page {currentPage} of {lastPage}</span><IconButton icon={RiArrowRightSLine} aria-label="Next page" disabled={currentPage >= lastPage} onClick={() => onPage(page + 1)} /></div></footer>;
}

function PolicyEditor({ title, policy, onChange }: { title: string; policy: ReminderPolicy; onChange: (value: ReminderPolicy) => void }) {
  const [beforeText, setBeforeText] = useState(policy.before.join(", "));
  return <section className="flex flex-col gap-4 rounded-3xl border border-border-button-default bg-background-primary-default p-5"><h3 className="text-headline-medium text-text-primary">{title}</h3><Input label="Before the scheduled time (minutes)" value={beforeText} onChange={value => { setBeforeText(value); onChange({ ...policy, before: value.trim() ? value.split(",").map(item => item.trim() ? Number(item) : NaN) : [] }); }} placeholder="e.g. 60, 30, 5" fieldClassName={fieldClass} /><p className="text-caption-1-regular text-text-secondary">Separate multiple intervals with commas. Leave empty to turn off advance reminders.</p><Checkbox isSelected={policy.atTime} onChange={atTime => onChange({ ...policy, atTime })}>At the scheduled time</Checkbox><Checkbox isSelected={policy.overdueAfter !== null} onChange={enabled => onChange({ ...policy, overdueAfter: enabled ? 15 : null })}>Remind after the scheduled time is missed</Checkbox>{policy.overdueAfter !== null && <Input label="Minutes after the scheduled time" type="number" isRequired value={String(policy.overdueAfter)} onChange={value => onChange({ ...policy, overdueAfter: value ? Number(value) : NaN })} fieldClassName={fieldClass} />}</section>;
}
