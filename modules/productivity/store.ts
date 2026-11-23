"use client";

import { useEffect, useState } from "react";
import { initialUsers } from "@/modules/users-roles/data";
import type { ProductivityState, ProductivityStatus } from "./types";

const storageKey = "ifranchise:employee-productivity:v1";
const todayInIndia = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
const asIso = (date: Date) => date.toISOString();
const uid = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

export const activeEmployees = initialUsers.filter(user => user.status === "Active");

export function createInitialProductivityState(now = Date.now()): ProductivityState {
  const date = new Date(now);
  const day = todayInIndia(date);
  const yesterday = todayInIndia(new Date(now - 86_400_000));
  const workingDays = [1, 2, 3, 4, 5];
  const policy = {
    id: "POL-001", name: "Standard CRM workday", description: "Default schedule for customer-facing and operations teams.", scope: "Organization", workingStart: "10:00", workingEnd: "19:00", workingDays, firstBreakTime: "12:00", lunchTime: "14:00", secondBreakTime: "16:00",
    firstBreakMinutes: 15, lunchMinutes: 60, secondBreakMinutes: 15, minimumGapMinutes: 60, breakEndingSoonMinutes: 5, requireManagerReview: true,
    effectiveFrom: day, version: 1, updatedAt: asIso(date), updatedBy: "HR · preview",
  };
  const statuses = Object.fromEntries(activeEmployees.map((employee, index) => [employee.id, (["Available", "In Meeting", "On Call", "Available", "Away", "Available", "Lunch", "Available", "Offline", "Available", "In Meeting", "Available", "On Call", "Available"][index % 14]) as ProductivityStatus]));
  const statusHistory = activeEmployees.map((employee, index) => ({ id: `ST-${String(4200 + index)}`, employeeId: employee.id, status: statuses[employee.id], at: asIso(new Date(now - (index + 1) * 11 * 60_000)), source: "Sample preview" as const, note: "Review fixture · not a live presence signal" }));
  const schedules = activeEmployees.map(employee => ({ employeeId: employee.id, startTime: policy.workingStart, endTime: policy.workingEnd, workingDays, effectiveFrom: day, location: "Hyderabad · IST", timezone: "Asia/Kolkata", source: "Policy" as const }));
  const salesEmployees = activeEmployees.filter(employee => employee.department === "Sales");
  const activity = activeEmployees.slice(0, 8).flatMap((employee, index) => [
    { id: `ACT-${4300 + index * 2}`, employeeId: employee.id, at: asIso(new Date(`${day}T10:00:00+05:30`)), kind: "Work session", title: "Working day started", detail: "Schedule start · 10:00 AM IST", source: "Sample preview" as const },
    { id: `ACT-${4301 + index * 2}`, employeeId: employee.id, at: asIso(new Date(now - (index + 1) * 24 * 60_000)), kind: "Follow-up", title: index % 2 ? "Follow-up completed" : "Customer follow-up due", detail: "Linked to Meetings & Follow-ups sample activity", source: "CRM record" as const, recordId: `FU-${1001 + index}` },
  ]);
  const breaks = [
    { id: "BRK-4021", employeeId: salesEmployees[0]?.id ?? activeEmployees[0].id, kind: "First-half break" as const, startAt: asIso(new Date(now - 86_400_000 + 4 * 60 * 60_000)), expectedEndAt: asIso(new Date(now - 86_400_000 + 4 * 60 * 60_000 + 15 * 60_000)), endAt: asIso(new Date(now - 86_400_000 + 4 * 60 * 60_000 + 18 * 60_000)), allowedMinutes: 15, status: "Overrun" as const, previousStatus: "Available" as const, overrunMinutes: 3 },
    { id: "BRK-4022", employeeId: salesEmployees[1]?.id ?? activeEmployees[1].id, kind: "Lunch" as const, startAt: asIso(new Date(now - 86_400_000 + 5 * 60 * 60_000)), expectedEndAt: asIso(new Date(now - 86_400_000 + 6 * 60 * 60_000)), endAt: asIso(new Date(now - 86_400_000 + 6 * 60 * 60_000)), allowedMinutes: 60, status: "Completed" as const, previousStatus: "Available" as const },
  ];
  const exceptions = [{ id: "EXC-208", employeeId: salesEmployees[0]?.id ?? activeEmployees[0].id, date: yesterday, type: "First-half break overrun", scheduled: "15 minutes", actual: "18 minutes · +3m", status: "Open" as const, remarks: "", history: [{ at: asIso(new Date(now - 86_400_000 + 4 * 60 * 60_000 + 18 * 60_000)), actor: "System", action: "Exception recorded", note: "Actual end time preserved." }] }];
  return { schedules, scheduleHistory: [], statuses, statusHistory, breaks, activity, exceptions, corrections: [], adjustments: [], policy, policyHistory: [], notificationPreferences: { breakEndingSoon: true, breakExceeded: true, lunchEndingSoon: true, lunchExceeded: true, scheduleUpdated: true, meetingConflict: true, statusChanged: false } };
}

function validState(value: unknown): value is ProductivityState {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<ProductivityState>;
  return Array.isArray(data.schedules) && Array.isArray(data.scheduleHistory) && !!data.statuses && Array.isArray(data.statusHistory) && Array.isArray(data.breaks) && Array.isArray(data.activity) && Array.isArray(data.exceptions) && Array.isArray(data.corrections) && Array.isArray(data.adjustments) && !!data.policy && Array.isArray(data.policyHistory) && !!data.notificationPreferences;
}

export function useProductivityStore() {
  const [state, setState] = useState<ProductivityState | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (!validState(parsed)) throw new Error("Saved productivity data could not be read. It has not been overwritten.");
        setState(parsed);
      } else {
        const initial = createInitialProductivityState();
        window.localStorage.setItem(storageKey, JSON.stringify(initial));
        setState(initial);
      }
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Unable to load productivity records."); }
    const onStorage = (event: StorageEvent) => {
      if (event.key !== storageKey) return;
      try { if (event.newValue) { const parsed: unknown = JSON.parse(event.newValue); if (!validState(parsed)) throw new Error(); setState(parsed); } else setState(createInitialProductivityState()); }
      catch { setError("Updated productivity records could not be read."); }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  function update(transform: (current: ProductivityState) => ProductivityState) {
    setState(current => {
      if (!current) return current;
      const next = transform(current);
      try { window.localStorage.setItem(storageKey, JSON.stringify(next)); }
      catch { setError("Your change could not be saved in this browser."); return current; }
      return next;
    });
  }
  return { state, update, error, ready: state !== null };
}

export function activityEvent(employeeId: string, title: string, kind: string, detail: string, source: "Manual" | "System event" | "CRM record", now = Date.now(), recordId?: string) {
  return { id: uid("ACT"), employeeId, title, kind, detail, source, at: asIso(new Date(now)), recordId };
}
