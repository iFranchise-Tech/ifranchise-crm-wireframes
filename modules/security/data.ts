export type SecuritySection =
  | "Overview" | "Data Directory" | "Duplicate Management" | "Data Merge & Corrections" | "Import Management" | "Export Management"
  | "Role-Based Access" | "Record-Level Restrictions" | "Authentication & Sessions" | "File & Document Security"
  | "Sensitive Data Protection" | "Data Retention & Deletion" | "Audit Logs" | "Security Monitoring" | "Security Incidents"
  | "Backup & Recovery" | "Data Synchronization" | "Privacy & Compliance";

export type SecurityRecord = Record<string, string> & { id: string };

export const securityGroups: { title: string; sections: SecuritySection[] }[] = [
  { title: "Data Management", sections: ["Data Directory", "Duplicate Management", "Data Merge & Corrections", "Import Management", "Export Management"] },
  { title: "Access Control", sections: ["Role-Based Access", "Record-Level Restrictions", "Authentication & Sessions"] },
  { title: "Data Protection", sections: ["File & Document Security", "Sensitive Data Protection", "Data Retention & Deletion"] },
  { title: "Audit & Monitoring", sections: ["Audit Logs", "Security Monitoring", "Security Incidents"] },
  { title: "Data Reliability", sections: ["Backup & Recovery", "Data Synchronization"] },
  { title: "Privacy & Compliance", sections: ["Privacy & Compliance"] },
];

export const sectionDescriptions: Record<SecuritySection, string> = {
  Overview: "Data quality, access, security and reliability across the CRM.",
  "Data Directory": "Find core CRM entities and understand their relationships and ownership.",
  "Duplicate Management": "Review possible contact matches without merging legitimate enquiries or opportunities.",
  "Data Merge & Corrections": "Review proposed contact changes and preserve every linked business record.",
  "Import Management": "Validate files and records before an authorized import is confirmed.",
  "Export Management": "Scope, review and record authorized data exports.",
  "Role-Based Access": "Review module and action permissions by role.",
  "Record-Level Restrictions": "Preview the data boundaries applied to each CRM role.",
  "Authentication & Sessions": "Monitor access history and active sessions without exposing credentials.",
  "File & Document Security": "Review protected files, their linked records and access classification.",
  "Sensitive Data Protection": "Track sensitive fields, approved purposes and restricted access.",
  "Data Retention & Deletion": "Review retention windows and authorized archive or deletion requests.",
  "Audit Logs": "Search the read-only history of important data and security operations.",
  "Security Monitoring": "Review signals that may need an administrator’s attention.",
  "Security Incidents": "Assign investigations and track incidents through resolution.",
  "Backup & Recovery": "Verify backup evidence and review controlled recovery requests.",
  "Data Synchronization": "Monitor sync status and retry eligible events without overwriting newer data.",
  "Privacy & Compliance": "Manage privacy requests, purposes and data handling responsibilities.",
};

export const securitySeeds: Record<Exclude<SecuritySection, "Overview">, SecurityRecord[]> = {
  "Data Directory": [
    { id: "ENT-001", Entity: "Users", "Record count": "126", "Reference pattern": "IF2026…", Relationships: "Departments · roles · devices", Classification: "Internal" },
    { id: "ENT-002", Entity: "Departments & roles", "Record count": "14 departments · 10 roles", "Reference pattern": "DEP / ROLE", Relationships: "Users · permissions · teams", Classification: "Internal" },
    { id: "ENT-003", Entity: "Brands & franchise models", "Record count": "32 brands · 18 models", "Reference pattern": "BRD / MOD", Relationships: "Enquiries · opportunities · pricing", Classification: "Confidential" },
    { id: "ENT-004", Entity: "Contacts", "Record count": "8,412", "Reference pattern": "CON-…", Relationships: "Enquiries · activities · files", Classification: "Confidential" },
    { id: "ENT-005", Entity: "Enquiries & opportunities", "Record count": "4,286 · 2,104", "Reference pattern": "ENQ / OPP", Relationships: "Contacts · assignments · brands", Classification: "Confidential" },
    { id: "ENT-006", Entity: "Assignments & activities", "Record count": "6,930 · 18,240", "Reference pattern": "ASN / ACT", Relationships: "Users · contacts · opportunities", Classification: "Internal" },
    { id: "ENT-007", Entity: "Calls, meetings & follow-ups", "Record count": "12,601", "Reference pattern": "CALL / MTG / FUP", Relationships: "Contacts · opportunities · users", Classification: "Restricted" },
    { id: "ENT-008", Entity: "Payments & invoices", "Record count": "1,208 · 984", "Reference pattern": "PAY / INV", Relationships: "Opportunities · brands · Finance", Classification: "Restricted" },
    { id: "ENT-009", Entity: "Candidates & applications", "Record count": "342 · 218", "Reference pattern": "CAN / APP", Relationships: "Users · documents · HR", Classification: "Restricted" },
    { id: "ENT-010", Entity: "Notifications & documents", "Record count": "22,480 · 5,736", "Reference pattern": "NTF / DOC", Relationships: "Users · CRM records · modules", Classification: "Restricted" },
    { id: "ENT-011", Entity: "Audit logs", "Record count": "96,420", "Reference pattern": "AUD-…", Relationships: "Users · modules · record references", Classification: "Restricted · read-only" },
  ],
  "Duplicate Management": [
    { id: "DUP-2408", Contact: "CON-18420 · Ananya Rao", "Potential match": "CON-20183 · Ananya R.", "Matching fields": "Normalized mobile · +91 98••• 10234", Confidence: "High · 96%", "Linked records": "3 enquiries · 2 opportunities", Source: "Website · Meta" },
    { id: "DUP-2407", Contact: "CON-17214 · Karan Shah", "Potential match": "CON-20871 · K. Shah", "Matching fields": "Normalized email · k•••@mail.com", Confidence: "Likely · 82%", "Linked records": "2 enquiries · 1 opportunity", Source: "WhatsApp · Manual" },
    { id: "DUP-2405", Contact: "CON-16509 · Meera Nair", "Potential match": "CON-19822 · Meera N.", "Matching fields": "Mobile suffix · 4431", Confidence: "Review · 61%", "Linked records": "2 enquiries · 2 brands", Source: "Phone · Website" },
  ],
  "Data Merge & Corrections": [
    { id: "MRG-019", Contact: "Ananya Rao", Primary: "CON-18420", Merged: "—", "Linked enquiries": "3 preserved", "Activity history": "14 events preserved", "Performed by": "—", "Updated at": "Pending review", Status: "Review required" },
    { id: "MRG-018", Contact: "Karan Shah", Primary: "CON-17214", Merged: "CON-20871", "Linked enquiries": "2 preserved", "Activity history": "8 events preserved", "Performed by": "Aarav Mehta", "Updated at": "20 Nov 2026, 3:42 pm", Status: "Completed" },
    { id: "COR-006", Contact: "CON-18022 · contact email correction", Primary: "—", Merged: "—", "Linked enquiries": "1 unchanged", "Activity history": "6 events preserved", "Performed by": "Maya Reddy", "Updated at": "19 Nov 2026, 11:20 am", Status: "Completed" },
  ],
  "Import Management": [
    { id: "IMP-1042", File: "west-region-contacts.csv", Module: "Contacts", Records: "248", Errors: "0", Duplicates: "12 to review", "Uploaded by": "Aarav Mehta", "Updated at": "21 Nov 2026, 9:14 am", Status: "Ready for Import" },
    { id: "IMP-1041", File: "candidate-intake-nov.xlsx", Module: "Candidates", Records: "76", Errors: "8", Duplicates: "3", "Uploaded by": "Neha Sharma", "Updated at": "21 Nov 2026, 8:55 am", Status: "Validation Failed" },
    { id: "IMP-1040", File: "brand-enquiries.csv", Module: "Enquiries", Records: "184", Errors: "0", Duplicates: "4 reviewed", "Uploaded by": "Sana Khan", "Updated at": "20 Nov 2026, 4:08 pm", Status: "Completed" },
    { id: "IMP-1039", File: "finance-reconciliation.csv", Module: "Payments", Records: "92", Errors: "2", Duplicates: "0", "Uploaded by": "Rohan Kapoor", "Updated at": "20 Nov 2026, 2:12 pm", Status: "Partially Completed" },
    { id: "IMP-1038", File: "old-contact-list.csv", Module: "Contacts", Records: "—", Errors: "—", Duplicates: "—", "Uploaded by": "Maya Reddy", "Updated at": "19 Nov 2026, 11:02 am", Status: "Failed" },
  ],
  "Export Management": [
    { id: "EXP-2091", Scope: "Contacts · assigned region", Format: "CSV", Filters: "West · Active · 30 days", Fields: "9 permitted fields", "Requested by": "Aarav Mehta", "Created at": "21 Nov 2026, 8:40 am", Status: "Completed" },
    { id: "EXP-2090", Scope: "Opportunity summary", Format: "PDF", Filters: "Won · Q4 2026", Fields: "Summary only", "Requested by": "Maya Reddy", "Created at": "20 Nov 2026, 5:24 pm", Status: "Completed" },
    { id: "EXP-2089", Scope: "Finance · payment ledger", Format: "Excel", Filters: "Oct–Nov · Verified", Fields: "12 approved fields", "Requested by": "Rohan Kapoor", "Created at": "20 Nov 2026, 4:58 pm", Status: "Awaiting review" },
    { id: "EXP-2088", Scope: "Contact export", Format: "CSV", Filters: "Unfiltered request", Fields: "Restricted fields removed", "Requested by": "Sana Khan", "Created at": "19 Nov 2026, 2:16 pm", Status: "Blocked" },
  ],
  "Role-Based Access": [
    { id: "ROLE-CEO", Role: "CEO / Super Admin", Scope: "Organization-wide · approved admin", Users: "2", Permissions: "View · Create · Edit · Delete · Assign · Approve · Verify · Export · Configure · Administer", Status: "Active" },
    { id: "ROLE-MGR", Role: "Reporting Manager", Scope: "Authorized reporting team", Users: "8", Permissions: "View · Assign · Approve · team reports", Status: "Active" },
    { id: "ROLE-SALES", Role: "BDA / Sales Employee", Scope: "Assigned opportunities", Users: "31", Permissions: "View · Create · Edit · authorized activity", Status: "Active" },
    { id: "ROLE-MKT", Role: "Marketing", Scope: "Authorized marketing leads", Users: "4", Permissions: "View · Create · Edit · campaign attribution", Status: "Active" },
    { id: "ROLE-FIN", Role: "Finance", Scope: "Payments & invoices", Users: "5", Permissions: "View · Edit · Approve · Verify", Status: "Active" },
    { id: "ROLE-MIS", Role: "MIS / Operations", Scope: "Authorized reporting data", Users: "6", Permissions: "View · Export approved reports", Status: "Active" },
    { id: "ROLE-BRAND", Role: "Brand Administrator", Scope: "Assigned brand only", Users: "12", Permissions: "View · Edit · brand documents", Status: "Active" },
    { id: "ROLE-BREP", Role: "Brand Representative", Scope: "Assigned brand · limited", Users: "28", Permissions: "View · authorized enquiries", Status: "Active" },
    { id: "ROLE-HR", Role: "HR", Scope: "People & recruitment records", Users: "3", Permissions: "View · Create · Edit · authorized export", Status: "Active" },
    { id: "ROLE-IT", Role: "IT Administrator", Scope: "Technical operations · least privilege", Users: "4", Permissions: "View · Configure · technical Administer", Status: "Active" },
  ],
  "Record-Level Restrictions": [
    { id: "ACL-01", Role: "Sales employee", "Allowed records": "Assigned opportunities, associated contacts and authorized activity", "Blocked by default": "Other employees’ opportunities · financial records", "Enforced by": "User + assignment scope", Status: "Restricted" },
    { id: "ACL-02", Role: "Reporting manager", "Allowed records": "Authorized team records and assignment history", "Blocked by default": "Unrelated teams without authorization", "Enforced by": "Department + team", Status: "Restricted" },
    { id: "ACL-03", Role: "Marketing", "Allowed records": "Authorized marketing leads, attribution and conversions", "Blocked by default": "Unrelated finance and HR records", "Enforced by": "Marketing scope", Status: "Restricted" },
    { id: "ACL-04", Role: "Finance", "Allowed records": "Payment and invoice records needed for finance operations", "Blocked by default": "Unrelated Sales record changes", "Enforced by": "Finance scope", Status: "Restricted" },
    { id: "ACL-05", Role: "MIS / Operations", "Allowed records": "Authorized reporting datasets", "Blocked by default": "Operational record modifications", "Enforced by": "Read-only report scope", Status: "Restricted" },
    { id: "ACL-06", Role: "HR", "Allowed records": "Candidate, recruitment and approved employee records", "Blocked by default": "Restricted Sales and financial records", "Enforced by": "HR scope", Status: "Restricted" },
    { id: "ACL-07", Role: "Brand users", "Allowed records": "Records belonging to their authorized brand", "Blocked by default": "Other brands and unrestricted internal CRM", "Enforced by": "Brand ID boundary", Status: "Restricted" },
  ],
  "Authentication & Sessions": [
    { id: "SES-9021", User: "Aarav Mehta · IF2026001", Event: "Active session", Device: "Chrome · macOS", Location: "Pune, India", "Last activity": "21 Nov 2026, 9:24 am", MFA: "Enabled", Status: "Active" },
    { id: "SES-9018", User: "Maya Reddy · IF2026002", Event: "Login successful", Device: "Android app · Pixel 9", Location: "Hyderabad, India", "Last activity": "21 Nov 2026, 8:52 am", MFA: "Enabled", Status: "Active" },
    { id: "SES-9014", User: "Neha Sharma · IF2026004", Event: "3 failed sign-ins", Device: "Chrome · macOS", Location: "Unrecognized network", "Last activity": "21 Nov 2026, 9:14 am", MFA: "Not verified", Status: "Review" },
    { id: "SES-9001", User: "Rohan Kapoor · IF2026003", Event: "Session expired", Device: "Chrome · Windows", Location: "Mumbai, India", "Last activity": "20 Nov 2026, 6:12 pm", MFA: "Enabled", Status: "Expired" },
  ],
  "File & Document Security": [
    { id: "DOC-7421", File: "payment-proof-nov.pdf", Category: "Payment proof", "Linked record": "PAY-20418 · opportunity OPP-8021", "Uploaded by": "Rohan Kapoor", "Uploaded at": "20 Nov 2026", "Type · size": "PDF · 1.8 MB", Classification: "Restricted · Finance", Status: "Protected" },
    { id: "DOC-7419", File: "candidate-resume.pdf", Category: "Candidate resume", "Linked record": "CAN-1024 · application APP-208", "Uploaded by": "Neha Sharma", "Uploaded at": "19 Nov 2026", "Type · size": "PDF · 842 KB", Classification: "Restricted · HR", Status: "Protected" },
    { id: "DOC-7414", File: "brand-meeting-notes.docx", Category: "Meeting document", "Linked record": "MTG-6018 · brand BRD-033", "Uploaded by": "Maya Reddy", "Uploaded at": "18 Nov 2026", "Type · size": "DOCX · 326 KB", Classification: "Confidential · Brand", Status: "Protected" },
    { id: "DOC-7408", File: "call-recording-ENQ-40218.mp3", Category: "Call recording", "Linked record": "CALL-82018 · ENQ-40218", "Uploaded by": "Call service", "Uploaded at": "18 Nov 2026", "Type · size": "MP3 · 4.2 MB", Classification: "Restricted · Sales", Status: "Access logged" },
    { id: "DOC-7401", File: "brand-guidelines.pdf", Category: "Brand document", "Linked record": "BRD-012 · Acme Foods", "Uploaded by": "Brand administrator", "Uploaded at": "15 Nov 2026", "Type · size": "PDF · 2.4 MB", Classification: "Confidential · Brand", Status: "Protected" },
  ],
  "Sensitive Data Protection": [
    { id: "FLD-01", Field: "Mobile number", Category: "Personal data", Purpose: "Contact and authorized follow-up", Access: "Record-level permissions", Export: "Masked by default", "Last reviewed": "01 Nov 2026", Status: "Protected" },
    { id: "FLD-02", Field: "Email address", Category: "Personal data", Purpose: "Business communication", Access: "Record-level permissions", Export: "Role-approved only", "Last reviewed": "01 Nov 2026", Status: "Protected" },
    { id: "FLD-03", Field: "Payment proof", Category: "Financial data", Purpose: "Payment verification", Access: "Finance + authorized owner", Export: "Restricted", "Last reviewed": "05 Nov 2026", Status: "Restricted" },
    { id: "FLD-04", Field: "Candidate documents", Category: "Employment data", Purpose: "Recruitment evaluation", Access: "HR + authorized reviewer", Export: "Blocked by default", "Last reviewed": "05 Nov 2026", Status: "Restricted" },
    { id: "FLD-05", Field: "PAN", Category: "Sensitive identifier", Purpose: "Not collected for duplicate matching", Access: "Not configured", Export: "Not collected", "Last reviewed": "21 Nov 2026", Status: "Not collected" },
  ],
  "Data Retention & Deletion": [
    { id: "RET-01", Category: "Contact records", Period: "Active account + approved policy", "Approaching limit": "24 records", Policy: "Retain while active", Action: "Archive review", Status: "Configured" },
    { id: "RET-02", Category: "Opportunity & activity history", Period: "7 years after closure", "Approaching limit": "18 records", Policy: "Preserve linked history", Action: "Review after legal hold", Status: "Configured" },
    { id: "RET-03", Category: "Payments & invoices", Period: "8 years · Finance policy", "Approaching limit": "0 records", Policy: "Legal / financial hold", Action: "Deletion blocked", Status: "Protected" },
    { id: "RET-04", Category: "Candidate documents", Period: "2 years after application", "Approaching limit": "6 records", Policy: "HR review required", Action: "Archive or request deletion", Status: "Review due" },
    { id: "RET-05", Category: "Call recordings", Period: "180 days · consent dependent", "Approaching limit": "42 recordings", Policy: "Legal review required", Action: "Review retention basis", Status: "Review due" },
    { id: "RET-06", Category: "System logs & accounts", Period: "2 years · account lifecycle", "Approaching limit": "12 log sets", Policy: "Audit history preserved", Action: "Archive eligible logs", Status: "Configured" },
  ],
  "Audit Logs": [
    { id: "AUD-8841", User: "Aarav Mehta · IF2026001", Module: "Security & Devices", Record: "DV-2403", Action: "Device access revoked", "Previous value": "Approved", "New value": "Revoked", "Date and time": "21 Nov 2026, 9:16 am", "IP · device": "10.20.4.18 · Chrome", Result: "Completed" },
    { id: "AUD-8840", User: "Neha Sharma · IF2026004", Module: "Users & Accounts", Record: "IF2026017", Action: "Role assignment updated", "Previous value": "Sales User", "New value": "Sales Manager", "Date and time": "21 Nov 2026, 8:52 am", "IP · device": "10.20.4.22 · Chrome", Result: "Completed" },
    { id: "AUD-8839", User: "Aarav Mehta · IF2026001", Module: "Franchise Models & Pricing", Record: "MOD-203 · v4", Action: "Pricing version submitted", "Previous value": "₹14L", "New value": "₹15L · pending approval", "Date and time": "20 Nov 2026, 5:44 pm", "IP · device": "10.20.4.18 · Chrome", Result: "Awaiting Finance" },
    { id: "AUD-8838", User: "Sana Khan · IF2026005", Module: "Integrations", Record: "INT-07 · Google Sheets", Action: "Integration retry", "Previous value": "Failed", "New value": "Queued", "Date and time": "20 Nov 2026, 4:05 pm", "IP · device": "10.20.8.12 · Chrome", Result: "Queued" },
    { id: "AUD-8837", User: "Identity service", Module: "Authentication", Record: "Neha Sharma", Action: "Sign-in blocked", "Previous value": "—", "New value": "3 failed attempts", "Date and time": "20 Nov 2026, 3:18 pm", "IP · device": "203.0.113.24 · Unknown", Result: "Blocked" },
    { id: "AUD-8836", User: "Backup service", Module: "Backup & Recovery", Record: "BKP-1120", Action: "Backup verified", "Previous value": "Running", "New value": "Verified", "Date and time": "20 Nov 2026, 2:09 am", "IP · device": "Automated job", Result: "Completed" },
  ],
  "Security Monitoring": [
    { id: "SIG-8201", Signal: "Repeated failed login attempts", Resource: "Neha Sharma · IF2026004", Source: "Identity service", Detected: "21 Nov 2026, 9:14 am", "Recommended action": "Review sign-in and revoke unknown session", Severity: "High", Status: "Open" },
    { id: "SIG-8198", Signal: "Unusual data export volume", Resource: "EXP-2088 · Contacts", Source: "Export controls", Detected: "19 Nov 2026, 2:16 pm", "Recommended action": "Bulk export blocked · review user request", Severity: "Medium", Status: "Contained" },
    { id: "SIG-8192", Signal: "Permission change outside review window", Resource: "ROLE-SALES · Assign action", Source: "Access audit", Detected: "18 Nov 2026, 7:10 pm", "Recommended action": "Confirm approval record", Severity: "Medium", Status: "Under review" },
    { id: "SIG-8181", Signal: "Unauthorized device attempt", Resource: "DV-2409 · Android app", Source: "Device registry", Detected: "17 Nov 2026, 11:31 am", "Recommended action": "Device registration rejected", Severity: "Low", Status: "Closed" },
  ],
  "Security Incidents": [
    { id: "INC-2026-014", Type: "Repeated failed sign-ins", Severity: "High", Description: "Three failed attempts from an unrecognized network.", Detected: "21 Nov 2026, 9:14 am", Owner: "Aarav Mehta", Resource: "IF2026004 · Neha Sharma", Notes: "Verify with account owner before restoring access.", Status: "Detected" },
    { id: "INC-2026-013", Type: "Unusual export request", Severity: "Medium", Description: "Unfiltered contacts export was blocked by policy.", Detected: "19 Nov 2026, 2:16 pm", Owner: "Kavita Rao", Resource: "EXP-2088", Notes: "User notified; requested scope review.", Status: "Under Investigation" },
    { id: "INC-2026-012", Type: "Unauthorized device attempt", Severity: "Low", Description: "Unregistered device request rejected.", Detected: "17 Nov 2026, 11:31 am", Owner: "Aarav Mehta", Resource: "DV-2409", Notes: "No data access granted.", Status: "Contained" },
  ],
  "Backup & Recovery": [
    { id: "BKP-1121", Type: "Database · automated", Started: "21 Nov 2026, 2:00 am", Completed: "21 Nov 2026, 2:08 am", Verification: "Checksum verified", Retention: "30 days", "RPO · RTO": "24h · 4h", Location: "Private cloud · region AP-South", Status: "Verified" },
    { id: "BKP-1120", Type: "Database · automated", Started: "20 Nov 2026, 2:00 am", Completed: "20 Nov 2026, 2:09 am", Verification: "Checksum verified", Retention: "30 days", "RPO · RTO": "24h · 4h", Location: "Private cloud · region AP-South", Status: "Verified" },
    { id: "BKP-1119", Type: "Documents · incremental", Started: "20 Nov 2026, 1:30 am", Completed: "20 Nov 2026, 1:39 am", Verification: "Manifest verified", Retention: "90 days", "RPO · RTO": "12h · 8h", Location: "Private cloud · region AP-South", Status: "Verified" },
    { id: "BKP-1118", Type: "Database · automated", Started: "19 Nov 2026, 2:00 am", Completed: "—", Verification: "Completion not verified", Retention: "30 days", "RPO · RTO": "24h · 4h", Location: "Private cloud · region AP-South", Status: "Failed" },
    { id: "REC-014", Type: "Quarterly restore test", Started: "14 Nov 2026, 11:00 am", Completed: "14 Nov 2026, 11:47 am", Verification: "Test documented", Retention: "Audit record", "RPO · RTO": "24h · 4h", Location: "Isolated recovery environment", Status: "Completed" },
  ],
  "Data Synchronization": [
    { id: "SYN-4098", Service: "Android application", Record: "ENQ-40218 · update conflict", "Last sync": "21 Nov 2026, 9:20 am", Pending: "1 change", Retry: "Manual review first", Conflict: "Web record is newer", Status: "Conflict review" },
    { id: "SYN-4096", Service: "Google Sheets", Record: "INT-07 · contact batch", "Last sync": "21 Nov 2026, 8:05 am", Pending: "18 records", Retry: "Eligible", Conflict: "None detected", Status: "Failed" },
    { id: "SYN-4094", Service: "CRM database", Record: "AUD-8836 · backup manifest", "Last sync": "21 Nov 2026, 2:09 am", Pending: "0", Retry: "Not needed", Conflict: "None", Status: "Completed" },
    { id: "SYN-4088", Service: "Web application", Record: "OPP-8014 · stage history", "Last sync": "20 Nov 2026, 6:42 pm", Pending: "0", Retry: "Not needed", Conflict: "None", Status: "Completed" },
    { id: "SYN-4081", Service: "Meta Lead Ads", Record: "Campaign batch · 48 leads", "Last sync": "20 Nov 2026, 5:30 pm", Pending: "0", Retry: "Not needed", Conflict: "None", Status: "Completed" },
  ],
  "Privacy & Compliance": [
    { id: "PRV-018", Request: "Data access request", Subject: "Contact · CON-18420", Purpose: "Customer request", Received: "20 Nov 2026", Owner: "Privacy administrator", Due: "04 Dec 2026", Status: "Under review" },
    { id: "PRV-017", Request: "Data correction request", Subject: "Candidate · CAN-1024", Purpose: "Recruitment record correction", Received: "19 Nov 2026", Owner: "HR administrator", Due: "03 Dec 2026", Status: "Received" },
    { id: "PRV-016", Request: "Consent notice review", Subject: "Call recordings · Sales", Purpose: "Notice and purpose confirmation", Received: "18 Nov 2026", Owner: "Privacy administrator", Due: "—", Status: "Configured · review required" },
  ],
};

export const securityProfiles = ["CEO / Super Admin", "Reporting Manager", "BDA / Sales Employee", "Marketing", "Finance", "MIS / Operations", "Brand Administrator", "Brand Representative", "HR", "IT Administrator"] as const;
export type SecurityProfile = (typeof securityProfiles)[number];

