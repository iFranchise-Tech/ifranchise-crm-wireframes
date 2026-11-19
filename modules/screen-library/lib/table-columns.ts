export type ConfigurableColumn = { id: string; name: string };

const personalKey = (scope: string, userId: string) => `ifranchise:table-columns:${scope}:${userId}`;
const organizationKey = (scope: string) => `ifranchise:table-columns:organization:${scope}`;

function normalize(ids: unknown, columns: ConfigurableColumn[], requiredIds: string[]) {
  const valid = new Set(columns.map(column => column.id));
  const saved = Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string" && valid.has(id)) : [];
  return [...new Set([...requiredIds.filter(id => valid.has(id)), ...saved])];
}

export function readTableColumns(scope: string, userId: string, columns: ConfigurableColumn[], requiredIds: string[], fallback: string[]) {
  try {
    const personal = window.localStorage.getItem(personalKey(scope, userId));
    const organization = window.localStorage.getItem(organizationKey(scope));
    const stored = personal ?? organization;
    if (stored) return normalize(JSON.parse(stored), columns, requiredIds);
  } catch {
    // Use the built-in layout if saved preferences are unavailable or invalid.
  }
  return normalize(fallback, columns, requiredIds);
}

export function savePersonalTableColumns(scope: string, userId: string, ids: string[]) {
  window.localStorage.setItem(personalKey(scope, userId), JSON.stringify(ids));
}

export function saveOrganizationTableColumns(scope: string, ids: string[]) {
  window.localStorage.setItem(organizationKey(scope), JSON.stringify(ids));
}

export type ActiveCrmProfile = { id: string; name: string; title: string; label?: string };

export const activeCrmProfiles: ActiveCrmProfile[] = [
  { id: "ceo", name: "Mohammad Abrar", title: "Superadmin" },
  { id: "sumanth", name: "Gangaram Sumanth Reddy", label: "Sumanth Reddy", title: "Superadmin" },
  { id: "shakshay", name: "Shakshay Gupta", title: "Admin" },
  { id: "shiwali", name: "Shiwali Singh", title: "Admin" },
  { id: "swetha", name: "Swetha Chintada", title: "Admin" },
  { id: "sales", name: "Himani Bhargava Tapadiya", title: "Sales" },
  { id: "hr", name: "Ekta Pattanaik", title: "HR" },
  { id: "assignment-coordinator", name: "Anitha K", title: "Lead Coordinator" },
];

export function saveActiveCrmRole(profile: ActiveCrmProfile) {
  window.localStorage.setItem("ifranchise:active-crm-profile", JSON.stringify(profile));
  window.dispatchEvent(new Event("crm-profile-change"));
}

export function readActiveCrmRole(): ActiveCrmProfile {
  try {
    const stored = window.localStorage.getItem("ifranchise:active-crm-profile");
    if (stored) {
      const profile = JSON.parse(stored) as Partial<ActiveCrmProfile>;
      if (profile.id && profile.name && profile.title) return profile as ActiveCrmProfile;
    }
  } catch {
    // Use the assignment profile if no CRM role has been selected yet.
  }
  return { id: "assignment-coordinator", name: "Anitha K", title: "Lead Coordinator" };
}
