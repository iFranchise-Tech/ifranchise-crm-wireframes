"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { RiAddLine, RiCheckboxCircleLine, RiDeleteBinLine, RiFileExcel2Line, RiFilePdf2Line, RiPauseCircleLine, RiPencilLine, RiShieldCheckLine, RiUserForbidLine, type RemixiconComponentType } from "@remixicon/react";
import { ReviewShell } from "@/modules/screen-library/components/review-shell";
import { Avatar } from "@/components/base/avatar/avatar";
import { Chip, type ChipColor } from "@/components/base/badges/chip";
import { Button } from "@/components/base/buttons/button";
import { IconButton } from "@/components/base/buttons/icon-button";
import { CloseButton } from "@/components/base/buttons/close-button";
import { LinkButton } from "@/components/base/buttons/link-button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Dropdown, DropdownItem, DropdownPopover, DropdownTrigger } from "@/components/base/dropdown/dropdown";
import { Input } from "@/components/base/input/input";
import { AlertDialog, Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/base/modal/modal";
import { SearchField } from "@/components/base/search-field/search-field";
import { Select, SelectItem } from "@/components/base/select/select";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@/components/base/table/table";
import { Textarea } from "@/components/base/textarea/textarea";
import { DirectionProvider } from "@/components/foundations/direction/direction";
import { cx } from "@/utils/cx";
import "./users-roles.css";
import { initialAudit, initialDepartments, initialDevices, initialRoles, initialUsers } from "../data";
import { portraitFor } from "../portrait";
import { actions, modules, statuses, type Action, type Audit, type Device, type Role, type User } from "../types";

const sections = ["Users", "Roles", "Effective access", "Departments", "Teams", "Devices", "Audit history"] as const;
type Section = (typeof sections)[number];
type DeviceDraft = Device & { originalId?: string };
type ConfirmState = { title: string; description: string; apply: (reason: string) => void };
type AvatarColor = "neutral" | "blue" | "lime" | "pink";

const descriptions: Record<Section, string> = {
  Users: "Manage your people and the access they need.",
  Roles: "Define responsibilities with clear permission boundaries.",
  "Effective access": "See what a person can access, and why.",
  Departments: "Keep each department and its people together.",
  Teams: "See reporting relationships across the company.",
  Devices: "Review employee devices and their approval status.",
  "Audit history": "Trace account, role and device changes.",
};

const auditColumns = ["When", "Actor", "Action", "Record", "Before", "After", "Reason"] as const;
type BoardColumn = { id: string; name: string; isRowHeader?: boolean };
const userColumns: BoardColumn[] = [
  { id: "employee", name: "Employee", isRowHeader: true },
  { id: "role", name: "CRM role" },
  { id: "department", name: "Department / team" },
  { id: "status", name: "Status" },
  { id: "login", name: "Last login" },
  { id: "manage", name: "Manage" },
];
const reportColumns: BoardColumn[] = [
  { id: "employee", name: "Employee", isRowHeader: true },
  { id: "department", name: "Department" },
  { id: "team", name: "Team" },
  { id: "manager", name: "Reporting manager" },
  { id: "manage", name: "Manage" },
];
const deviceColumns: BoardColumn[] = [
  { id: "device", name: "Device", isRowHeader: true },
  { id: "employee", name: "Employee" },
  { id: "software", name: "Software" },
  { id: "sync", name: "Last sync" },
  { id: "status", name: "Status" },
  { id: "manage", name: "Manage" },
];
const auditColumnDefs: BoardColumn[] = auditColumns.map(column => ({ id: column, name: column === "Actor" ? "Changed by" : column, isRowHeader: column === "When" }));
const avatarColors: AvatarColor[] = ["blue", "lime", "pink", "neutral"];

function isSection(value?: string): value is Section {
  return !!value && (sections as readonly string[]).includes(value);
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map(part => part[0] || "").join("");
}

function avatarColor(name: string): AvatarColor {
  const sum = [...name].reduce((total, char) => total + char.charCodeAt(0), 0);
  return avatarColors[sum % avatarColors.length];
}

function statusPill(value: string) {
  return value === "Active" || value === "Approved" ? "ur-status-active" : undefined;
}

function photoFor(user: Pick<User, "name" | "avatar">) {
  return user.avatar || portraitFor(user.name);
}

function readPhoto(file: File) {
  return new Promise<string>((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      const size = 128;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(url);
        reject(new Error("Photo could not be prepared."));
        return;
      }
      const scale = Math.max(size / image.width, size / image.height);
      const width = image.width * scale;
      const height = image.height * scale;
      context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.86));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Choose an image file."));
    };
    image.src = url;
  });
}

function statusColor(value: string): ChipColor {
  if (value === "Active" || value === "Approved") return "lime";
  if (value === "Pending Activation" || value === "Pending approval") return "yellow";
  if (value === "Temporarily Suspended" || value === "Revoked") return "orange";
  if (value === "Deactivated") return "rose";
  return "neutral";
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char] || char));
}

function auditCells(entry: Audit) {
  return [entry.date, entry.actor, entry.action, entry.target, entry.before, entry.after, entry.reason];
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportExcel(rows: Audit[]) {
  const head = auditColumns.map(column => `<th>${column === "Actor" ? "Changed by" : column}</th>`).join("");
  const body = rows.map(row => `<tr>${auditCells(row).map(cell => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("");
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`;
  downloadBlob(new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" }), "audit-history.xls");
}

function exportPdf(rows: Audit[]) {
  const head = auditColumns.map(column => `<th>${column === "Actor" ? "Changed by" : column}</th>`).join("");
  const body = rows.map(row => `<tr>${auditCells(row).map(cell => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Audit history</title><style>body{font-family:Inter,Helvetica,Arial,sans-serif;color:#171717;padding:28px}h1{font-size:18px;margin:0 0 4px}p{margin:0 0 16px;color:#525252;font-size:12px}table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #e5e5e5;padding:7px 8px;text-align:left;vertical-align:top}th{background:#f7f7f7}</style></head><body><h1>Audit history</h1><p>${rows.length} records · ${escapeHtml(new Date().toLocaleString("en-IN"))}</p><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`;
  const frame = document.createElement("iframe");
  frame.title = "Audit history export";
  frame.style.cssText = "position:fixed;width:0;height:0;border:0;right:0;bottom:0";
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  if (!doc) {
    frame.remove();
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();
  frame.contentWindow?.focus();
  frame.contentWindow?.print();
  window.setTimeout(() => frame.remove(), 1500);
}

function blankDevice(userId: string): DeviceDraft {
  return { id: "", userId, name: "", model: "", os: "", app: "", registered: "", synced: "Not synced", status: "Pending approval" };
}

function Panel({ children, scroll = false }: { children: ReactNode; scroll?: boolean }) {
  return <section className={cx("overflow-hidden rounded-3xl border border-border-button-default bg-background-primary-default", scroll ? "flex min-h-0 flex-1 flex-col" : "shrink-0")}>{children}</section>;
}

function TableScroll({ children }: { children: ReactNode }) {
  return <div className="ur-scroll flex-1">{children}</div>;
}

function EmptyNote({ title, detail, onClear }: { title: string; detail: string; onClear?: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
      <h3 className="text-headline-medium text-text-primary">{title}</h3>
      <p className="text-body-regular text-text-secondary">{detail}</p>
      {onClear && <Button variant="secondary" onClick={onClear}>Clear filters</Button>}
    </div>
  );
}

function Toolbar({ children }: { children: ReactNode }) {
  return <div className="flex shrink-0 flex-nowrap items-center gap-2 overflow-x-auto border-b border-separator-border p-3">{children}</div>;
}

function Person({ name, meta, detail, src }: { name: string; meta?: string; detail?: string; src?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Avatar size="md" src={src || portraitFor(name)} alt="" initials={initials(name)} color={avatarColor(name)} />
      <span className="min-w-0">
        <span className="block text-body-2-medium text-text-primary">{name}</span>
        {meta && <span className="block text-caption-1-regular text-text-secondary">{meta}</span>}
        {detail && <span className="block text-caption-1-regular text-text-tertiary">{detail}</span>}
      </span>
    </div>
  );
}

function StatusMenu({ label, value, options, onChange }: { label: string; value: string; options: { id: string; text: string; color: ChipColor }[]; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const current = options.find(option => option.id === value) ?? options[0];
  return (
    <Dropdown isOpen={open} onOpenChange={setOpen}>
      <DropdownTrigger aria-label={label} className="shrink-0 rounded-full">
        <Chip variant="subtle" color={current.color} className={cx("rounded-full px-3", statusPill(current.id), current.color === "neutral" && "ur-field")}>{current.text}</Chip>
      </DropdownTrigger>
      <DropdownPopover aria-label={label} placement="bottom end" className="w-max min-w-56">
        {options.map(option => (
          <DropdownItem key={option.id} selected={option.id === value} onSelect={() => { onChange(option.id); setOpen(false); }}>
            <Chip variant="subtle" color={option.color} className={cx("rounded-full px-3", statusPill(option.id))}>{option.text}</Chip>
          </DropdownItem>
        ))}
      </DropdownPopover>
    </Dropdown>
  );
}

function FilterSelect({ label, value, options, onChange, className, fit = false }: { label: string; value: string; options: { id: string; label: string }[]; onChange: (value: string) => void; className?: string; fit?: boolean }) {
  return (
    <Select aria-label={label} selectedKey={value} onSelectionChange={key => onChange(String(key))} className={cx(fit ? "ur-fit-select w-max max-w-full shrink-0" : "w-44 shrink-0", className)} triggerClassName={cx("ur-field shadow-none", fit ? "w-auto" : "w-full")} popoverClassName={fit ? "ur-fit-popover w-max min-w-(--trigger-width)" : "w-(--trigger-width)"}>
      {options.map(option => <SelectItem key={option.id} id={option.id} textValue={option.label}>{option.label}</SelectItem>)}
    </Select>
  );
}

function Facts({ rows, ruled = false }: { rows: [string, string][]; ruled?: boolean }) {
  if (ruled) {
    const pairs: [string, string][][] = [];
    for (let index = 0; index < rows.length; index += 2) pairs.push(rows.slice(index, index + 2));
    return (
      <div className="ur-facts">
        {pairs.map(pair => (
          <div key={pair[0][0]} className="ur-facts-row">
            {pair.map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }
  return (
    <dl className="grid grid-cols-[max-content_minmax(0,1fr)] gap-x-8 gap-y-3">
      {rows.map(([label, value]) => (
        <div key={label} className="flex min-w-0 flex-col gap-0.5">
          <dt className="text-caption-1-medium text-text-tertiary">{label}</dt>
          <dd className="text-body-medium text-text-primary">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function ActionIcon({ label, icon, danger, onClick }: { label: string; icon: RemixiconComponentType; danger?: boolean; onClick: () => void }) {
  return (
    <span className="ur-action">
      <IconButton aria-label={label} icon={icon} onClick={onClick} className={danger ? "ur-action-danger" : undefined} />
      <span className="ur-action-tip" role="tooltip">{label}</span>
    </span>
  );
}

const matrixColumns: BoardColumn[] = [{ id: "module", name: "Module / data scope", isRowHeader: true }, ...actions.map(action => ({ id: action, name: action }))];

function Matrix({ role }: { role: Role }) {
  const rows = modules.map(moduleName => ({ id: moduleName }));
  return (
    <Table aria-label={`${role.name} permissions`} size="sm">
      <TableHeader columns={matrixColumns}>
        {(column: BoardColumn) => <TableColumn isRowHeader={column.isRowHeader} className={column.id === "module" ? undefined : "text-center"}>{column.name}</TableColumn>}
      </TableHeader>
      <TableBody items={rows}>
        {row => {
          const grant = role.grants.find(item => item.module === row.id);
          return (
            <TableRow columns={matrixColumns}>
              {(column: BoardColumn) => (
                <TableCell className={column.id === "module" ? undefined : "text-center"}>
                  {column.id === "module" ? (
                    <>
                      <span className="block text-body-medium text-text-primary">{row.id}</span>
                      <span className="block text-caption-1-regular text-text-tertiary">{grant?.scope || "No access"}</span>
                    </>
                  ) : (
                    <span className={grant?.actions.includes(column.id as Action) ? "text-status-lime-text" : "text-text-tertiary"}>{grant?.actions.includes(column.id as Action) ? "✓" : "—"}</span>
                  )}
                </TableCell>
              )}
            </TableRow>
          );
        }}
      </TableBody>
    </Table>
  );
}

const rowClass = "cursor-pointer outline-none";

export function UsersRolesWorkspace({ view = "Users" }: { view?: string }) {
  const router = useRouter();
  const section = isSection(view) ? view : "Users";
  const [users, setUsers] = useState(initialUsers);
  const [roles, setRoles] = useState(initialRoles);
  const [devices, setDevices] = useState(initialDevices);
  const [audit, setAudit] = useState(initialAudit);
  const [departments, setDepartments] = useState(initialDepartments);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All statuses");
  const [deptFilter, setDeptFilter] = useState("All departments");
  const [roleFilter, setRoleFilter] = useState("All roles");
  const [managerFilter, setManagerFilter] = useState("All managers");
  const [deviceStatus, setDeviceStatus] = useState("All statuses");
  const [deviceEmployee, setDeviceEmployee] = useState("All employees");
  const [auditAction, setAuditAction] = useState("All actions");
  const [auditActor, setAuditActor] = useState("Anyone");
  const [notice, setNotice] = useState("");
  const [detail, setDetail] = useState<User | null>(null);
  const [roleDetail, setRoleDetail] = useState<Role | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [deviceForm, setDeviceForm] = useState<DeviceDraft | null>(null);
  const [deviceDetail, setDeviceDetail] = useState<Device | null>(null);
  const [departmentForm, setDepartmentForm] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [reason, setReason] = useState("");
  const [selected, setSelected] = useState("IF2026002");
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  useEffect(() => {
    setQuery("");
    setFilter("All statuses");
    setDeptFilter("All departments");
    setRoleFilter("All roles");
    setManagerFilter("All managers");
    setDeviceStatus("All statuses");
    setDeviceEmployee("All employees");
    setAuditAction("All actions");
    setAuditActor("Anyone");
    setError("");
  }, [section]);

  const roleName = (id: string) => roles.find(role => role.id === id)?.name || "Unassigned";
  const ask = (next: ConfirmState) => { setReason(""); setConfirm(next); };
  const log = (action: string, target: string, before: string, after: string, entryReason: string) => {
    setAudit(list => [{ id: `AUD-${Date.now()}`, actor: "CRM administrator", action, target, before, after, date: new Date().toLocaleString("en-IN"), reason: entryReason }, ...list]);
    setNotice(`${action}. Sample data updated.`);
  };

  function saveUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const entries = Object.fromEntries(form);
    delete entries.reason;
    const user = { ...editUser, ...entries, created: editUser?.created || new Date().toLocaleDateString("en-IN"), lastLogin: editUser?.lastLogin || "Never" } as User;
    if (user.manager === "none") user.manager = "";
    if (users.some(item => item.id !== editUser?.id && (item.id.toLowerCase() === user.id.toLowerCase() || item.email.toLowerCase() === user.email.toLowerCase()))) {
      setError("Employee ID and email must be unique.");
      return;
    }
    if (user.manager === user.id) {
      setError("Choose a different reporting manager.");
      return;
    }
    let manager = user.manager;
    const visited = new Set([user.id]);
    while (manager) {
      if (visited.has(manager)) {
        setError("This manager would create a circular reporting relationship.");
        return;
      }
      visited.add(manager);
      manager = users.find(item => item.id === manager)?.manager || "";
    }
    if (user.roleId === "brand" && !user.brand.trim()) {
      setError("Assign a brand for this user.");
      return;
    }
    setUsers(list => list.some(item => item.id === editUser?.id) ? list.map(item => item.id === editUser?.id ? user : item) : [...list, user]);
    log(editUser?.created ? "User updated" : "User created", user.name, editUser?.created ? `${roleName(editUser.roleId)} · ${editUser.department}` : "—", `${roleName(user.roleId)} · ${user.department}`, String(form.get("reason")));
    setEditUser(null);
    setError("");
  }

  function saveDevice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!deviceForm) return;
    const form = new FormData(event.currentTarget);
    const next: Device = {
      id: String(form.get("id")).trim(),
      userId: String(form.get("userId")),
      name: String(form.get("name")).trim(),
      model: String(form.get("model")).trim(),
      os: String(form.get("os")).trim(),
      app: String(form.get("app")).trim(),
      registered: deviceForm.originalId ? deviceForm.registered : new Date().toLocaleDateString("en-IN"),
      synced: deviceForm.originalId ? deviceForm.synced : "Not synced",
      status: deviceForm.originalId ? deviceForm.status : "Pending approval",
    };
    if (devices.some(device => device.id.toLowerCase() === next.id.toLowerCase() && device.id !== deviceForm.originalId)) {
      setError("This device number is already registered.");
      return;
    }
    setDevices(list => deviceForm.originalId ? list.map(device => device.id === deviceForm.originalId ? next : device) : [...list, next]);
    log(deviceForm.originalId ? "Device updated" : "Device registered", next.id, deviceForm.originalId ? `${deviceForm.name} · ${deviceForm.model}` : "—", `${next.name} · ${next.model}`, deviceForm.originalId ? "Device details updated" : "Registered for CRM access");
    setDeviceForm(null);
    setError("");
  }

  const changeStatus = (user: User, status: User["status"]) => ask({
    title: `${status === "Active" ? "Activate" : status === "Deactivated" ? "Deactivate" : "Suspend"} ${user.name}?`,
    description: "Account history and linked business records will be retained. This changes sample access only.",
    apply: entryReason => {
      setUsers(list => list.map(item => item.id === user.id ? { ...item, status } : item));
      setDetail(null);
      log("Account status changed", user.name, user.status, status, entryReason);
    },
  });

  const blankUser: User = { id: "", name: "", email: "", mobile: "", department: "Sales", designation: "", roleId: "bda", manager: "", team: "", brand: "", status: "Pending Activation", created: "", lastLogin: "Never", avatar: "" };
  const matchesPeople = (user: User) => `${user.name} ${user.id} ${user.email} ${user.department} ${user.designation} ${roleName(user.roleId)}`.toLowerCase().includes(query.toLowerCase());
  const peopleBase = users.filter(user => (deptFilter === "All departments" || user.department === deptFilter) && (roleFilter === "All roles" || user.roleId === roleFilter) && matchesPeople(user));
  const visibleUsers = peopleBase.filter(user => filter === "All statuses" || user.status === filter);
  const statusOptions = [
    { id: "All statuses", text: `All (${peopleBase.length})`, color: "neutral" as const },
    ...statuses.map(status => ({ id: status, text: `${status} (${peopleBase.filter(user => user.status === status).length})`, color: statusColor(status) })),
  ];
  const activeUser = users.find(user => user.id === selected) || users[0];
  const visibleDevices = devices.filter(device => {
    const employee = users.find(user => user.id === device.userId);
    const text = `${device.name} ${device.model} ${device.id} ${device.os} ${device.app} ${employee?.name || ""}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (deviceStatus === "All statuses" || device.status === deviceStatus) && (deviceEmployee === "All employees" || device.userId === deviceEmployee);
  });
  const visibleAudit = audit.filter(entry => {
    const text = `${entry.actor} ${entry.action} ${entry.target} ${entry.before} ${entry.after} ${entry.reason} ${entry.date}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (auditAction === "All actions" || entry.action === auditAction) && (auditActor === "Anyone" || entry.actor === auditActor);
  });
  const managerName = (id: string) => users.find(user => user.id === id)?.name || "";
  const visibleTeams = users.filter(user => {
    const manager = managerName(user.manager);
    const text = `${user.name} ${user.department} ${user.team} ${manager}`.toLowerCase();
    const departmentOk = deptFilter === "All departments" || user.department === deptFilter;
    const managerOk = managerFilter === "All managers" || (managerFilter === "none" ? !user.manager : user.manager === managerFilter);
    return text.includes(query.toLowerCase()) && departmentOk && managerOk;
  });
  const managerOptions = [
    { id: "All managers", label: "All managers" },
    { id: "none", label: "No reporting manager" },
    ...users.filter(user => users.some(report => report.manager === user.id)).map(user => ({ id: user.id, label: user.name })),
  ];
  const userHistory = detail ? audit.filter(entry => entry.target.includes(detail.name) || entry.target.includes(detail.id)).slice(0, 3) : [];
  const userDevices = detail ? devices.filter(device => device.userId === detail.id) : [];

  const nav = (
    <nav className="review-navigation">
      {sections.map(item => <Link className="review-overview-link" key={item} href={`/library/modules/roles?view=${encodeURIComponent(item)}`} aria-current={section === item ? "page" : undefined}>{item}</Link>)}
    </nav>
  );

  return (
    <DirectionProvider locale="en-US">
      <ReviewShell moduleName="Users & Roles" icon="users" subtitle="People, roles & access" overviewHref="/library/modules/roles?view=Users" title={section} navigation={nav}>
        <div className="ur-board flex h-full min-h-0 flex-col gap-6 overflow-hidden p-6 font-sans text-text-primary">
          {section !== "Effective access" && (
            <div className="flex shrink-0 items-center justify-between gap-4">
              <div className="flex min-w-0 flex-col gap-1">
                <h2 className="ur-title">{section}</h2>
                <p className="ur-lead">{descriptions[section]}</p>
              </div>
              {section === "Users" && <Button leadingIcon={RiAddLine} onClick={() => { setError(""); setEditUser(blankUser); }}>Add user</Button>}
              {section === "Roles" && <Button leadingIcon={RiAddLine} onClick={() => setEditRole({ id: "", name: "", description: "", system: false, grants: [], restrictions: ["Historical records remain protected."], protectedView: false, protectedEdit: false })}>Create role</Button>}
              {section === "Devices" && <Button leadingIcon={RiAddLine} onClick={() => { setError(""); setDeviceForm(blankDevice(users[0]?.id || "")); }}>Register device</Button>}
              {section === "Departments" && <Button leadingIcon={RiAddLine} onClick={() => { setError(""); setDepartmentForm(""); }}>Add department</Button>}
            </div>
          )}

          {notice && (
            <div role="status" className="flex shrink-0 items-center justify-between gap-3 rounded-xl border border-separator-border bg-background-secondary-default px-4 py-3 text-body-regular text-text-primary">
              {notice}
              <CloseButton aria-label="Dismiss notification" onClick={() => setNotice("")} />
            </div>
          )}

          {section === "Users" && (
            <Panel scroll>
              <Toolbar>
                <SearchField aria-label="Search users" placeholder="Search name, employee ID or role" value={query} onChange={setQuery} className="min-w-48 flex-1" fieldClassName="ur-field" />
                <StatusMenu label="Account status" value={filter} options={statusOptions} onChange={setFilter} />
                <FilterSelect fit label="Department" value={deptFilter} onChange={setDeptFilter} options={[{ id: "All departments", label: "All departments" }, ...departments.map(department => ({ id: department.name, label: department.name }))]} />
                <FilterSelect fit label="CRM role" value={roleFilter} onChange={setRoleFilter} options={[{ id: "All roles", label: "All roles" }, ...roles.map(role => ({ id: role.id, label: role.name }))]} />
              </Toolbar>
              <TableScroll>
              <Table className="ur-people" aria-label="Users" onRowAction={key => setDetail(users.find(user => user.id === String(key)) || null)}>
                <TableHeader columns={userColumns}>
                  {(column: BoardColumn) => <TableColumn isRowHeader={column.isRowHeader} className={column.id === "employee" ? "ur-avatar-head" : undefined}>{column.name}</TableColumn>}
                </TableHeader>
                <TableBody items={visibleUsers}>
                  {user => (
                    <TableRow columns={userColumns} className={rowClass}>
                      {(column: BoardColumn) => (
                        <TableCell>
                          {column.id === "employee" && <Person name={user.name} meta={user.id} detail={user.designation} src={photoFor(user)} />}
                          {column.id === "role" && roleName(user.roleId)}
                          {column.id === "department" && <><span className="block">{user.department}</span>{user.team && <span className="block text-caption-1-regular text-text-tertiary">{user.team}</span>}</>}
                          {column.id === "status" && <Chip variant="subtle" color={statusColor(user.status)} className={statusPill(user.status)}>{user.status}</Chip>}
                          {column.id === "login" && user.lastLogin}
                          {column.id === "manage" && <LinkButton onClick={event => { event.stopPropagation(); setError(""); setEditUser(user); }}>Edit</LinkButton>}
                        </TableCell>
                      )}
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {!visibleUsers.length && <EmptyNote title="No users found" detail="Try another name, department, role or account status." onClear={() => { setQuery(""); setFilter("All statuses"); setDeptFilter("All departments"); setRoleFilter("All roles"); }} />}
              </TableScroll>
            </Panel>
          )}

          {section === "Roles" && (
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto md:grid-cols-2 xl:grid-cols-3">
              {roles.map(role => (
                <article key={role.id} className="flex flex-col gap-4 rounded-3xl border border-border-button-default bg-background-primary-default p-6">
                  <div className="flex items-center justify-between gap-2">
                    <Chip variant="caption" color={role.system ? "blue" : "neutral"}>{role.system ? "Core role" : "Custom role"}</Chip>
                    <span className="text-caption-1-regular text-text-tertiary">{users.filter(user => user.roleId === role.id).length} users</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-headline-medium text-text-primary">{role.name}</h3>
                    <p className="text-body-regular text-text-secondary">{role.description}</p>
                  </div>
                  <span className="text-caption-1-regular text-text-tertiary">{role.grants.length} modules with access</span>
                  <footer className="mt-auto flex items-center justify-between border-t border-separator-border pt-3">
                    <LinkButton onClick={() => setRoleDetail(role)}>View permissions</LinkButton>
                    <LinkButton variant="secondary" onClick={() => setEditRole(structuredClone(role))}>Edit role</LinkButton>
                  </footer>
                </article>
              ))}
            </div>
          )}

          {section === "Effective access" && activeUser && (
            <Panel scroll>
              <Toolbar>
                <FilterSelect fit label="Review user" value={selected} onChange={setSelected} options={users.map(user => ({ id: user.id, label: `${user.name} · ${user.id}` }))} />
                <Chip variant="subtle" color={statusColor(activeUser.status)} className={statusPill(activeUser.status)}>{activeUser.status}</Chip>
              </Toolbar>
              <TableScroll>
              {activeUser.status === "Active" ? <Matrix role={roles.find(role => role.id === activeUser.roleId)!} /> : <EmptyNote title="Account access is inactive" detail={`This account cannot access the CRM while its status is ${activeUser.status.toLowerCase()}.`} />}
              </TableScroll>
            </Panel>
          )}

          {section === "Departments" && (
            <div className="grid min-h-0 flex-1 content-start grid-cols-1 gap-4 overflow-y-auto md:grid-cols-2 xl:grid-cols-3">
                {departments.map(department => (
                  <article key={department.name} className="flex flex-col gap-4 rounded-3xl border border-border-button-default bg-background-primary-default p-6">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-headline-medium text-text-primary">{department.name}</h3>
                      <p className="text-body-regular text-text-secondary">{department.description}</p>
                    </div>
                    <footer className="mt-auto flex items-center justify-between border-t border-separator-border pt-3">
                      <span className="text-caption-1-regular text-text-tertiary">{users.filter(user => user.department === department.name).length} employees</span>
                      <LinkButton onClick={() => { setError(""); setDepartmentForm(department.name); }}>Edit department</LinkButton>
                    </footer>
                  </article>
                ))}
            </div>
          )}

          {section === "Teams" && (
            <Panel scroll>
              <Toolbar>
                <SearchField aria-label="Search teams" placeholder="Search name, department or manager" value={query} onChange={setQuery} className="min-w-48 flex-1" fieldClassName="ur-field" />
                <FilterSelect label="Department" value={deptFilter} onChange={setDeptFilter} options={[{ id: "All departments", label: "All departments" }, ...departments.map(department => ({ id: department.name, label: department.name }))]} />
                <FilterSelect label="Reporting manager" value={managerFilter} onChange={setManagerFilter} options={managerOptions} />
              </Toolbar>
              <TableScroll>
                <Table className="ur-people" aria-label="Reporting relationships">
                  <TableHeader columns={reportColumns}>
                    {(column: BoardColumn) => <TableColumn isRowHeader={column.isRowHeader} className={column.id === "employee" ? "ur-avatar-head" : undefined}>{column.name}</TableColumn>}
                  </TableHeader>
                  <TableBody items={visibleTeams}>
                    {user => (
                      <TableRow columns={reportColumns}>
                        {(column: BoardColumn) => (
                          <TableCell>
                            {column.id === "employee" && <Person name={user.name} src={photoFor(user)} />}
                            {column.id === "department" && user.department}
                            {column.id === "team" && (user.team || "—")}
                            {column.id === "manager" && (managerName(user.manager) || "—")}
                            {column.id === "manage" && <LinkButton onClick={() => { setError(""); setEditUser(user); }}>Edit</LinkButton>}
                          </TableCell>
                        )}
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                {!visibleTeams.length && <EmptyNote title="No people found" detail="Try another name, department or reporting manager." onClear={() => { setQuery(""); setDeptFilter("All departments"); setManagerFilter("All managers"); }} />}
              </TableScroll>
            </Panel>
          )}

          {section === "Devices" && (
            <Panel scroll>
              <Toolbar>
                <SearchField aria-label="Search devices" placeholder="Search device, number or employee" value={query} onChange={setQuery} className="min-w-48 flex-1" fieldClassName="ur-field" />
                <FilterSelect label="Device status" value={deviceStatus} onChange={setDeviceStatus} options={["All statuses", "Pending approval", "Approved", "Revoked", "Deactivated"].map(status => ({ id: status, label: status }))} />
                <FilterSelect label="Employee" value={deviceEmployee} onChange={setDeviceEmployee} options={[{ id: "All employees", label: "All employees" }, ...users.map(user => ({ id: user.id, label: user.name }))]} />
              </Toolbar>
              <p className="shrink-0 border-b border-separator-border px-4 py-3 text-caption-1-regular text-text-tertiary">Only approved devices are eligible for access. Account status and assigned permissions still apply.</p>
              <TableScroll>
              <Table aria-label="Devices" onRowAction={key => setDeviceDetail(devices.find(device => device.id === String(key)) || null)}>
                <TableHeader columns={deviceColumns}>
                  {(column: BoardColumn) => <TableColumn isRowHeader={column.isRowHeader} className={column.id === "employee" ? "ur-avatar-head" : undefined}>{column.name}</TableColumn>}
                </TableHeader>
                <TableBody items={visibleDevices}>
                  {device => {
                    const employee = users.find(user => user.id === device.userId);
                    return (
                      <TableRow columns={deviceColumns} className={rowClass}>
                        {(column: BoardColumn) => (
                          <TableCell>
                            {column.id === "device" && <><span className="block text-body-medium">{device.name}</span><span className="block text-caption-1-regular text-text-tertiary">{device.model} · {device.id}</span></>}
                            {column.id === "employee" && (employee ? <Person name={employee.name} src={photoFor(employee)} /> : "Removed employee")}
                            {column.id === "software" && <><span className="block">{device.os}</span><span className="block text-caption-1-regular text-text-tertiary">App {device.app}</span></>}
                            {column.id === "sync" && device.synced}
                            {column.id === "status" && <Chip variant="subtle" color={statusColor(device.status)} className={statusPill(device.status)}>{device.status}</Chip>}
                            {column.id === "manage" && (
                              <span className="flex flex-wrap gap-2">
                                {device.status === "Pending approval" && <LinkButton onClick={event => { event.stopPropagation(); ask({ title: "Approve device?", description: `${device.name} · ${device.id}. Device history will be preserved.`, apply: entryReason => { setDevices(list => list.map(item => item.id === device.id ? { ...item, status: "Approved" } : item)); log("Device status changed", device.id, device.status, "Approved", entryReason); } }); }}>Approve</LinkButton>}
                                {device.status === "Approved" && <LinkButton onClick={event => { event.stopPropagation(); ask({ title: "Revoke device?", description: `${device.name} · ${device.id}. Device history will be preserved.`, apply: entryReason => { setDevices(list => list.map(item => item.id === device.id ? { ...item, status: "Revoked" } : item)); setDeviceDetail(current => current && current.id === device.id ? { ...current, status: "Revoked" } : current); log("Device status changed", device.id, device.status, "Revoked", entryReason); } }); }}>Revoke</LinkButton>}
                                {device.status !== "Deactivated" && device.status !== "Revoked" && <LinkButton variant="secondary" onClick={event => { event.stopPropagation(); ask({ title: "Deactivate device?", description: `${device.name} · ${device.id}. Device history will be preserved.`, apply: entryReason => { setDevices(list => list.map(item => item.id === device.id ? { ...item, status: "Deactivated" } : item)); setDeviceDetail(current => current && current.id === device.id ? { ...current, status: "Deactivated" } : current); log("Device status changed", device.id, device.status, "Deactivated", entryReason); } }); }}>Deactivate</LinkButton>}
                              </span>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  }}
                </TableBody>
              </Table>
              {!visibleDevices.length && <EmptyNote title="No devices found" detail="Try another employee, device or status." />}
              </TableScroll>
            </Panel>
          )}

          {section === "Audit history" && (
            <Panel scroll>
              <Toolbar>
                <SearchField aria-label="Search audit history" placeholder="Search person, change or record" value={query} onChange={setQuery} className="min-w-48 flex-1" fieldClassName="ur-field" />
                <FilterSelect fit label="Change" value={auditAction} onChange={setAuditAction} options={[{ id: "All actions", label: "All changes" }, ...Array.from(new Set(audit.map(entry => entry.action))).map(action => ({ id: action, label: action }))]} />
                <FilterSelect fit label="Changed by" value={auditActor} onChange={setAuditActor} options={[{ id: "Anyone", label: "Anyone" }, ...Array.from(new Set(audit.map(entry => entry.actor))).map(actor => ({ id: actor, label: actor }))]} />
                <span className="ms-auto flex shrink-0 gap-2">
                  <Button variant="secondary" size="small" leadingIcon={RiFileExcel2Line} onClick={() => exportExcel(visibleAudit)}>Excel</Button>
                  <Button variant="secondary" size="small" leadingIcon={RiFilePdf2Line} onClick={() => exportPdf(visibleAudit)}>PDF</Button>
                </span>
              </Toolbar>
              <TableScroll>
              <Table aria-label="Audit history">
                <TableHeader columns={auditColumnDefs}>
                  {(column: BoardColumn) => <TableColumn isRowHeader={column.isRowHeader}>{column.name}</TableColumn>}
                </TableHeader>
                <TableBody items={visibleAudit}>
                  {entry => (
                    <TableRow columns={auditColumnDefs}>
                      {(column: BoardColumn) => (
                        <TableCell>
                          {column.id === "When" && entry.date}
                          {column.id === "Actor" && entry.actor}
                          {column.id === "Action" && entry.action}
                          {column.id === "Record" && entry.target}
                          {column.id === "Before" && entry.before}
                          {column.id === "After" && entry.after}
                          {column.id === "Reason" && entry.reason}
                        </TableCell>
                      )}
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {!visibleAudit.length && <EmptyNote title="No matching activity" detail="Try another person, change or record." />}
              </TableScroll>
            </Panel>
          )}
        </div>

        {detail && (
          <Modal className="ur-dialog ur-person" isOpen onOpenChange={open => { if (!open) setDetail(null); }} size="md">
            <ModalHeader title={
              <span className="ur-person-id">
                <Avatar size="lg" src={photoFor(detail)} alt="" initials={initials(detail.name)} color={avatarColor(detail.name)} className="ur-person-avatar size-14 shrink-0" />
                <span className="flex min-w-0 flex-col items-start gap-1">
                  <span className="ur-person-name">{detail.name}</span>
                  <Chip variant="subtle" color={statusColor(detail.status)} className={cx("ur-person-status w-fit", statusPill(detail.status))}>{detail.status}</Chip>
                </span>
              </span>
            } />
            <ModalBody>
              <div className="flex flex-col gap-4">
                {!!userHistory.length && <div className="flex flex-col items-center gap-1 text-center">{userHistory.map(entry => <p key={entry.id} className="text-caption-1-regular text-text-secondary">{entry.date} · {entry.action}</p>)}</div>}
                <Facts ruled rows={[["Employee ID", detail.id], ["Email", detail.email], ["Mobile", detail.mobile || "—"], ["CRM role", roleName(detail.roleId)], ["Department", detail.department], ["Designation", detail.designation], ["Reporting manager", users.find(user => user.id === detail.manager)?.name || "—"], ["Team", detail.team || "—"], ["Assigned brand", detail.brand || "—"], ["Last login", detail.lastLogin]]} />
                {!!userDevices.length && <p className="text-body-regular text-text-secondary"><span className="text-body-medium text-text-primary">Devices </span>{userDevices.map(device => `${device.name} (${device.status})`).join(", ")}</p>}
              </div>
            </ModalBody>
            <ModalFooter className="gap-3 sm:justify-center">
              <ActionIcon label="Access" icon={RiShieldCheckLine} onClick={() => { setSelected(detail.id); setDetail(null); router.push("/library/modules/roles?view=Effective%20access"); }} />
              <ActionIcon label="Edit" icon={RiPencilLine} onClick={() => { setEditUser(detail); setDetail(null); }} />
              <ActionIcon label="Delete" icon={RiDeleteBinLine} danger onClick={() => ask({ title: `Delete ${detail.name}?`, description: "This removes the employee from the review list. Sample history is kept.", apply: entryReason => { setUsers(list => list.filter(user => user.id !== detail.id)); setDetail(null); log("User deleted", detail.name, detail.status, "Deleted", entryReason); } })} />
              {detail.status !== "Active" && <ActionIcon label="Activate" icon={RiCheckboxCircleLine} onClick={() => changeStatus(detail, "Active")} />}
              {detail.status === "Active" && <ActionIcon label="Suspend" icon={RiPauseCircleLine} onClick={() => changeStatus(detail, "Temporarily Suspended")} />}
              {detail.status !== "Deactivated" && <ActionIcon label="Deactivate" icon={RiUserForbidLine} danger onClick={() => changeStatus(detail, "Deactivated")} />}
            </ModalFooter>
          </Modal>
        )}

        {editUser && (
          <Modal className="ur-dialog" isOpen onOpenChange={open => { if (!open) setEditUser(null); }} size="lg">
            <ModalHeader title={editUser.created ? "Edit user" : "Add user"} description="Assign an approved role and reporting relationship." />
            <ModalBody>
              <form id="user-form" className="grid grid-cols-2 gap-3" onSubmit={saveUser}>
                <div className="col-span-2 flex items-center gap-3">
                  <Avatar size="lg" src={editUser.avatar || (editUser.name ? portraitFor(editUser.name) : undefined)} alt="" initials={initials(editUser.name || "NA")} color={avatarColor(editUser.name || "NA")} className="size-14" />
                  <label className="inline-flex cursor-pointer items-center rounded-full border border-border-button-default bg-background-primary-default px-3 py-1.5 text-body-2-medium text-text-primary">
                    Upload photo
                    <input type="file" accept="image/*" className="sr-only" onChange={event => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (!file) return;
                      if (!file.type.startsWith("image/")) { setError("Choose an image file."); return; }
                      readPhoto(file).then(avatar => { setEditUser(current => current ? { ...current, avatar } : current); setError(""); }).catch(() => setError("Choose an image file."));
                    }} />
                  </label>
                </div>
                <Input label="Employee ID" name="id" defaultValue={editUser.id} isRequired isReadOnly={!!editUser.created} maxLength={120} />
                <Input label="Full name" name="name" defaultValue={editUser.name} isRequired maxLength={120} />
                <Input label="Work email" name="email" type="email" defaultValue={editUser.email} isRequired maxLength={120} inputDir="ltr" />
                <Input label="Mobile number" name="mobile" defaultValue={editUser.mobile} isRequired maxLength={120} />
                <Input label="Designation" name="designation" defaultValue={editUser.designation} isRequired maxLength={120} />
                <Input label="Team" name="team" defaultValue={editUser.team} maxLength={120} />
                <Select label="Department" name="department" defaultSelectedKey={editUser.department} className="gap-1.5" triggerClassName="w-full" popoverClassName="w-(--trigger-width)">
                  {departments.map(department => <SelectItem key={department.name} id={department.name} textValue={department.name}>{department.name}</SelectItem>)}
                </Select>
                <Select label="Assigned CRM role" name="roleId" defaultSelectedKey={editUser.roleId} className="gap-1.5" triggerClassName="w-full" popoverClassName="w-(--trigger-width)">
                  {roles.map(role => <SelectItem key={role.id} id={role.id} textValue={role.name}>{role.name}</SelectItem>)}
                </Select>
                <Select label="Reporting manager" name="manager" defaultSelectedKey={editUser.manager || "none"} className="gap-1.5" triggerClassName="w-full" popoverClassName="w-(--trigger-width)">
                  <SelectItem id="none" textValue="No reporting manager">No reporting manager</SelectItem>
                  {users.filter(user => user.id !== editUser.id && user.status === "Active").map(user => <SelectItem key={user.id} id={user.id} textValue={user.name}>{user.name}</SelectItem>)}
                </Select>
                <Input label="Assigned brand" name="brand" defaultValue={editUser.brand} maxLength={120} />
                <input type="hidden" name="status" value={editUser.status} />
                <Textarea className="col-span-2" label="Reason for change" name="reason" isRequired placeholder="For example, approved employee onboarding" maxLength={400} rows={2} />
                {error && <p role="alert" className="col-span-2 text-body-regular text-text-error-primary">{error}</p>}
              </form>
            </ModalBody>
            <ModalFooter>
              <Button variant="secondary" onClick={() => setEditUser(null)}>Cancel</Button>
              <Button type="submit" form="user-form">{editUser.created ? "Save changes" : "Create user"}</Button>
            </ModalFooter>
          </Modal>
        )}

        {roleDetail && (
          <Modal className="ur-dialog" isOpen onOpenChange={open => { if (!open) setRoleDetail(null); }} size="wide">
            <ModalHeader title={roleDetail.name} description={roleDetail.description} />
            <ModalBody>
              <div className="flex flex-col gap-4">
                <Matrix role={roleDetail} />
                <div className="flex flex-col gap-1">
                  <h3 className="text-headline-medium text-text-primary">Assigned users</h3>
                  <p className="text-body-regular text-text-secondary">{users.filter(user => user.roleId === roleDetail.id).map(user => user.name).join(", ") || "No users assigned."}</p>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button onClick={() => { setEditRole(structuredClone(roleDetail)); setRoleDetail(null); }}>Edit role</Button>
            </ModalFooter>
          </Modal>
        )}

        {editRole && (
          <Modal className="ur-dialog" isOpen onOpenChange={open => { if (!open) setEditRole(null); }} size="lg">
            <ModalHeader title={editRole.id ? "Edit role" : "Create role"} description="Choose each action explicitly. View permission does not grant editing, approvals or exports." />
            <ModalBody>
              <form id="role-form" className="flex flex-col gap-4" onSubmit={event => {
                event.preventDefault();
                if (roles.some(role => role.id !== editRole.id && role.name.toLowerCase() === editRole.name.trim().toLowerCase())) {
                  setError("A role with this name already exists.");
                  return;
                }
                const updated = { ...editRole, id: editRole.id || `custom-${Date.now()}` };
                ask({
                  title: "Apply role permissions?",
                  description: `This changes access for ${users.filter(user => user.roleId === updated.id).length} assigned users. Unselected actions remain unavailable.`,
                  apply: entryReason => {
                    const before = roles.find(role => role.id === updated.id);
                    setRoles(list => before ? list.map(role => role.id === updated.id ? updated : role) : [...list, updated]);
                    log(before ? "Role updated" : "Role created", updated.name, before ? JSON.stringify(before.grants) : "No access", JSON.stringify(updated.grants), entryReason);
                    setEditRole(null);
                    setError("");
                  },
                });
              }}>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Role name" value={editRole.name} maxLength={70} isRequired onChange={value => setEditRole({ ...editRole, name: value })} />
                  <Input label="Description" value={editRole.description} maxLength={160} isRequired onChange={value => setEditRole({ ...editRole, description: value })} />
                </div>
                <div className="overflow-hidden rounded-xl border border-separator-border">
                  {modules.map(moduleName => {
                    const grant = editRole.grants.find(item => item.module === moduleName);
                    return (
                      <details key={moduleName} className="border-b border-separator-border px-4 py-3 last:border-b-0">
                        <summary className="flex cursor-pointer items-center justify-between text-body-medium text-text-primary">
                          {moduleName}
                          <span className="text-caption-1-regular text-text-tertiary">{grant?.actions.length || 0} actions</span>
                        </summary>
                        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                          {actions.map(action => (
                            <Checkbox key={action} size="sm" isSelected={!!grant?.actions.includes(action)} onChange={checked => {
                              const next = grant ? { ...grant, actions: checked ? [...grant.actions, action] : grant.actions.filter(item => item !== action) } : { module: moduleName, scope: "Own records", actions: [action] };
                              setEditRole({ ...editRole, grants: [...editRole.grants.filter(item => item.module !== moduleName), next].filter(item => item.actions.length) });
                            }}>{action}</Checkbox>
                          ))}
                        </div>
                        {grant && (
                          <Select aria-label={`${moduleName} data scope`} selectedKey={grant.scope} onSelectionChange={key => setEditRole({ ...editRole, grants: editRole.grants.map(item => item.module === moduleName ? { ...item, scope: String(key) } : item) })} className="mt-3 w-full" triggerClassName="w-full" popoverClassName="w-(--trigger-width)">
                            {Array.from(new Set([grant.scope, "Own records", "Own team", "Department", "Assigned brand", "Organization"])).map(scope => <SelectItem key={scope} id={scope} textValue={scope}>{scope}</SelectItem>)}
                          </Select>
                        )}
                      </details>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-4">
                  <Checkbox isSelected={editRole.protectedView} onChange={checked => setEditRole({ ...editRole, protectedView: checked })}>View protected fields</Checkbox>
                  <Checkbox isSelected={editRole.protectedEdit} onChange={checked => setEditRole({ ...editRole, protectedEdit: checked })}>Edit protected fields</Checkbox>
                </div>
                {error && <p role="alert" className="text-body-regular text-text-error-primary">{error}</p>}
              </form>
            </ModalBody>
            <ModalFooter>
              <Button variant="secondary" onClick={() => setEditRole(null)}>Cancel</Button>
              <Button type="submit" form="role-form">Review changes</Button>
            </ModalFooter>
          </Modal>
        )}

        {departmentForm !== null && (
          <Modal className="ur-dialog" isOpen onOpenChange={open => { if (!open) setDepartmentForm(null); }} size="md">
            <ModalHeader title={departmentForm ? "Edit department" : "Add department"} />
            <ModalBody>
              <form id="department-form" className="flex flex-col gap-3" onSubmit={event => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                const name = String(form.get("name")).trim();
                const description = String(form.get("description"));
                if (departments.some(department => department.name !== departmentForm && department.name.toLowerCase() === name.toLowerCase())) {
                  setError("Department already exists.");
                  return;
                }
                setDepartments(list => departmentForm ? list.map(department => department.name === departmentForm ? { name, description } : department) : [...list, { name, description }]);
                if (departmentForm) setUsers(list => list.map(user => user.department === departmentForm ? { ...user, department: name } : user));
                log("Department saved", name, departmentForm || "—", description, String(form.get("reason")));
                setDepartmentForm(null);
                setError("");
              }}>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Department name" name="name" defaultValue={departmentForm} isRequired />
                  <Input label="Description" name="description" defaultValue={departments.find(department => department.name === departmentForm)?.description} isRequired />
                </div>
                <Textarea label="Reason" name="reason" isRequired rows={2} />
                {error && <p role="alert" className="text-body-regular text-text-error-primary">{error}</p>}
              </form>
            </ModalBody>
            <ModalFooter>
              <Button variant="secondary" onClick={() => setDepartmentForm(null)}>Cancel</Button>
              <Button type="submit" form="department-form">Save department</Button>
            </ModalFooter>
          </Modal>
        )}

        {deviceForm && (
          <Modal className="ur-dialog" isOpen onOpenChange={open => { if (!open) setDeviceForm(null); }} size="lg">
            <ModalHeader title={deviceForm.originalId ? "Edit device" : "Register employee device"} />
            <ModalBody>
              <form id="device-form" className="flex flex-col gap-3" onSubmit={saveDevice}>
                <div className="grid grid-cols-2 gap-3">
                  <Select label="Employee" name="userId" defaultSelectedKey={deviceForm.userId} className="gap-1.5" triggerClassName="w-full" popoverClassName="w-(--trigger-width)">
                    {users.map(user => <SelectItem key={user.id} id={user.id} textValue={user.name}>{user.name}</SelectItem>)}
                  </Select>
                  <Input label="Device name" name="name" defaultValue={deviceForm.name} isRequired maxLength={80} />
                </div>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <Input label="Device model" name="model" defaultValue={deviceForm.model} isRequired maxLength={80} />
                  <Input label="Device number" name="id" defaultValue={deviceForm.id} isRequired maxLength={40} />
                  <Input label="OS version" name="os" defaultValue={deviceForm.os} isRequired maxLength={40} />
                  <Input label="App version" name="app" defaultValue={deviceForm.app} isRequired maxLength={20} />
                </div>
                {error && <p role="alert" className="text-body-regular text-text-error-primary">{error}</p>}
              </form>
            </ModalBody>
            <ModalFooter>
              <Button variant="secondary" onClick={() => setDeviceForm(null)}>Cancel</Button>
              <Button type="submit" form="device-form">{deviceForm.originalId ? "Save device" : "Register device"}</Button>
            </ModalFooter>
          </Modal>
        )}

        {deviceDetail && (
          <Modal className="ur-dialog" isOpen onOpenChange={open => { if (!open) setDeviceDetail(null); }} size="lg">
            <ModalHeader title={users.find(user => user.id === deviceDetail.userId)?.name || deviceDetail.name} />
            <ModalBody>
              <div className="flex flex-col gap-4">
                <Chip variant="subtle" color={statusColor(deviceDetail.status)} className={cx("w-fit", statusPill(deviceDetail.status))}>{deviceDetail.status}</Chip>
                <Facts rows={[["Employee", users.find(user => user.id === deviceDetail.userId)?.name || "Removed employee"], ["Employee ID", deviceDetail.userId], ["Device name", deviceDetail.name], ["Device number", deviceDetail.id], ["Device model", deviceDetail.model], ["OS version", deviceDetail.os], ["App version", deviceDetail.app], ["Registered", deviceDetail.registered], ["Last sync", deviceDetail.synced]]} />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="secondary" onClick={() => { setError(""); setDeviceForm({ ...deviceDetail, originalId: deviceDetail.id }); setDeviceDetail(null); }}>Edit</Button>
              <Button variant="danger" onClick={() => ask({ title: `Delete ${deviceDetail.name}?`, description: "This removes the device from the review list.", apply: entryReason => { setDevices(list => list.filter(device => device.id !== deviceDetail.id)); setDeviceDetail(null); log("Device deleted", deviceDetail.id, deviceDetail.status, "Deleted", entryReason); } })}>Delete</Button>
              {deviceDetail.status === "Pending approval" && <Button onClick={() => ask({ title: "Approve device?", description: `${deviceDetail.name} · ${deviceDetail.id}. Device history will be preserved.`, apply: entryReason => { setDevices(list => list.map(item => item.id === deviceDetail.id ? { ...item, status: "Approved" } : item)); setDeviceDetail({ ...deviceDetail, status: "Approved" }); log("Device status changed", deviceDetail.id, deviceDetail.status, "Approved", entryReason); } })}>Approve</Button>}
              {deviceDetail.status === "Approved" && <Button variant="secondary" onClick={() => ask({ title: "Revoke device?", description: `${deviceDetail.name} · ${deviceDetail.id}. Device history will be preserved.`, apply: entryReason => { setDevices(list => list.map(item => item.id === deviceDetail.id ? { ...item, status: "Revoked" } : item)); setDeviceDetail({ ...deviceDetail, status: "Revoked" }); log("Device status changed", deviceDetail.id, deviceDetail.status, "Revoked", entryReason); } })}>Revoke</Button>}
              {deviceDetail.status !== "Deactivated" && deviceDetail.status !== "Revoked" && <Button variant="danger" onClick={() => ask({ title: "Deactivate device?", description: `${deviceDetail.name} · ${deviceDetail.id}. Device history will be preserved.`, apply: entryReason => { setDevices(list => list.map(item => item.id === deviceDetail.id ? { ...item, status: "Deactivated" } : item)); setDeviceDetail({ ...deviceDetail, status: "Deactivated" }); log("Device status changed", deviceDetail.id, deviceDetail.status, "Deactivated", entryReason); } })}>Deactivate</Button>}
            </ModalFooter>
          </Modal>
        )}

        {confirm && (
          <AlertDialog
            isOpen
            onOpenChange={open => { if (!open) setConfirm(null); }}
            size="md"
            variant="default"
            icon={false}
            title={confirm.title}
            description={confirm.description}
            confirmLabel="Confirm change"
            isConfirmDisabled={!reason.trim()}
            onConfirm={() => confirm.apply(reason.trim())}
          >
            <Textarea label="Reason" value={reason} onChange={setReason} rows={2} isRequired />
          </AlertDialog>
        )}
      </ReviewShell>
    </DirectionProvider>
  );
}
