"use client";

import { useMemo, useState, type ReactNode } from "react";
import { RiArrowLeftSLine, RiArrowRightSLine, RiCheckboxCircleLine, RiDownload2Line, RiTimeLine, RiUser3Line } from "@remixicon/react";
import { Avatar } from "@/components/base/avatar/avatar";
import { Chip, type ChipColor } from "@/components/base/badges/chip";
import { Modal, ModalBody, ModalHeader } from "@/components/base/modal/modal";
import { SelectItem } from "@/components/base/select/select";
import { portraitFor } from "@/modules/users-roles/portrait";
import type { Category, SourceLead } from "../types";
import { LeadSelect } from "./lead-fields";

const pageSize = 6;
const statusColor: Record<SourceLead["status"], ChipColor> = { New: "purple", "In Progress": "yellow", Qualified: "lime", Converted: "blue" };

function initials(name: string) {
  return (name.trim()[0] ?? "").toUpperCase();
}

function firstName(name: string) {
  return name.split(" ").filter(Boolean)[0] ?? name;
}

function percent(part: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

function fromPhrase(name: string) {
  if (name === "Website") return "your website";
  if (name === "All") return "every source";
  return name;
}

function exportLeads(name: string, rows: SourceLead[]) {
  const header = ["Lead", "ID", "Phone", "Email", "Investment", "Owner", "Status", "Last activity", "Note"];
  const lines = rows.map(row => [row.name, row.code, row.phone, row.email, row.investment, row.owner, row.status, row.when, row.note]);
  const csv = [header, ...lines].map(line => line.map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name.toLowerCase().replace(/\s+/g, "-")}-leads.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function SourceLeadsPanel({ name, rows, categories, mark, onClose, onOpenLead }: { name: string; rows: SourceLead[]; categories: readonly Category[]; mark: ReactNode; onClose: () => void; onOpenLead: (row: SourceLead) => void }) {
  const [query, setQuery] = useState("");
  const [enquiry, setEnquiry] = useState("All enquiries");
  const [status, setStatus] = useState("All Statuses");
  const [owner, setOwner] = useState("All Owners");
  const [time, setTime] = useState("All Time");
  const [page, setPage] = useState(1);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const scoped = useMemo(() => rows.filter(row => enquiry === "All enquiries" || row.category === enquiry), [rows, enquiry]);
  const owners = useMemo(() => ["All Owners", ...new Set(scoped.map(row => row.owner))], [scoped]);
  const filtered = scoped.filter(row => {
    const text = `${row.name} ${row.code} ${row.phone} ${row.email}`.toLowerCase();
    return text.includes(query.toLowerCase())
      && (status === "All Statuses" || row.status === status)
      && (owner === "All Owners" || row.owner === owner)
      && (time === "All Time" || row.date.includes(time));
  });
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * pageSize, current * pageSize);
  const start = filtered.length ? (current - 1) * pageSize + 1 : 0;
  const converted = scoped.filter(row => row.status === "Converted").length;
  const qualified = scoped.filter(row => row.status === "Qualified").length;
  const progress = scoped.filter(row => row.status === "In Progress").length;
  const pageIds = visible.map(row => row.id);
  const allPicked = pageIds.length > 0 && pageIds.every(id => picked.has(id));

  function togglePage() {
    setPicked(currentSet => {
      const next = new Set(currentSet);
      if (allPicked) pageIds.forEach(id => next.delete(id));
      else pageIds.forEach(id => next.add(id));
      return next;
    });
  }

  return (
    <Modal className="ld-dialog ld-source-panel" isOpen onOpenChange={next => { if (!next) onClose(); }} size="wide" aria-label={`${name === "All" ? "All" : name} leads`}>
      <ModalHeader title={
        <span className="ld-source-head">
          {mark}
          <span className="min-w-0">
            <strong>{name === "All" ? "All leads" : `${name} Leads`}</strong>
            <em>{rows.length} total {rows.length === 1 ? "lead" : "leads"} from {fromPhrase(name)}</em>
          </span>
          <button type="button" className="ld-export" onClick={() => exportLeads(name, filtered)}><RiDownload2Line /> Export</button>
        </span>
      } />
      <ModalBody>
        <div className="ld-source-stats">
          <Stat tone="purple" icon={<RiUser3Line />} value={scoped.length} label="Total Leads" active={status === "All Statuses"} onClick={() => { setStatus("All Statuses"); setPage(1); }} />
          <Stat tone="green" icon={<RiCheckboxCircleLine />} value={converted} label="Converted" share={percent(converted, scoped.length)} active={status === "Converted"} onClick={() => { setStatus("Converted"); setPage(1); }} />
          <Stat tone="blue" icon={<RiCheckboxCircleLine />} value={qualified} label="Qualified" share={percent(qualified, scoped.length)} active={status === "Qualified"} onClick={() => { setStatus("Qualified"); setPage(1); }} />
          <Stat tone="amber" icon={<RiTimeLine />} value={progress} label="In Progress" share={percent(progress, scoped.length)} active={status === "In Progress"} onClick={() => { setStatus("In Progress"); setPage(1); }} />
        </div>
        <div className="ld-source-tools">
          <input className="ld-source-search" value={query} placeholder="Search leads by name, email or phone..." onChange={event => { setQuery(event.target.value); setPage(1); }} aria-label="Search leads" />
          <LeadSelect aria-label="Enquiries" selectedKey={enquiry} onSelectionChange={key => { setEnquiry(String(key)); setOwner("All Owners"); setPage(1); }} className="w-[168px] shrink-0">
            {["All enquiries", ...categories].map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}
          </LeadSelect>
          <LeadSelect aria-label="Status" selectedKey={status} onSelectionChange={key => { setStatus(String(key)); setPage(1); }} className="w-[148px] shrink-0">
            {["All Statuses", "New", "In Progress", "Qualified", "Converted"].map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}
          </LeadSelect>
          <LeadSelect aria-label="Owner" selectedKey={owner} onSelectionChange={key => { setOwner(String(key)); setPage(1); }} className="w-[140px] shrink-0">
            {owners.map(item => <SelectItem key={item} id={item}>{item === "All Owners" ? item : firstName(item)}</SelectItem>)}
          </LeadSelect>
          <LeadSelect aria-label="Time" selectedKey={time} onSelectionChange={key => { setTime(String(key)); setPage(1); }} className="w-[156px] shrink-0">
            {["All Time", "Nov", "Oct"].map(item => <SelectItem key={item} id={item}>{item === "All Time" ? item : item === "Nov" ? "November 2026" : "October 2026"}</SelectItem>)}
          </LeadSelect>
        </div>
        <div className="ld-source-table-wrap">
          <table className="ld-source-table">
            <thead>
              <tr>
                <th><input type="checkbox" aria-label="Select leads on this page" checked={allPicked} onChange={togglePage} /></th>
                <th>Lead</th>
                <th>Contact</th>
                <th>Investment</th>
                <th>Owner</th>
                <th>Status</th>
                <th>Last Activity</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(row => (
                <tr key={row.id} className="ld-source-row" onClick={() => onOpenLead(row)}>
                  <td onClick={event => event.stopPropagation()}><input type="checkbox" aria-label={`Select ${row.name}`} checked={picked.has(row.id)} onChange={() => setPicked(currentSet => { const next = new Set(currentSet); if (next.has(row.id)) next.delete(row.id); else next.add(row.id); return next; })} /></td>
                  <td>
                    <span className="ld-source-person">
                      <Avatar size="sm" initials={initials(row.name)} alt="" className="ld-initials" />
                      <span><strong>{row.name}</strong><em>{row.code}</em></span>
                    </span>
                  </td>
                  <td className="ld-source-contact"><span>{row.phone}</span><span>{row.email}</span></td>
                  <td>{row.investment}</td>
                  <td>
                    <span className="ld-source-person">
                      <Avatar size="sm" src={portraitFor(row.owner)} initials={initials(row.owner)} alt="" />
                      <strong>{firstName(row.owner)}</strong>
                    </span>
                  </td>
                  <td><Chip variant="caption" color={statusColor[row.status]} className="ld-pill rounded-full px-2">{row.status}</Chip></td>
                  <td className="ld-source-when"><strong>{row.when}</strong><em>{row.note}</em></td>
                </tr>
              ))}
              {!visible.length && <tr><td colSpan={7} className="ld-source-empty">No leads match these filters.</td></tr>}
            </tbody>
          </table>
        </div>
        <footer className="ld-source-pager">
          <span>Showing {start}–{Math.min(current * pageSize, filtered.length)} of {filtered.length} leads</span>
          <div>
            <button type="button" aria-label="Previous page" disabled={current === 1} onClick={() => setPage(current - 1)}><RiArrowLeftSLine /></button>
            {Array.from({ length: pages }, (_, index) => (
              <button key={index} type="button" aria-current={current === index + 1 ? "page" : undefined} onClick={() => setPage(index + 1)}>{index + 1}</button>
            ))}
            <button type="button" aria-label="Next page" disabled={current === pages} onClick={() => setPage(current + 1)}><RiArrowRightSLine /></button>
          </div>
        </footer>
      </ModalBody>
    </Modal>
  );
}

function Stat({ tone, icon, value, label, share, active, onClick }: { tone: string; icon: ReactNode; value: number; label: string; share?: string; active?: boolean; onClick: () => void }) {
  return (
    <button type="button" className={`ld-source-stat ld-source-${tone}${active ? " is-on" : ""}`} onClick={onClick}>
      <span>{icon}</span>
      <strong>{value}</strong>
      <em>{label}</em>
      {share && <b>{share}</b>}
    </button>
  );
}
