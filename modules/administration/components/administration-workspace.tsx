"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { RiAddLine, RiArrowRightSLine, RiCheckLine, RiMore2Line, RiRefreshLine, RiSettings3Line } from "@remixicon/react";
import { ReviewShell } from "@/modules/screen-library/components/review-shell";
import { DirectionProvider } from "@/components/foundations/direction/direction";
import { Button } from "@/components/base/buttons/button";
import { IconButton } from "@/components/base/buttons/icon-button";
import { Chip, type ChipColor } from "@/components/base/badges/chip";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Dropdown, DropdownItem, DropdownPopover, DropdownTrigger } from "@/components/base/dropdown/dropdown";
import { Input } from "@/components/base/input/input";
import { AlertDialog, Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/base/modal/modal";
import { SearchField } from "@/components/base/search-field/search-field";
import { Select, SelectItem } from "@/components/base/select/select";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@/components/base/table/table";
import { cx } from "@/utils/cx";
import "./administration.css";

type Key = "Overview" | "Users & Accounts" | "Roles & Permissions" | "Departments & Hierarchy" | "Brand Administration" | "Franchise Models & Pricing" | "System Configuration" | "Integrations" | "Infrastructure & Database" | "Security & Devices" | "Backup & Recovery" | "Versions & Deployments" | "Audit Logs";
type RecordRow = { id: string; [key: string]: string };
type Column = { id: string; name: string; isRowHeader?: boolean };
type Screen = { description: string; columns: Column[]; fields: string[]; access: string[]; add?: string; supportsDeactivate?: boolean };

const groups: { title: string; pages: Key[] }[] = [
  { title: "Workspace", pages: ["Overview"] },
  { title: "People & access", pages: ["Users & Accounts", "Roles & Permissions", "Departments & Hierarchy"] },
  { title: "Business setup", pages: ["Brand Administration", "Franchise Models & Pricing", "System Configuration"] },
  { title: "Operations & security", pages: ["Integrations", "Infrastructure & Database", "Security & Devices", "Backup & Recovery", "Versions & Deployments", "Audit Logs"] },
];
const profiles = ["IT Administrator", "CEO / Super Admin", "Finance", "HR", "Marketing"] as const;
type Profile = (typeof profiles)[number];
const people = ["Aarav Mehta", "Maya Reddy", "Rohan Kapoor", "Neha Sharma", "Sana Khan"];
const permissionActions = ["View", "Create", "Edit", "Delete", "Assign", "Approve", "Verify", "Export", "Configure", "Administer"];

const screens: Record<Exclude<Key, "Overview">, Screen> = {
  "Users & Accounts": { description: "Manage employee accounts, assignments and access history.", add: "Add employee", access: ["IT Administrator", "CEO / Super Admin", "HR"], supportsDeactivate: true, fields: ["Employee ID", "Employee name", "Email", "Mobile", "Department", "Designation", "Reporting manager", "Assigned role", "Status", "Last login"], columns: [{ id: "Employee name", name: "Employee", isRowHeader: true }, { id: "Employee ID", name: "Employee ID" }, { id: "Department", name: "Department" }, { id: "Assigned role", name: "Assigned role" }, { id: "Status", name: "Status" }, { id: "Last login", name: "Last login" }] },
  "Roles & Permissions": { description: "Review role boundaries and module level access.", add: "Create role", access: ["IT Administrator", "CEO / Super Admin"], fields: ["Role name", "Description", "Scope", "Assigned users", "Permissions", "Status"], columns: [{ id: "Role name", name: "Role", isRowHeader: true }, { id: "Scope", name: "Scope" }, { id: "Assigned users", name: "Assigned users" }, { id: "Permissions", name: "Permission set" }, { id: "Status", name: "Status" }] },
  "Departments & Hierarchy": { description: "Maintain teams, reporting lines and hierarchy history.", add: "Add department", access: ["IT Administrator", "CEO / Super Admin", "HR"], fields: ["Department", "Team", "Department head", "Employees", "Reporting line", "Status"], columns: [{ id: "Department", name: "Department", isRowHeader: true }, { id: "Team", name: "Teams" }, { id: "Department head", name: "Department head" }, { id: "Employees", name: "Employees" }, { id: "Reporting line", name: "Reports to" }, { id: "Status", name: "Status" }] },
  "Brand Administration": { description: "Manage brand profiles, contacts and portal settings.", add: "Add brand", access: ["IT Administrator", "CEO / Super Admin"], supportsDeactivate: true, fields: ["Brand ID", "Brand name", "Logo file", "Description", "Primary contact", "Contact email", "Contact number", "Address", "Portal", "Status"], columns: [{ id: "Brand name", name: "Brand", isRowHeader: true }, { id: "Brand ID", name: "Brand ID" }, { id: "Primary contact", name: "Primary contact" }, { id: "Contact email", name: "Email" }, { id: "Portal", name: "Portal" }, { id: "Status", name: "Status" }] },
  "Franchise Models & Pricing": { description: "Review model pricing versions and Finance approvals.", add: "Add model", access: ["IT Administrator", "CEO / Super Admin", "Finance"], supportsDeactivate: true, fields: ["Model", "Brand", "Investment range", "Franchise fee", "GST", "Effective date", "Finance approval", "Modified by", "Status"], columns: [{ id: "Model", name: "Model", isRowHeader: true }, { id: "Brand", name: "Brand" }, { id: "Investment range", name: "Investment range" }, { id: "Franchise fee", name: "Franchise fee" }, { id: "Effective date", name: "Effective from" }, { id: "Finance approval", name: "Finance approval" }, { id: "Status", name: "Status" }] },
  "System Configuration": { description: "Control organization settings and approved feature availability.", add: "Add setting", access: ["IT Administrator", "CEO / Super Admin"], fields: ["Setting", "Area", "Current value", "Environment", "Last changed", "Changed by", "Status"], columns: [{ id: "Setting", name: "Setting", isRowHeader: true }, { id: "Area", name: "Area" }, { id: "Current value", name: "Value" }, { id: "Environment", name: "Environment" }, { id: "Last changed", name: "Last changed" }, { id: "Status", name: "Status" }] },
  "Integrations": { description: "Monitor configured services, sync activity and supported retries.", add: "Configure integration", access: ["IT Administrator", "CEO / Super Admin", "Marketing"], fields: ["Integration", "Provider", "Connection", "Last successful sync", "Last failure", "Sync status", "Configuration"], columns: [{ id: "Integration", name: "Integration", isRowHeader: true }, { id: "Provider", name: "Provider" }, { id: "Connection", name: "Connection" }, { id: "Last successful sync", name: "Last successful sync" }, { id: "Last failure", name: "Last failure" }, { id: "Sync status", name: "Sync status" }] },
  "Infrastructure & Database": { description: "Read system health and technical incidents at a glance.", access: ["IT Administrator", "CEO / Super Admin"], fields: ["Service", "Type", "Health", "Availability", "Response", "Last incident", "Environment"], columns: [{ id: "Service", name: "Service", isRowHeader: true }, { id: "Type", name: "Area" }, { id: "Health", name: "Health" }, { id: "Availability", name: "Availability" }, { id: "Response", name: "Response" }, { id: "Last incident", name: "Last incident" }] },
  "Security & Devices": { description: "Review access events, active sessions and approved employee devices.", add: "Register device", access: ["IT Administrator", "CEO / Super Admin", "HR"], supportsDeactivate: true, fields: ["Device reference", "Employee", "Device model", "OS version", "App version", "Registration date", "Last synchronization", "Status"], columns: [{ id: "Device reference", name: "Device", isRowHeader: true }, { id: "Employee", name: "Employee" }, { id: "Device model", name: "Model" }, { id: "App version", name: "App version" }, { id: "Last synchronization", name: "Last sync" }, { id: "Status", name: "Status" }] },
  "Backup & Recovery": { description: "Verify completion, retention and recovery records.", add: "Schedule backup", access: ["IT Administrator", "CEO / Super Admin"], fields: ["Backup reference", "Type", "Started", "Completed", "Verification", "Retention", "RPO / RTO", "Status"], columns: [{ id: "Backup reference", name: "Backup", isRowHeader: true }, { id: "Type", name: "Type" }, { id: "Completed", name: "Completed" }, { id: "Verification", name: "Verification" }, { id: "Retention", name: "Retention" }, { id: "Status", name: "Status" }] },
  "Versions & Deployments": { description: "Track releases, rollout status and rollback history.", add: "Record deployment", access: ["IT Administrator", "CEO / Super Admin"], fields: ["Release", "Platform", "Version", "Environment", "Deployed at", "Deployed by", "Rollback", "Status"], columns: [{ id: "Release", name: "Release", isRowHeader: true }, { id: "Platform", name: "Platform" }, { id: "Version", name: "Version" }, { id: "Environment", name: "Environment" }, { id: "Deployed at", name: "Deployed at" }, { id: "Rollback", name: "Rollback" }, { id: "Status", name: "Status" }] },
  "Audit Logs": { description: "Read-only history of administrative and security changes.", access: ["IT Administrator", "CEO / Super Admin", "Finance", "HR", "Marketing"], fields: ["Action", "Actor", "Module", "Resource", "Previous value", "New value", "Date and time", "IP / Device", "Result"], columns: [{ id: "Action", name: "Action", isRowHeader: true }, { id: "Actor", name: "Changed by" }, { id: "Module", name: "Module" }, { id: "Resource", name: "Resource" }, { id: "Date and time", name: "Date & time" }, { id: "Result", name: "Result" }] },
};

const seeds: Record<Exclude<Key, "Overview">, RecordRow[]> = {
  "Users & Accounts": [
    { id: "IF2026001", "Employee ID": "IF2026001", "Employee name": "Aarav Mehta", Email: "aarav.mehta@ifranchise.in", Mobile: "+91 98765 10234", Department: "IT", Designation: "Systems Administrator", "Reporting manager": "Kavita Rao", "Assigned role": "IT Administrator", Status: "Active", "Last login": "Today, 10:24 am" },
    { id: "IF2026002", "Employee ID": "IF2026002", "Employee name": "Maya Reddy", Email: "maya.reddy@ifranchise.in", Mobile: "+91 98470 11201", Department: "Sales", Designation: "Regional Manager", "Reporting manager": "Kavita Rao", "Assigned role": "Sales Manager", Status: "Active", "Last login": "Yesterday, 4:18 pm" },
    { id: "IF2026003", "Employee ID": "IF2026003", "Employee name": "Rohan Kapoor", Email: "rohan.kapoor@ifranchise.in", Mobile: "+91 98470 11007", Department: "Finance", Designation: "Finance Controller", "Reporting manager": "Amit Shah", "Assigned role": "Finance", Status: "Active", "Last login": "Today, 9:02 am" },
    { id: "IF2026004", "Employee ID": "IF2026004", "Employee name": "Neha Sharma", Email: "neha.sharma@ifranchise.in", Mobile: "+91 98470 11773", Department: "HR", Designation: "People Operations", "Reporting manager": "Amit Shah", "Assigned role": "HR", Status: "Deactivated", "Last login": "12 Nov 2026" },
    { id: "IF2026005", "Employee ID": "IF2026005", "Employee name": "Sana Khan", Email: "sana.khan@ifranchise.in", Mobile: "+91 98470 11308", Department: "Marketing", Designation: "Growth Manager", "Reporting manager": "Kavita Rao", "Assigned role": "Marketing", Status: "Active", "Last login": "Today, 8:41 am" },
  ],
  "Roles & Permissions": [
    { id: "ROLE-IT", "Role name": "IT Administrator", Description: "Technical operations and approved configuration", Scope: "Technical systems", "Assigned users": "4 users", Permissions: "View · Configure · Administer", Status: "Active" },
    { id: "ROLE-SALES", "Role name": "Sales Manager", Description: "Team sales workflows", Scope: "Sales records", "Assigned users": "12 users", Permissions: "View · Assign · Approve · Export", Status: "Active" },
    { id: "ROLE-FIN", "Role name": "Finance", Description: "Financial configuration and verification", Scope: "Finance records", "Assigned users": "5 users", Permissions: "View · Edit · Approve · Verify", Status: "Active" },
    { id: "ROLE-HR", "Role name": "HR", Description: "Employee information", Scope: "People records", "Assigned users": "3 users", Permissions: "View · Create · Edit", Status: "Active" },
    { id: "ROLE-MKT", "Role name": "Marketing", Description: "Approved marketing integrations", Scope: "Marketing tools", "Assigned users": "4 users", Permissions: "View · Configure", Status: "Active" },
  ],
  "Departments & Hierarchy": ["Sales|Regional Sales|Maya Reddy|18|Leadership|Active", "Marketing|Growth & campaigns|Sana Khan|4|Leadership|Active", "MIS / Operations|CRM operations|Dev Iyer|6|Leadership|Active", "Finance|Accounts & verification|Rohan Kapoor|5|Leadership|Active", "Leadership|Executive office|Amit Shah|3|Board|Active", "IT|Systems & support|Aarav Mehta|4|Leadership|Active", "HR|People operations|Neha Sharma|3|Leadership|Active", "Brands|Brand relations|Zoya Thomas|8|Leadership|Active"].map((str, i) => { const [Department, Team, head, Employees, Reports, Status] = str.split("|"); return { id: `DEPT-${i + 1}`, Department, Team, "Department head": head, Employees, "Reporting line": Reports, Status }; }),
  "Brand Administration": [
    { id: "BR-001", "Brand ID": "BR-001", "Brand name": "Brew Theory", Description: "Specialty coffee and café franchise", "Primary contact": "Ananya Rao", "Contact email": "partners@brewtheory.in", "Contact number": "+91 80 4455 1100", Address: "Bengaluru, Karnataka", Portal: "Enabled", Status: "Active" },
    { id: "BR-002", "Brand ID": "BR-002", "Brand name": "FitForge", Description: "Fitness studio network", "Primary contact": "Rahul Nair", "Contact email": "franchise@fitforge.in", "Contact number": "+91 80 4455 1200", Address: "Kochi, Kerala", Portal: "Enabled", Status: "Active" },
    { id: "BR-003", "Brand ID": "BR-003", "Brand name": "Daily Bowl", Description: "Quick service dining", "Primary contact": "Mira Joseph", "Contact email": "growth@dailybowl.in", "Contact number": "+91 22 4455 1300", Address: "Mumbai, Maharashtra", Portal: "Enabled", Status: "Active" },
    { id: "BR-004", "Brand ID": "BR-004", "Brand name": "Little Campus", Description: "Early learning centers", "Primary contact": "Pranav Das", "Contact email": "hello@littlecampus.in", "Contact number": "+91 33 4455 1400", Address: "Kolkata, West Bengal", Portal: "Paused", Status: "Inactive" },
  ],
  "Franchise Models & Pricing": [
    { id: "MOD-101", Model: "Café Express", Brand: "Brew Theory", "Investment range": "₹50L–₹1Cr", "Franchise fee": "₹12L + GST", GST: "18%", "Effective date": "01 Oct 2026", "Finance approval": "Approved · v3", "Modified by": "Rohan Kapoor", Status: "Active" },
    { id: "MOD-102", Model: "Flagship Café", Brand: "Brew Theory", "Investment range": "₹1Cr–₹2Cr", "Franchise fee": "₹20L + GST", GST: "18%", "Effective date": "15 Sep 2026", "Finance approval": "Approved · v2", "Modified by": "Rohan Kapoor", Status: "Active" },
    { id: "MOD-203", Model: "Studio Plus", Brand: "FitForge", "Investment range": "₹75L–₹1.5Cr", "Franchise fee": "₹15L + GST", GST: "18%", "Effective date": "01 Aug 2026", "Finance approval": "Pending review", "Modified by": "Aarav Mehta", Status: "Pending approval" },
    { id: "MOD-301", Model: "Urban Kitchen", Brand: "Daily Bowl", "Investment range": "₹40L–₹80L", "Franchise fee": "₹9L + GST", GST: "18%", "Effective date": "01 Jun 2026", "Finance approval": "Approved · v1", "Modified by": "Rohan Kapoor", Status: "Active" },
  ],
  "System Configuration": [
    { id: "CFG-ORG-01", Setting: "Organization time zone", Area: "Organization", "Current value": "Asia/Kolkata", Environment: "All", "Last changed": "18 Nov 2026", "Changed by": "Aarav Mehta", Status: "Active" },
    { id: "CFG-AUTH-02", Setting: "Session expiry", Area: "Authentication", "Current value": "12 hours", Environment: "Production", "Last changed": "15 Nov 2026", "Changed by": "Aarav Mehta", Status: "Active" },
    { id: "CFG-LEAD-03", Setting: "Website enquiry sync", Area: "Lead capture", "Current value": "Enabled", Environment: "Production", "Last changed": "12 Nov 2026", "Changed by": "Sana Khan", Status: "Active" },
    { id: "CFG-MFA-04", Setting: "Multi-factor authentication", Area: "Security", "Current value": "Pilot · 24 users", Environment: "Production", "Last changed": "10 Nov 2026", "Changed by": "Aarav Mehta", Status: "In review" },
  ],
  "Integrations": [
    { id: "INT-01", Integration: "Meta Lead Ads", Provider: "Meta", Connection: "Connected", "Last successful sync": "Today, 10:08 am", "Last failure": "—", "Sync status": "Healthy", Configuration: "Lead forms · 4 pages" },
    { id: "INT-02", Integration: "Meta Conversions API", Provider: "Meta", Connection: "Connected", "Last successful sync": "Today, 9:58 am", "Last failure": "—", "Sync status": "Healthy", Configuration: "Lead qualified · meeting" },
    { id: "INT-03", Integration: "Google Calendar", Provider: "Google", Connection: "Connected", "Last successful sync": "Today, 10:15 am", "Last failure": "—", "Sync status": "Healthy", Configuration: "Meetings · reminders" },
    { id: "INT-04", Integration: "Google Meet", Provider: "Google", Connection: "Connected", "Last successful sync": "Today, 10:15 am", "Last failure": "—", "Sync status": "Healthy", Configuration: "Meeting links" },
    { id: "INT-05", Integration: "Email Service", Provider: "Mail provider", Connection: "Connected", "Last successful sync": "Today, 10:22 am", "Last failure": "—", "Sync status": "Healthy", Configuration: "Transactional email" },
    { id: "INT-06", Integration: "Website Enquiries", Provider: "iFranchise", Connection: "Connected", "Last successful sync": "Today, 10:20 am", "Last failure": "—", "Sync status": "Healthy", Configuration: "Enquiry webhook" },
    { id: "INT-07", Integration: "Google Sheets", Provider: "Google", Connection: "Needs attention", "Last successful sync": "Yesterday, 5:40 pm", "Last failure": "Today, 8:05 am", "Sync status": "Retry available", Configuration: "Approved lead capture" },
    { id: "INT-08", Integration: "Android App", Provider: "iFranchise", Connection: "Connected", "Last successful sync": "Today, 10:18 am", "Last failure": "—", "Sync status": "Healthy", Configuration: "Employee app · v4.8.2" },
    { id: "INT-09", Integration: "Cloud Storage", Provider: "Cloud provider", Connection: "Connected", "Last successful sync": "Today, 10:12 am", "Last failure": "—", "Sync status": "Healthy", Configuration: "Approved documents" },
  ],
  "Infrastructure & Database": [
    { id: "SVC-01", Service: "CRM Web Application", Type: "Application", Health: "Operational", Availability: "99.98%", Response: "184 ms", "Last incident": "No incidents", Environment: "Production" },
    { id: "SVC-02", Service: "Public API", Type: "API", Health: "Operational", Availability: "99.96%", Response: "212 ms", "Last incident": "No incidents", Environment: "Production" },
    { id: "SVC-03", Service: "Primary Database", Type: "Database", Health: "Operational", Availability: "99.99%", Response: "18 ms query p95", "Last incident": "No incidents", Environment: "Production" },
    { id: "SVC-04", Service: "Authentication", Type: "Identity", Health: "Operational", Availability: "99.99%", Response: "96 ms", "Last incident": "No incidents", Environment: "Production" },
    { id: "SVC-05", Service: "Notification delivery", Type: "Background job", Health: "Degraded", Availability: "98.1%", Response: "3 retries pending", "Last incident": "Today, 8:05 am", Environment: "Production" },
    { id: "SVC-06", Service: "Document storage", Type: "File storage", Health: "Operational", Availability: "99.97%", Response: "—", "Last incident": "No incidents", Environment: "Production" },
    { id: "SVC-07", Service: "Database migrations", Type: "Migration", Health: "Current", Availability: "48 / 48 applied", Response: "—", "Last incident": "18 Nov 2026", Environment: "Production" },
  ],
  "Security & Devices": [
    { id: "DV-2401", "Device reference": "DV-2401", Employee: "Aarav Mehta · IF2026001", "Device model": "Pixel 9 Pro", "OS version": "Android 16", "App version": "4.8.2", "Registration date": "12 Sep 2026", "Last synchronization": "Today, 10:18 am", Status: "Approved" },
    { id: "DV-2402", "Device reference": "DV-2402", Employee: "Maya Reddy · IF2026002", "Device model": "Samsung S25", "OS version": "Android 16", "App version": "4.8.2", "Registration date": "18 Sep 2026", "Last synchronization": "Today, 9:42 am", Status: "Approved" },
    { id: "DV-2403", "Device reference": "DV-2403", Employee: "Neha Sharma · IF2026004", "Device model": "OnePlus 12", "OS version": "Android 15", "App version": "4.7.9", "Registration date": "22 Sep 2026", "Last synchronization": "12 Nov 2026", Status: "Revoked" },
    { id: "DV-2404", "Device reference": "DV-2404", Employee: "Sana Khan · IF2026005", "Device model": "Pixel 8", "OS version": "Android 15", "App version": "4.8.2", "Registration date": "05 Oct 2026", "Last synchronization": "Today, 8:41 am", Status: "Pending approval" },
    { id: "SEC-01", "Device reference": "SEC-01 · Sign-in", Employee: "3 failed sign-ins · Neha S.", "Device model": "Chrome · macOS", "OS version": "—", "App version": "—", "Registration date": "Today, 9:14 am", "Last synchronization": "Pune, India", Status: "Review" },
  ],
  "Backup & Recovery": [
    { id: "BKP-1121", "Backup reference": "BKP-1121", Type: "Database · automated", Started: "21 Nov 2026, 2:00 am", Completed: "21 Nov 2026, 2:08 am", Verification: "Checksum verified", Retention: "30 days", "RPO / RTO": "RPO 24h · RTO 4h", Status: "Verified" },
    { id: "BKP-1120", "Backup reference": "BKP-1120", Type: "Database · automated", Started: "20 Nov 2026, 2:00 am", Completed: "20 Nov 2026, 2:09 am", Verification: "Checksum verified", Retention: "30 days", "RPO / RTO": "RPO 24h · RTO 4h", Status: "Verified" },
    { id: "BKP-1119", "Backup reference": "BKP-1119", Type: "Documents · incremental", Started: "20 Nov 2026, 1:30 am", Completed: "20 Nov 2026, 1:39 am", Verification: "Manifest verified", Retention: "90 days", "RPO / RTO": "RPO 12h · RTO 8h", Status: "Verified" },
    { id: "BKP-1118", "Backup reference": "BKP-1118", Type: "Database · automated", Started: "19 Nov 2026, 2:00 am", Completed: "—", Verification: "Completion not verified", Retention: "30 days", "RPO / RTO": "RPO 24h · RTO 4h", Status: "Failed" },
    { id: "REC-014", "Backup reference": "REC-014 · Recovery test", Type: "Quarterly restore test", Started: "14 Nov 2026, 11:00 am", Completed: "14 Nov 2026, 11:47 am", Verification: "Test documented", Retention: "Audit record", "RPO / RTO": "RPO 24h · RTO 4h", Status: "Completed" },
  ],
  "Versions & Deployments": [
    { id: "REL-4.8.2", Release: "November maintenance", Platform: "Android", Version: "4.8.2", Environment: "Production · 72%", "Deployed at": "20 Nov 2026, 7:20 pm", "Deployed by": "Release manager", Rollback: "Available", Status: "Rolling out" },
    { id: "REL-WEB-26.11.4", Release: "Web release 26.11.4", Platform: "Web CRM", Version: "26.11.4", Environment: "Production", "Deployed at": "19 Nov 2026, 6:10 pm", "Deployed by": "Release manager", Rollback: "Available", Status: "Stable" },
    { id: "REL-4.8.1", Release: "Android release 4.8.1", Platform: "Android", Version: "4.8.1", Environment: "86 devices", "Deployed at": "06 Nov 2026, 4:35 pm", "Deployed by": "Release manager", Rollback: "Archived", Status: "Superseded" },
    { id: "DEP-114", Release: "Web staging build", Platform: "Web CRM", Version: "26.11.5-rc1", Environment: "Staging", "Deployed at": "21 Nov 2026, 9:05 am", "Deployed by": "Aarav Mehta", Rollback: "Available", Status: "Failed" },
  ],
  "Audit Logs": [
    { id: "AUD-8841", Action: "Device access revoked", Actor: "Aarav Mehta · IF2026001", Module: "Security & Devices", Resource: "DV-2403", "Previous value": "Approved", "New value": "Revoked", "Date and time": "21 Nov 2026, 9:16 am", "IP / Device": "10.20.4.18 · Chrome", Result: "Completed" },
    { id: "AUD-8840", Action: "Role assignment updated", Actor: "Neha Sharma · IF2026004", Module: "Users & Accounts", Resource: "IF2026017", "Previous value": "Sales User", "New value": "Sales Manager", "Date and time": "21 Nov 2026, 8:52 am", "IP / Device": "10.20.4.22 · Chrome", Result: "Completed" },
    { id: "AUD-8839", Action: "Pricing version submitted", Actor: "Aarav Mehta · IF2026001", Module: "Franchise Models & Pricing", Resource: "MOD-203 · v4", "Previous value": "₹14L", "New value": "₹15L · pending approval", "Date and time": "20 Nov 2026, 5:44 pm", "IP / Device": "10.20.4.18 · Chrome", Result: "Awaiting Finance" },
    { id: "AUD-8838", Action: "Integration retry", Actor: "Sana Khan · IF2026005", Module: "Integrations", Resource: "INT-07 · Google Sheets", "Previous value": "Failed", "New value": "Queued", "Date and time": "20 Nov 2026, 4:05 pm", "IP / Device": "10.20.8.12 · Chrome", Result: "Queued" },
    { id: "AUD-8837", Action: "Sign-in blocked", Actor: "Identity service", Module: "Security", Resource: "Neha Sharma", "Previous value": "—", "New value": "3 failed attempts", "Date and time": "20 Nov 2026, 3:18 pm", "IP / Device": "203.0.113.24 · Unknown", Result: "Blocked" },
    { id: "AUD-8836", Action: "Backup verified", Actor: "Backup service", Module: "Backup & Recovery", Resource: "BKP-1120", "Previous value": "Running", "New value": "Verified", "Date and time": "20 Nov 2026, 2:09 am", "IP / Device": "Automated job", Result: "Completed" },
  ],
};

function statusColor(value: string): ChipColor {
  const v = value.toLowerCase();
  if (["active", "approved", "connected", "healthy", "operational", "verified", "stable", "completed"].some(x => v.includes(x))) return "lime";
  if (["pending", "review", "rolling", "attention", "degraded", "queued"].some(x => v.includes(x))) return "yellow";
  if (["failed", "revoked", "deactivated", "inactive", "blocked"].some(x => v.includes(x))) return "rose";
  return "neutral";
}

function RecordActionsMenu({ row, section, profile, screen, onDetails, onEdit, onRetry, onDeactivate, onOperation }: {
  row: RecordRow;
  section: Exclude<Key, "Overview">;
  profile: Profile;
  screen: Screen;
  onDetails: () => void;
  onEdit: () => void;
  onRetry: () => void;
  onDeactivate: (status: string) => void;
  onOperation: (label: string, status: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const choose = (action: () => void) => { setOpen(false); action(); };
  return <Dropdown isOpen={open} onOpenChange={setOpen}><DropdownTrigger aria-label={`Actions for ${row[screen.columns[0]?.id || "record"] || row.id}`} className="admin-more-trigger"><RiMore2Line className="size-5" /></DropdownTrigger><DropdownPopover aria-label="Record actions" placement="bottom end"><DropdownItem onSelect={() => choose(onDetails)}>View details</DropdownItem>{section !== "Audit Logs" && screen.access.includes(profile) && <DropdownItem onSelect={() => choose(onEdit)}>Edit</DropdownItem>}{section === "Integrations" && row["Sync status"] !== "Healthy" && profile !== "Marketing" && <DropdownItem onSelect={() => choose(onRetry)}>Retry sync</DropdownItem>}{section === "Security & Devices" && row.id.startsWith("DV-") && row.Status !== "Revoked" && <DropdownItem onSelect={() => choose(() => onDeactivate("Revoked"))}>Revoke access</DropdownItem>}{section !== "Security & Devices" && screen.supportsDeactivate && row.Status !== "Deactivated" && row.Status !== "Inactive" && <DropdownItem onSelect={() => choose(() => onDeactivate("Deactivated"))}>Deactivate</DropdownItem>}{section === "Backup & Recovery" && row.Status === "Verified" && <DropdownItem onSelect={() => choose(() => onOperation("Start recovery test", "Recovery test requested"))}>Start recovery test</DropdownItem>}{section === "Versions & Deployments" && row.Rollback === "Available" && profile !== "Finance" && <DropdownItem onSelect={() => choose(() => onOperation("Request rollback", "Rollback requested"))}>Request rollback</DropdownItem>}</DropdownPopover></Dropdown>;
}

export function AdministrationWorkspace({ view = "Overview", status }: { view?: string; status?: string }) {
  const router = useRouter();
  const section = (Object.keys(screens).includes(view) || view === "Overview" ? view : "Overview") as Key;
  const [profile, setProfile] = useState<Profile>("IT Administrator");
  const [rows, setRows] = useState(seeds);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(status || "All statuses");
  const [sortKey, setSortKey] = useState("");
  const [ascending, setAscending] = useState(true);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [editor, setEditor] = useState<{ row: RecordRow; isNew: boolean } | null>(null);
  const [detail, setDetail] = useState<RecordRow | null>(null);
  const [effectiveEmployeeId, setEffectiveEmployeeId] = useState("IF2026001");
  const [confirm, setConfirm] = useState<{ title: string; description: string; confirmLabel?: string; run: () => void } | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => setSelected([]), [section]);

  const screen = section === "Overview" ? null : screens[section];
  const dataSection = section === "Overview" ? null : section;
  const allowed = !screen || screen.access.includes(profile);
  const activeRows = dataSection ? rows[dataSection].filter(row => !(profile === "Marketing" && section === "Integrations" && !["INT-01", "INT-02"].includes(row.id))) : [];
  const editFields = screen?.fields.filter(field => !(profile === "IT Administrator" && section === "Franchise Models & Pricing" && ["Investment range", "Franchise fee", "GST"].includes(field))) || [];
  const effectiveEmployee = rows["Users & Accounts"].find(user => user.id === effectiveEmployeeId) || rows["Users & Accounts"][0];
  const effectiveRole = rows["Roles & Permissions"].find(role => role["Role name"] === effectiveEmployee?.["Assigned role"]);
  const tableColumns: Column[] = screen ? [{ id: "__select", name: "Select" }, ...screen.columns, { id: "__manage", name: "Actions" }] : [];
  const filtered = useMemo(() => activeRows.filter(row => {
    const haystack = Object.values(row).join(" ").toLowerCase();
    return haystack.includes(query.toLowerCase()) && (statusFilter === "All statuses" || Object.values(row).some(v => v.toLowerCase() === statusFilter.toLowerCase()));
  }).sort((a, b) => sortKey ? (a[sortKey] || "").localeCompare(b[sortKey] || "") * (ascending ? 1 : -1) : 0), [activeRows, query, statusFilter, sortKey, ascending]);
  const pageSize = 8;
  const pageRows = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const selectableRows = section === "Security & Devices" ? pageRows.filter(row => row.id.startsWith("DV-")) : pageRows;

  const openNew = () => {
    if (!screen || !dataSection) return;
    const row = Object.fromEntries(screen.fields.map(field => [field, ""])) as RecordRow;
    row.id = `${dataSection.slice(0, 3).toUpperCase()}-${String(rows[dataSection].length + 1).padStart(3, "0")}`;
    setEditor({ row, isNew: true });
  };
  const saveRecord = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!screen || !dataSection || !editor) return;
    setRows(current => ({ ...current, [dataSection]: editor.isNew ? [editor.row, ...current[dataSection]] : current[dataSection].map(row => row.id === editor.row.id ? editor.row : row) }));
    if (section !== "Audit Logs") {
      const audit = { id: `AUD-${Date.now()}`, Action: editor.isNew ? "Record created" : "Record updated", Actor: people[profiles.indexOf(profile)] + " · administration", Module: section, Resource: editor.row.id, "Previous value": editor.isNew ? "—" : "Existing record", "New value": editor.isNew ? "Created" : "Updated", "Date and time": "Just now", "IP / Device": "Preview environment", Result: "Completed" };
      setRows(current => ({ ...current, "Audit Logs": [audit, ...current["Audit Logs"]] }));
    }
    setEditor(null);
    setNotice(`${editor.isNew ? "Record created" : "Changes saved"} in this preview.`);
  };
  const changeStatus = (ids: string[], value: string) => {
    if (!screen || !dataSection) return;
    const target = ids.length === 1 ? rows[dataSection].find(row => row.id === ids[0]) : null;
    setConfirm({ title: `${value} ${ids.length === 1 ? "this record" : `${ids.length} selected records`}?`, description: target ? `${target[screen.columns[0]?.id] || target.id}. Historical references will remain available.` : "The selected records and their history will remain available.", confirmLabel: `Confirm ${value.toLowerCase()}`, run: () => {
      const selectedRecords = rows[dataSection].filter(row => ids.includes(row.id));
      setRows(current => ({ ...current, [dataSection]: current[dataSection].map(row => ids.includes(row.id) ? { ...row, Status: value, Connection: value === "Inactive" ? "Disconnected" : row.Connection || value } : row), "Audit Logs": [{ id: `AUD-${Date.now()}`, Action: value === "Revoked" ? "Device access revoked" : `Record status changed to ${value}`, Actor: people[profiles.indexOf(profile)] + " · administration", Module: section, Resource: selectedRecords.map(row => row.id).join(", "), "Previous value": selectedRecords.map(row => row.Status || row.Connection || "Active").join(", "), "New value": value, "Date and time": "Just now", "IP / Device": "Preview environment", Result: "Completed" }, ...current["Audit Logs"]] }));
      setSelected([]);
      setNotice(`Status changed to ${value}.`);
      setConfirm(null);
    } });
  };
  const exportSelected = () => {
    if (!dataSection || selected.length === 0) return;
    const records = rows[dataSection].filter(row => selected.includes(row.id));
    const columns = [...new Set(records.flatMap(row => Object.keys(row)))];
    const escapeCsv = (value: string) => `"${value.replaceAll('"', '""')}"`;
    const csv = [columns, ...records.map(row => columns.map(column => row[column] || ""))]
      .map(values => values.map(escapeCsv).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${section.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}-selected.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice(`Exported ${records.length} selected ${records.length === 1 ? "record" : "records"}.`);
  };
  const removeSelectedIntegrations = () => {
    if (!dataSection || section !== "Integrations" || selected.length === 0) return;
    const records = rows[dataSection].filter(row => selected.includes(row.id));
    setConfirm({
      title: `Remove ${records.length} selected integration${records.length === 1 ? "" : "s"}?`,
      description: "This removes the integration configuration from the preview. Related audit history is retained.",
      confirmLabel: "Remove integrations",
      run: () => {
        const resources = records.map(row => row.id).join(", ");
        setRows(current => ({
          ...current,
          [dataSection]: current[dataSection].filter(row => !selected.includes(row.id)),
          "Audit Logs": [{ id: `AUD-${Date.now()}`, Action: "Integration configuration removed", Actor: people[profiles.indexOf(profile)] + " · administration", Module: section, Resource: resources, "Previous value": "Configured", "New value": "Removed", "Date and time": "Just now", "IP / Device": "Preview environment", Result: "Completed" }, ...current["Audit Logs"]],
        }));
        setSelected([]);
        setConfirm(null);
        setNotice(`Removed ${records.length} integration${records.length === 1 ? "" : "s"} in this preview.`);
      },
    });
  };
  const retry = (row: RecordRow) => {
    setRows(current => ({ ...current, "Integrations": current["Integrations"].map(item => item.id === row.id ? { ...item, "Sync status": "Retry queued", "Last failure": "Retry requested just now" } : item) }));
    setNotice(`Retry queued for ${row.Integration}.`);
  };
  const requestOperation = (row: RecordRow, label: string, updatedStatus: string) => {
    setConfirm({ title: `${label}?`, description: `${row.id} · ${row.Release || row["Backup reference"]}. This preview records the request for review; no production operation will run.`, run: () => {
      const area = section as Exclude<Key, "Overview">;
      setRows(current => {
        const recoveryRecord = label === "Start recovery test" ? [{ id: `REC-${Date.now()}`, "Backup reference": `Recovery test · ${row["Backup reference"]}`, Type: "On-demand restore verification", Started: "Requested just now", Completed: "—", Verification: "Pending", Retention: "Audit record", "RPO / RTO": row["RPO / RTO"] || "—", Status: updatedStatus }] : [];
        const updatedRows = current[area].flatMap(item => {
          if (item.id !== row.id) return [item];
          if (label === "Start recovery test") return [item];
          return [{ ...item, Status: updatedStatus, Rollback: label === "Request rollback" ? "Requested" : item.Rollback }];
        });
        return { ...current, [area]: [...recoveryRecord, ...updatedRows], "Audit Logs": [{ id: `AUD-${Date.now()}`, Action: label, Actor: people[profiles.indexOf(profile)] + " · administration", Module: area, Resource: row.id, "Previous value": row.Status || row.Rollback || "Available", "New value": updatedStatus, "Date and time": "Just now", "IP / Device": "Preview environment", Result: "Recorded · Preview" }, ...current["Audit Logs"]] };
      });
      setConfirm(null);
      setNotice(`${label} recorded in preview.`);
    } });
  };

  const nav = <nav className="review-navigation admin-navigation" aria-label="IT administration sections">{groups.map(group => <div className="admin-nav-group" key={group.title}><span>{group.title}</span>{group.pages.map(item => <Link key={item} className="review-overview-link" href={`/library/modules/administration?view=${encodeURIComponent(item)}`} aria-current={section === item ? "page" : undefined}>{item}</Link>)}</div>)}</nav>;
  const controls = <div className="flex items-center gap-2 pr-4"><span className="hidden text-caption-1-regular text-text-tertiary md:inline">Review profile</span><Select aria-label="Review profile" selectedKey={profile} onSelectionChange={key => { const next = String(key) as Profile; setProfile(next); setNotice(`Preview profile changed to ${next}.`); }} className="min-w-48"><SelectItem id="IT Administrator">IT Administrator</SelectItem><SelectItem id="CEO / Super Admin">CEO / Super Admin</SelectItem><SelectItem id="Finance">Finance</SelectItem><SelectItem id="HR">HR</SelectItem><SelectItem id="Marketing">Marketing</SelectItem></Select><span className="sr-only">Signed in as {people[profiles.indexOf(profile)]}</span></div>;

  return <DirectionProvider locale="en-US"><ReviewShell moduleName="IT & System Administration" icon="settings" subtitle="Systems, access & governance" overviewHref="/library/modules/administration?view=Overview" title={section} navigation={nav} controls={controls} className="admin-shell">
    <div className="admin-board flex min-h-0 h-full flex-col gap-5 overflow-hidden p-6 text-text-primary">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="min-w-0"><h2 className="text-title-2-medium">{section}</h2><p className="mt-1 text-body-regular text-text-secondary">{section === "Overview" ? "System health, access and recent administrative activity." : screen?.description}</p></div>
        <div className="flex items-center gap-2">{section !== "Overview" && screen?.add && allowed && <Button leadingIcon={RiAddLine} onClick={openNew}>{screen.add}</Button>}</div>
      </div>

      {notice && <div role="status" className="flex shrink-0 items-center justify-between rounded-xl border border-separator-border bg-background-secondary-default px-4 py-2.5 text-body-2-regular text-text-secondary">{notice}<button className="text-text-tertiary" onClick={() => setNotice("")}>Dismiss</button></div>}

      {section === "Overview" ? <Overview rows={rows} onNavigate={(key, filter) => router.push(`/library/modules/administration?view=${encodeURIComponent(key)}${filter ? `&status=${encodeURIComponent(filter)}` : ""}`)} /> : !allowed ? <section className="admin-panel flex flex-1 items-center justify-center p-8"><div className="max-w-md text-center"><span className="mb-3 inline-flex rounded-full bg-background-secondary-default p-3 text-foreground-icon-secondary"><RiSettings3Line className="size-5" /></span><h3 className="text-headline-medium text-text-primary">Access restricted</h3><p className="mt-2 text-body-regular text-text-secondary">{profile} does not administer this area in the review profile. Choose another profile to inspect its authorized controls.</p></div></section> : <section className="admin-panel flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-separator-border p-4">
          <SearchField aria-label={`Search ${section}`} placeholder={`Search ${section.toLowerCase()}`} value={query} onChange={value => { setQuery(value); setPage(0); setSelected([]); }} className="min-w-56 flex-1" />
          <Select aria-label="Filter by status" selectedKey={statusFilter} onSelectionChange={key => { setStatusFilter(String(key)); setPage(0); setSelected([]); }} className="w-44"><SelectItem id="All statuses">All statuses</SelectItem>{[...new Set(activeRows.flatMap(row => Object.entries(row).filter(([key]) => ["Status", "Health", "Connection", "Sync status", "Verification", "Result"].includes(key)).map(([, value]) => value)))].map(value => <SelectItem key={value} id={value}>{value}</SelectItem>)}</Select>
        </div>
        {selected.length > 0 && <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-separator-border bg-background-secondary-default px-4 py-3" role="region" aria-label="Selected record actions">
          <span className="mr-auto text-body-2-medium text-text-primary">{selected.length} selected</span>
          <Button variant="secondary" size="small" onClick={exportSelected}>Export selected</Button>
          {screen?.supportsDeactivate && <Button variant="secondary" size="small" onClick={() => changeStatus(selected, section === "Security & Devices" ? "Revoked" : "Deactivated")}>{section === "Security & Devices" ? "Revoke selected devices" : "Deactivate selected"}</Button>}
          {section === "Integrations" && (profile === "IT Administrator" || profile === "CEO / Super Admin") && <Button variant="danger" size="small" onClick={removeSelectedIntegrations}>Remove selected</Button>}
          <Button variant="ghost" size="small" onClick={() => setSelected([])}>Clear selection</Button>
        </div>}
        <div className="admin-table-scroll min-h-0 flex-1 overflow-auto">
          {section === "Departments & Hierarchy" && <div className="admin-hierarchy-strip"><span className="admin-hierarchy-root">Leadership</span><RiArrowRightSLine className="size-4 text-text-tertiary" /><div className="admin-hierarchy-branches">{["Sales · 18", "Marketing · 4", "MIS / Operations · 6", "Finance · 5", "IT · 4", "HR · 3", "Brands · 8"].map(name => <span key={name}>{name}</span>)}</div></div>}
          <Table aria-label={section} selectionMode="multiple" selectedKeys={new Set(selected)} onSelectionChange={keys => setSelected(keys === "all" ? selectableRows.map(row => row.id) : Array.from(keys).map(String))} size="sm" className="admin-table">
            <TableHeader columns={tableColumns}>{(column: Column) => <TableColumn id={column.id} isRowHeader={column.isRowHeader} onClick={column.id.startsWith("__") ? undefined : () => { setAscending(sortKey === column.id ? !ascending : true); setSortKey(column.id); }} className={cx(column.id === "__select" && "w-12", column.id === "__manage" && "w-16 text-end", !column.id.startsWith("__") && "cursor-pointer")}>{column.id === "__select" ? <Checkbox slot="selection" aria-label="Select all visible records" isSelected={selectableRows.length > 0 && selectableRows.every(row => selected.includes(row.id))} isDisabled={selectableRows.length === 0} /> : column.id === "__manage" ? column.name : <>{column.name}{sortKey === column.id ? ascending ? " ↑" : " ↓" : ""}</>}</TableColumn>}</TableHeader>
            <TableBody items={pageRows} renderEmptyState={() => <div className="p-10 text-center text-body-regular text-text-secondary">No matching records. Adjust the search or status filter.</div>}>{row => <TableRow id={row.id} columns={tableColumns} className="admin-row">{(column: Column) => {
              if (column.id === "__select") return <TableCell><Checkbox slot="selection" aria-label={`Select ${row[screen!.columns[0]?.id || "id"] || row.id}`} isDisabled={section === "Security & Devices" && !row.id.startsWith("DV-")} /></TableCell>;
              if (column.id === "__manage") return <TableCell><RecordActionsMenu row={row} section={section as Exclude<Key, "Overview">} profile={profile} screen={screen!} onDetails={() => setDetail(row)} onEdit={() => setEditor({ row: { ...row }, isNew: false })} onRetry={() => retry(row)} onDeactivate={status => changeStatus([row.id], status)} onOperation={(label, status) => requestOperation(row, label, status)} /></TableCell>;
              const cell = screen!.columns.find(item => item.id === column.id)!;
              const value = profile === "IT Administrator" && section === "Franchise Models & Pricing" && ["Investment range", "Franchise fee", "GST"].includes(column.id) ? "Restricted" : row[column.id] || "—";
              const isStatus = ["Status", "Health", "Connection", "Sync status", "Verification", "Result"].includes(column.id);
              return <TableCell>{isStatus ? <Chip variant="caption" color={statusColor(value)}><span className="inline-flex items-center gap-1">{statusColor(value) === "lime" && <RiCheckLine className="size-3.5" />}{value}</span></Chip> : <span className={cx(cell.isRowHeader && "text-body-2-medium text-text-primary", "admin-cell-value")}>{value}</span>}</TableCell>;
            }}</TableRow>}</TableBody>
          </Table>
        </div>
        <div className="flex shrink-0 items-center justify-between border-t border-separator-border px-4 py-3 text-caption-1-regular text-text-secondary"><span>{filtered.length} records · Preview data</span><div className="flex items-center gap-2"><Button variant="secondary" size="small" disabled={page === 0} onClick={() => setPage(current => Math.max(0, current - 1))}>Previous</Button><span>{page + 1} / {Math.max(1, Math.ceil(filtered.length / pageSize))}</span><Button variant="secondary" size="small" disabled={(page + 1) * pageSize >= filtered.length} onClick={() => setPage(current => current + 1)}>Next</Button></div></div>
      </section>}
    </div>

    {editor && screen && <Modal isOpen onOpenChange={open => !open && setEditor(null)} size="xl" className="max-h-[min(88vh,880px)]"><ModalHeader title={editor.isNew ? screen.add || "Create record" : `Edit ${section}`} description={`${section} · ${editor.row.id}`} /><ModalBody><form id="admin-record-form" onSubmit={saveRecord} className="admin-record-form grid grid-cols-1 gap-4 py-3 sm:grid-cols-2">{editFields.filter(field => !(section === "Roles & Permissions" && field === "Permissions")).map(field => <Input key={field} label={field} value={editor.row[field] || ""} onChange={value => setEditor(current => current ? { ...current, row: { ...current.row, [field]: value } } : current)} placeholder={`Enter ${field.toLowerCase()}`} />)}{section === "Roles & Permissions" && <fieldset className="col-span-full rounded-xl border border-separator-border p-4"><legend className="px-1 text-body-2-medium text-text-primary">Action permissions</legend><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{permissionActions.map(action => { const values = (editor.row.Permissions || "").split(/[·,]/).map(value => value.trim()); return <Checkbox key={action} isSelected={values.includes(action)} onChange={checked => setEditor(current => { if (!current) return current; const next = new Set((current.row.Permissions || "").split(/[·,]/).map(value => value.trim()).filter(Boolean)); checked ? next.add(action) : next.delete(action); return { ...current, row: { ...current.row, Permissions: [...next].join(" · ") } }; })}>{action}</Checkbox>; })}</div></fieldset>}</form><p className="mt-3 text-caption-1-regular text-text-tertiary">Changes are simulated in this review and recorded in the audit history. Credentials are never shown.</p></ModalBody><ModalFooter><Button variant="secondary" onClick={() => setEditor(null)}>Cancel</Button><Button type="submit" form="admin-record-form">{editor.isNew ? "Create record" : "Save changes"}</Button></ModalFooter></Modal>}
    {detail && <Modal isOpen onOpenChange={open => !open && setDetail(null)} size="lg"><ModalHeader title={detail[screens[section as Exclude<Key, "Overview">]?.columns[0]?.id || "Action"] || detail.id} description={`${section} · ${detail.id}`} /><ModalBody><dl className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">{Object.entries(detail).filter(([key]) => key !== "id").map(([key, value]) => <div key={key} className="border-b border-separator-border py-3"><dt className="text-caption-1-regular text-text-tertiary">{key}</dt><dd className="mt-1 break-words text-body-2-medium text-text-primary">{profile === "IT Administrator" && section === "Franchise Models & Pricing" && ["Investment range", "Franchise fee", "GST"].includes(key) ? "Restricted · Finance access required" : value || "—"}</dd></div>)}</dl>{section === "Roles & Permissions" && <section className="mt-5 rounded-xl border border-separator-border p-4"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-body-2-medium text-text-primary">Effective permissions preview</h3><Select aria-label="Preview employee access" selectedKey={effectiveEmployeeId} onSelectionChange={key => setEffectiveEmployeeId(String(key))} className="min-w-56">{rows["Users & Accounts"].map(user => <SelectItem key={user.id} id={user.id}>{user["Employee name"]} · {user["Employee ID"]}</SelectItem>)}</Select></div><p className="mt-3 text-caption-1-regular text-text-secondary">{effectiveEmployee?.["Employee name"]} · {effectiveRole?.["Role name"] || effectiveEmployee?.["Assigned role"]} · {effectiveRole?.Scope || "Assigned scope"}</p><div className="mt-3 flex flex-wrap gap-2">{permissionActions.map(action => { const granted = (effectiveRole?.Permissions || "").includes(action); return <Chip key={action} variant="caption" color={granted ? "purple" : "neutral"}>{action}{granted ? " · allowed" : " · not granted"}</Chip>; })}</div><p className="mt-3 text-caption-1-regular text-text-tertiary">Record-level restrictions still apply. Critical permission updates are recorded in audit history.</p></section>}</ModalBody><ModalFooter><Button variant="secondary" onClick={() => setDetail(null)}>Close</Button></ModalFooter></Modal>}
    {confirm && <AlertDialog isOpen title={confirm.title} description={confirm.description} confirmLabel={confirm.confirmLabel || "Confirm change"} onConfirm={confirm.run} onOpenChange={open => !open && setConfirm(null)} />}
  </ReviewShell></DirectionProvider>;
}

function Overview({ rows, onNavigate }: { rows: Record<Exclude<Key, "Overview">, RecordRow[]>; onNavigate: (key: Key, filter?: string) => void }) {
  const metrics: { title: string; value: string; note: string; section: Key; status?: string }[] = [
    { title: "Registered users", value: "126", note: "118 active · 8 deactivated", section: "Users & Accounts" },
    { title: "Approved devices", value: "94", note: "89 active · 5 need review", section: "Security & Devices" },
    { title: "Integrations", value: "8 / 9", note: "One sync needs attention", section: "Integrations", status: "Needs attention" },
    { title: "Platform health", value: "6 / 7", note: "One background job degraded", section: "Infrastructure & Database", status: "Degraded" },
    { title: "Latest backup", value: "Verified", note: "Today · 2:08 am · 30 day retention", section: "Backup & Recovery", status: "Verified" },
    { title: "Current releases", value: "2", note: "Android rollout · web stable", section: "Versions & Deployments" },
  ];
  const events = rows["Audit Logs"].slice(0, 4);
  const issues = [...rows.Integrations.filter(row => row["Sync status"] !== "Healthy"), ...rows["Infrastructure & Database"].filter(row => row.Health === "Degraded"), ...rows["Backup & Recovery"].filter(row => row.Status === "Failed")].slice(0, 4);
  return <div className="admin-overview min-h-0 flex-1 overflow-auto pr-1">
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">{metrics.map(metric => <button key={metric.title} className="admin-metric text-start" onClick={() => onNavigate(metric.section, metric.status)}><span className="text-body-2-regular text-text-secondary">{metric.title}</span><strong className="mt-2 block text-title-2-medium text-text-primary">{metric.value}</strong><span className="mt-1 block text-caption-1-regular text-text-tertiary">{metric.note}</span><span className="mt-3 inline-flex items-center gap-1 text-caption-1-medium text-accent-700">Open section <RiArrowRightSLine className="size-4" /></span></button>)}</div>
    <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
      <section className="admin-panel min-w-0 overflow-hidden"><div className="flex items-center justify-between gap-3 p-4"><div><h3 className="text-headline-medium text-text-primary">System status</h3><p className="mt-1 text-caption-1-regular text-text-secondary">Application, data and service health</p></div><Button variant="secondary" size="small" leadingIcon={RiRefreshLine} onClick={() => onNavigate("Infrastructure & Database")}>View health</Button></div><div className="admin-status-list">{rows["Infrastructure & Database"].slice(0, 5).map(row => <div key={row.id}><span className="min-w-0"><strong>{row.Service}</strong><small>{row.Response}</small></span><Chip variant="caption" color={statusColor(row.Health)}>{row.Health}</Chip></div>)}</div></section>
      <section className="admin-panel min-w-0 overflow-hidden"><div className="flex items-center justify-between gap-3 p-4"><div><h3 className="text-headline-medium text-text-primary">Needs attention</h3><p className="mt-1 text-caption-1-regular text-text-secondary">Items that may need an administrator</p></div><Button variant="secondary" size="small" onClick={() => onNavigate("Integrations")}>Review</Button></div>{issues.length ? <div className="admin-status-list">{issues.map(row => <div key={row.id}><span className="min-w-0"><strong>{row.Integration || row.Service || row["Backup reference"]}</strong><small>{row["Last failure"] || row.Health || row.Status}</small></span><Chip variant="caption" color={statusColor(row["Sync status"] || row.Health || row.Status || "")}>{row["Sync status"] || row.Health || row.Status}</Chip></div>)}</div> : <p className="p-4 pt-0 text-body-2-regular text-text-secondary">No active system issues.</p>}</section>
      <section className="admin-panel min-w-0 overflow-hidden xl:col-span-2"><div className="flex items-center justify-between gap-3 p-4"><div><h3 className="text-headline-medium text-text-primary">Recent administrative activity</h3><p className="mt-1 text-caption-1-regular text-text-secondary">Configuration and security history</p></div><Button variant="secondary" size="small" onClick={() => onNavigate("Audit Logs")}>View audit log</Button></div><div className="admin-status-list admin-activity-list">{events.map(row => <div key={row.id}><span className="min-w-0"><strong>{row.Action}</strong><small>{row.Actor} · {row.Resource}</small></span><span className="text-caption-1-regular text-text-tertiary">{row["Date and time"]}</span></div>)}</div></section>
    </div>
    <p className="mt-3 text-caption-1-regular text-text-tertiary">Review environment · Sample data only. No live infrastructure or production accounts are connected.</p>
  </div>;
}
