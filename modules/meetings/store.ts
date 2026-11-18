"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { initialEnquiries } from "@/modules/leads/data";
import { opportunityLead } from "@/modules/pipeline/records";
import { initialStages } from "@/modules/pipeline/data";
import { initialOpportunities } from "@/modules/pipeline/data";
import { readActiveCrmRole } from "@/modules/screen-library/lib/table-columns";
import { audit, collectReminders, defaultSettings, meetingProfiles } from "./records";
import type { CustomerRecord, FollowUp, Meeting, MeetingsState } from "./types";

const key = "ifranchise:meetings-followups:v1";
const empty: MeetingsState = { records: [], followUps: [], meetings: [], notifications: [], settings: defaultSettings };
let current = empty;
let initialized = false;
const listeners = new Set<() => void>();
const publish = () => listeners.forEach(listener => listener());
function readStored(): MeetingsState | null {
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  const state = JSON.parse(raw) as MeetingsState;
  if (!Array.isArray(state.records) || !Array.isArray(state.followUps) || !Array.isArray(state.meetings) || !Array.isArray(state.notifications) || !state.settings) throw new Error("Saved meeting data could not be read. It has not been overwritten.");
  return state;
}
function directory(previous: CustomerRecord[] = []) {
  let hasSavedPipeline = false;
  let opportunities = initialOpportunities;
  try { const stored = JSON.parse(window.localStorage.getItem("ifranchise-sales-pipeline-v1") || "null"); if (Array.isArray(stored?.opportunities)) { opportunities = stored.opportunities; hasSavedPipeline = true; } } catch { /* Keep the review fixtures when no pipeline state is available. */ }
  const records: CustomerRecord[] = initialEnquiries.map(item => ({ id: item.id, name: item.name, email: item.email, owner: item.owner, brand: item.brand, category: item.category, snapshot: item }));
  for (const record of previous) { const index = records.findIndex(item => item.id === record.id); if (index >= 0) records[index] = record; else records.push(record); }
  for (const item of opportunities) {
    const existing = records.find(record => record.id === item.enquiryId);
    if (!hasSavedPipeline && existing && previous.some(record => record.id === existing.id)) { existing.opportunityId = item.id; continue; }
    const value = { id: item.enquiryId, name: item.name, email: item.email, owner: item.owner, brand: item.brand, category: existing?.category ?? "Franchise", opportunityId: item.id, snapshot: opportunityLead(item, initialStages, existing?.snapshot) };
    if (existing) Object.assign(existing, value); else records.push(value);
  }
  return records;
}
function seed(records: CustomerRecord[], now: number): MeetingsState {
  const date = (offset: number) => new Date(now + offset * 60_000).toISOString();
  const followUps: FollowUp[] = records.filter(record => record.opportunityId).slice(0, 8).map((record, index) => ({
    id: `FU-${1001 + index}`, recordId: record.id, linkType: "Enquiry", title: ["Confirm investment range", "Share the franchise proposal", "Discuss expansion locations", "Collect application documents"][index % 4], description: "Contact the customer, confirm the agreed next step, and record the outcome.", assignedTo: record.owner, dueAt: date([-180, 25, 90, 1440][index % 4]), priority: index % 3 === 0 ? "High" : "Medium", status: index === 6 ? "Completed" : "Pending", outcome: index === 6 ? "Customer received the proposal and agreed to a brand discussion." : "", version: 1, createdAt: date(-2880),
    source: index === 0 ? { id: "ACT-1001", recordId: record.id, title: "Follow-up call", type: "Phone Call", when: "12 Nov 2026, 4:00 PM" } : undefined,
    history: [audit("Follow-up created", "Review sample · Next customer action recorded.", record.owner, now - 2880 * 60_000), ...(index === 6 ? [audit("Follow-up completed", "Customer received the proposal and agreed to a brand discussion.", record.owner, now - 60_000)] : [])],
  }));
  const meetings: Meeting[] = records.filter(record => record.opportunityId).slice(0, 5).map((record, index) => ({
    id: `MTG-${1001 + index}`, recordId: record.id, opportunityId: record.opportunityId!, title: ["Franchise discovery discussion", "Investment and location review", "Brand expansion discussion"][index % 3], category: index === 0 ? "Manager meeting" : "Follow-up meeting", format: index % 2 ? "In person" : "Virtual", startAt: date(index === 0 ? -120 : 150 + index * 1440), duration: 30, assignedTo: record.owner, participants: index === 0 ? [record.owner, "Shakshay Gupta"] : [record.owner], manager: index === 0 ? "Shakshay Gupta" : "", brandRepresentative: "", brandEmail: "", customerEmail: record.email, agenda: "Review customer requirements, investment expectations and the next steps.", remarks: "", location: index % 2 ? "iFranchise office" : "", address: index % 2 ? "Jubilee Hills, Hyderabad, Telangana" : "", meetLink: "", status: index === 0 ? "Awaiting MOM" : "Pending sync", outcome: index === 0 ? "Conducted: Customer discussed budget and shortlisted locations." : "", version: 1, createdAt: date(-2880), minutes: [], history: [audit("Meeting created", "Review sample · Calendar integration is not connected; no invitations sent.", record.owner, now - 2880 * 60_000), ...(index === 0 ? [audit("Meeting outcome recorded", "Conducted: Customer discussed budget and shortlisted locations.", record.owner, now - 90 * 60_000)] : [])],
  }));
  return { records, followUps, meetings, notifications: [], settings: defaultSettings };
}
function initialize() {
  if (initialized || typeof window === "undefined") return;
  const stored = readStored();
  const records = directory(stored?.records);
  current = stored ? { ...stored, records } : seed(records, Date.now());
  current = collectReminders(current);
  window.localStorage.setItem(key, JSON.stringify(current));
  initialized = true;
  publish();
}
export function updateMeetings(transform: (state: MeetingsState) => MeetingsState) {
  initialize();
  const latest = readStored() ?? current;
  const next = collectReminders(transform(latest));
  window.localStorage.setItem(key, JSON.stringify(next));
  current = next;
  publish();
}
export function withCustomer(state: MeetingsState, record: CustomerRecord): MeetingsState {
  const previous = state.records.find(item => item.id === record.id);
  const merged = { ...previous, ...record, opportunityId: record.opportunityId ?? previous?.opportunityId };
  return { ...state, records: [...state.records.filter(item => item.id !== record.id), merged] };
}
export function useMeetings() {
  const state = useSyncExternalStore(callback => { listeners.add(callback); return () => { listeners.delete(callback); }; }, () => current, () => empty);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    try { initialize(); const records = directory(current.records); if (JSON.stringify(records) !== JSON.stringify(current.records)) updateMeetings(state => ({ ...state, records })); } catch (failure) { setError(failure instanceof Error ? failure.message : "Unable to load meeting data."); }
    const refresh = () => {
      setNow(Date.now());
      try {
        const next = collectReminders(current);
        if (next !== current) updateMeetings(state => collectReminders(state));
      } catch { setError("Reminders could not be saved in this browser."); }
    };
    const onStorage = (event: StorageEvent) => { if (event.key === key) { try { current = readStored() ?? empty; publish(); } catch { setError("Could not read updated meeting data."); } } };
    const timer = window.setInterval(refresh, 15_000);
    window.addEventListener("storage", onStorage);
    return () => { window.clearInterval(timer); window.removeEventListener("storage", onStorage); };
  }, [state === empty]);
  return { state, now, error, ready: state !== empty };
}
export function useMeetingProfile() {
  const [profile, setProfile] = useState(meetingProfiles.at(-1)!);
  useEffect(() => { const read = () => setProfile(meetingProfiles.find(item => item.id === readActiveCrmRole().id) ?? meetingProfiles.at(-1)!); read(); window.addEventListener("crm-profile-change", read); window.addEventListener("storage", read); return () => { window.removeEventListener("crm-profile-change", read); window.removeEventListener("storage", read); }; }, []);
  return [profile, setProfile] as const;
}
