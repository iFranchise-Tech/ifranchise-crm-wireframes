import { actions, modules, type Role, type Grant, type User, type Device, type Audit, type Department } from './types';
const grant = (module: Grant['module'], scope: string, ...allowed: Grant['actions']): Grant => ({ module, scope, actions: allowed });
const role = (id: string, name: string, description: string, grants: Grant[], restrictions: string[], protectedView = false, protectedEdit = false): Role => ({ id, name, description, grants, restrictions, protectedView, protectedEdit, system: true });
// Review fixtures derived from PRD §2.3–2.5 and §15.2–15.4. These are not authorization rules.
export const initialRoles: Role[] = [
 role('ceo', 'CEO / Super Admin', 'Organization-wide oversight and administration.', modules.map(m => grant(m, 'Organization', ...actions)), ['All administrative and business changes remain auditable.'], true, true),
 role('manager', 'Reporting Manager', 'Lead and support an assigned sales team.', [grant('Lead Management','Own team','View','Edit'),grant('Lead Assignment','Own team','View','Assign'),grant('Sales Pipeline','Own team','View','Edit','Approve'),grant('Meetings & Follow-ups','Own team','View','Create','Edit'),grant('Payment Verification','Own team','View'),grant('Calling Records','Own team','View'),grant('MIS Reports','Own team','View')], ['Deal approval is limited to authorized team-level decisions.','No other-team access, financial verification, organization settings or unrestricted exports.','Reassignment must retain previous owner, new owner, actor, time and reason.']),
 role('bda', 'BDA / Sales Executive', 'Work on individually assigned leads and opportunities.', [grant('Lead Management','Own records','View'),grant('Sales Pipeline','Own records','View','Edit'),grant('Meetings & Follow-ups','Own records','View','Create','Edit'),grant('Payment Verification','Own records','View','Create'),grant('Calling Records','Own records','View'),grant('MIS Reports','Own records','View')], ['No lead reassignment, deletion, export or approval of own submissions.','Lead name, phone, email and original attribution are protected from editing.','Historical activities, call records and meetings cannot be deleted or rewritten.'],true),
 role('marketing', 'Marketing Manager / Executive', 'Manage campaigns, attribution and authorized allocation.', [grant('Lead Management','Authorized marketing records','View'),grant('Lead Assignment','Authorized marketing records','View','Assign'),grant('Sales Pipeline','Authorized marketing records','View'),grant('Meetings & Follow-ups','Authorized marketing records','View'),grant('Marketing & Meta','Department','View','Create','Edit','Configure'),grant('MIS Reports','Department','View')], ['No payment changes or financial approvals.','Allocation is restricted to authorized incoming leads.','Protected sales history and organization permissions are unavailable.']),
 role('finance', 'Finance Executive / Manager', 'Verify payments and manage invoicing.', [grant('Lead Management','Financially relevant records','View'),grant('Sales Pipeline','Financially relevant records','View'),grant('Meetings & Follow-ups','Financially relevant records','View'),grant('Payment Verification','Financially relevant records','View','Approve','Verify'),grant('Invoice Management','Department','View','Create','Edit'),grant('MIS Reports','Department','View')], ['Payment proofs may be viewed, never modified.','No lead ownership, attribution or sales-history changes.','Self-approval requires a separately authorized policy.']),
 role('mis', 'MIS / Operations Executive', 'Read authorized operational and performance reports.', ['Lead Management','Sales Pipeline','Meetings & Follow-ups','Payment Verification','Invoice Management','Marketing & Meta','Calling Records','MIS Reports'].map(m=>grant(m as Grant['module'],'Authorized reporting records','View')), ['View-only access; no operational edits or approvals.','Export requires separate explicit authorization.']),
 role('brand', 'Brand User', 'Review only information associated with the assigned brand.', [grant('Lead Management','Assigned brand','View'),grant('Sales Pipeline','Closed deals · assigned brand','View'),grant('Meetings & Follow-ups','Assigned brand','View'),grant('Invoice Management','Assigned brand','View'),grant('MIS Reports','Assigned brand','View')], ['No other-brand data or internal employee information.','Customer contact details require explicit authorization.','No internal finance verification or payment modification.']),
 role('hr', 'HR Executive', 'Manage recruitment, candidates and job enquiries.', [grant('HR & Job Enquiries','Department','View','Create','Edit')], ['No franchise sales, finance or unrelated employee data.','Organization-wide system configuration is unavailable.']),
 role('it', 'IT Administrator', 'Administer accounts, devices and technical configuration.', [grant('Lead Management','Authorized technical access','View'),grant('Marketing & Meta','Authorized technical access','Configure'),grant('Calling Records','Authorized technical access','View'),grant('System Administration','Authorized technical access','View','Create','Edit','Configure','Administer')], ['Technical administration does not grant financial or deal approval.','Confidential business access requires separate authorization.','Critical configuration, account and device changes are audited.'])
];
export const initialDepartments: Department[] = ['Sales','Marketing','MIS / Operations','Finance','Leadership','IT','HR','Brands'].map(name=>({name,description:`${name} department`}));
const names = [
  [
    "IF2024001",
    "Abdul Khader Syed",
    "ceo",
    "Leadership",
    "Founder & Director",
    "",
    "",
    "Active"
  ],
  [
    "IF2026001",
    "Ekta Pattanaik",
    "hr",
    "HR",
    "HR & Operations Executive",
    "",
    "",
    "Active"
  ],
  [
    "IF2026009",
    "Gangaram Sumanth Reddy",
    "it",
    "IT",
    "Software Development Engineer (SDE)",
    "",
    "",
    "Active"
  ],
  [
    "IF2026002",
    "Himani Bhargava Tapadiya",
    "bda",
    "Sales",
    "Business Development Associate",
    "",
    "",
    "Active"
  ],
  [
    "IF2024002",
    "Mohammad Abrar",
    "ceo",
    "Leadership",
    "Co - Founder",
    "",
    "",
    "Active"
  ],
  [
    "IF2026023",
    "Naman Thapliyal",
    "marketing",
    "Marketing",
    "Graphic Designer cum Video Editor",
    "",
    "",
    "Active"
  ],
  [
    "IF2026015",
    "Prajjwal Negi",
    "marketing",
    "Marketing",
    "Content & Social Media Intern",
    "",
    "",
    "Active"
  ],
  [
    "IF2026017",
    "Samit Ali",
    "it",
    "IT",
    "UI/UX Designer Intern",
    "",
    "",
    "Active"
  ],
  [
    "IF2026021",
    "Shakshay Gupta",
    "manager",
    "Sales",
    "Assistant Business Development Manager",
    "",
    "",
    "Active"
  ],
  [
    "IF2026020",
    "Shiwali Singh",
    "manager",
    "Sales",
    "Assistant Business Development Manager",
    "",
    "",
    "Active"
  ],
  [
    "IF2026014",
    "Sneha Mahajan",
    "marketing",
    "Marketing",
    "Content & Social Media Intern",
    "",
    "",
    "Active"
  ],
  [
    "IF2026010",
    "Swetha Chintada",
    "manager",
    "Sales",
    "Assistant Business Development Manager",
    "",
    "",
    "Active"
  ],
  [
    "IF2026019",
    "Vennapusa Hemavathi",
    "it",
    "IT",
    "QA Testing Intern",
    "",
    "",
    "Active"
  ],
  [
    "IF2026018",
    "Vivek Rawat",
    "marketing",
    "Marketing",
    "Performance Marketing Specialist",
    "",
    "",
    "Active"
  ]
];
export const initialUsers: User[] = names.map(([id,name,roleId,department,designation,manager,team,status])=>({id,name,email:`${id.toLowerCase()}@example.com`,mobile:'',department,designation,roleId,manager,team,brand:'',status:status as User['status'],created:'02 Nov 2026',lastLogin:'—'}));
export const initialDevices: Device[] = [
{id:'AND-1042',userId:'IF2026002',name:'Galaxy A55',model:'Samsung Galaxy A55',os:'Android 15',app:'1.0.0',registered:'04 Nov 2026',synced:'11 Nov 2026, 08:45',status:'Approved'},
{id:'AND-1043',userId:'IF2026009',name:'Pixel 9',model:'Google Pixel 9',os:'Android 16',app:'1.0.0',registered:'10 Nov 2026',synced:'Not synced',status:'Pending approval'}
];
export const initialAudit: Audit[] = [{id:'AUD-1001',actor:'Review administrator',action:'Role reviewed',target:'Reporting Manager',before:'—',after:'Sample permissions reviewed',date:'11 Nov 2026, 08:30',reason:'UI review example'}];
