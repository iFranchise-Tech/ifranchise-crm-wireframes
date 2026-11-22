"use client";

import { useEffect, useState } from "react";
import { initialEnquiries } from "@/modules/leads/data";
import { initialUsers } from "@/modules/users-roles/data";
import type { CallRecord, CallingFlag, CallingSettings, CallingState } from "./types";

const storageKey = "ifranchise:calling-management:v1";
const stamp = (minutesAgo: number) => new Date(Date.now() - minutesAgo * 60_000).toISOString();
const activeSales = initialUsers.filter(user => user.status === "Active" && user.department === "Sales");
const leadOwner = (name: string) => activeSales.find(user => user.name === name) ?? activeSales[0];

const settings: CallingSettings = {
  unknownRepeatThreshold: 3,
  unknownLongCallMinutes: 10,
  highFrequencyThreshold: 18,
  recordingRetentionDays: 90,
  unknownMonitoring: true,
  managerMissedCallAlerts: true,
  reviewRequiredForUnknown: true,
};

function demoCall(index: number, minutesAgo: number, leadIndex: number, direction: "Incoming" | "Outgoing", status: CallRecord["status"], durationSeconds: number, unknown = false): CallRecord {
  const lead = initialEnquiries[leadIndex];
  const owner = leadOwner(lead.owner);
  const startedAt = stamp(minutesAgo);
  const connectedAt = durationSeconds > 0 ? new Date(new Date(startedAt).getTime() + 18_000).toISOString() : undefined;
  const endedAt = connectedAt ? new Date(new Date(connectedAt).getTime() + durationSeconds * 1000).toISOString() : undefined;
  return {
    id: `CALL-${String(6400 + index)}`,
    contactId: unknown ? undefined : lead.id,
    contactName: unknown ? undefined : lead.name,
    phone: unknown ? "+91 98990 12345" : `+91 ${lead.mobile.slice(0, 5)} ${lead.mobile.slice(5)}`,
    employeeId: owner.id,
    employeeName: owner.name,
    team: owner.team || "Sales",
    opportunityId: unknown ? undefined : lead.salesPipeline ? lead.id : undefined,
    direction,
    startedAt,
    connectedAt,
    endedAt,
    durationSeconds,
    ringingSeconds: durationSeconds > 0 ? 18 : 27,
    status,
    recording: index === 3 ? "Upload failed" : index === 6 ? "Metadata only" : "Unavailable",
    sourceDevice: "Android device · sample record",
    syncStatus: index === 3 ? "Upload failed" : "Synced · preview",
    disposition: durationSeconds > 0 ? ["Interested", "Follow-up required", "Information shared"][index % 3] : undefined,
    note: durationSeconds > 0 ? "Sample activity for workspace review." : undefined,
  };
}

const seedCalls: CallRecord[] = [
  demoCall(1, 22, 0, "Outgoing", "Connected", 612),
  demoCall(2, 76, 1, "Incoming", "Missed", 0),
  demoCall(3, 166, 2, "Outgoing", "Completed", 308),
  demoCall(4, 252, 0, "Incoming", "Rejected", 0),
  demoCall(5, 390, 4, "Outgoing", "Busy", 0),
  demoCall(6, 610, 5, "Incoming", "Connected", 183),
  demoCall(7, 875, 6, "Outgoing", "Voicemail suspected", 41),
  demoCall(8, 1130, 8, "Outgoing", "Failed", 0),
  demoCall(9, 49, 0, "Outgoing", "Connected", 720, true),
  demoCall(10, 113, 0, "Outgoing", "Connected", 312, true),
  demoCall(11, 205, 0, "Outgoing", "Missed", 0, true),
  demoCall(12, 349, 0, "Incoming", "Connected", 126, true),
].sort((a, b) => b.startedAt.localeCompare(a.startedAt));

export function detectCallingFlags(calls: CallRecord[], config: CallingSettings): CallingFlag[] {
  const result: CallingFlag[] = [];
  if (!config.unknownMonitoring) return result;
  const groups = new Map<string, CallRecord[]>();
  for (const call of calls) {
    if (!call.contactId && call.direction === "Outgoing") {
      const key = `${call.employeeId}:${call.phone}`;
      groups.set(key, [...(groups.get(key) ?? []), call]);
    }
  }
  for (const [, rows] of groups) {
    if (rows.length >= config.unknownRepeatThreshold) {
      const phone = rows[0].phone;
      const latest = [...rows].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
      const seconds = rows.reduce((sum, call) => sum + call.durationSeconds, 0);
      result.push({
        id: `FLAG-${rows[0].employeeId}-${phone.replace(/\D/g, "").slice(-4)}`,
        employeeId: rows[0].employeeId,
        employeeName: rows[0].employeeName,
        phone,
        reason: `${rows.length} outgoing attempts to an unregistered number. This is a review indicator, not a finding of misconduct.`,
        callIds: rows.map(call => call.id),
        count: rows.length,
        connectedSeconds: seconds,
        firstAt: rows.reduce((earliest, call) => call.startedAt < earliest ? call.startedAt : earliest, rows[0].startedAt),
        latestAt: latest[0].startedAt,
        severity: seconds >= config.unknownLongCallMinutes * 60 ? "High" : "Medium",
        status: "Detected",
      });
    }
  }
  const repeatedCallIds = new Set(result.flatMap(flag => flag.callIds));
  for (const call of calls) {
    if (call.contactId || call.direction !== "Outgoing" || call.durationSeconds < config.unknownLongCallMinutes * 60 || repeatedCallIds.has(call.id)) continue;
    result.push({ id: `FLAG-LONG-${call.id}`, employeeId: call.employeeId, employeeName: call.employeeName, phone: call.phone, reason: `A connected call to an unregistered number exceeded ${config.unknownLongCallMinutes} minutes. This is a review indicator only.`, callIds: [call.id], count: 1, connectedSeconds: call.durationSeconds, firstAt: call.startedAt, latestAt: call.startedAt, severity: "Medium", status: "Detected" });
  }
  const dailyByEmployee = new Map<string, CallRecord[]>();
  for (const call of calls) {
    if (call.direction !== "Outgoing") continue;
    const day = call.startedAt.slice(0, 10);
    const key = `${call.employeeId}:${day}`;
    dailyByEmployee.set(key, [...(dailyByEmployee.get(key) ?? []), call]);
  }
  for (const [, rows] of dailyByEmployee) {
    if (rows.length < config.highFrequencyThreshold) continue;
    const latest = [...rows].sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
    result.push({ id: `FLAG-FREQ-${latest.employeeId}-${latest.startedAt.slice(0, 10)}`, employeeId: latest.employeeId, employeeName: latest.employeeName, phone: "Multiple numbers", reason: `${rows.length} outgoing calls in one day exceeded the configured frequency threshold. Review workload context before drawing conclusions.`, callIds: rows.map(call => call.id), count: rows.length, connectedSeconds: rows.reduce((sum, call) => sum + call.durationSeconds, 0), firstAt: rows.reduce((earliest, call) => call.startedAt < earliest ? call.startedAt : earliest, rows[0].startedAt), latestAt: latest.startedAt, severity: "Medium", status: "Detected" });
  }
  return result;
}

export function createInitialCallingState(): CallingState {
  const flags = detectCallingFlags(seedCalls, settings);
  return {
    calls: seedCalls,
    flags,
    audit: [
      { id: "CA-1001", at: stamp(25), actor: "Calling monitor · preview", action: "Flag detected", recordId: flags[0]?.id ?? "—", detail: "Repeated unregistered outgoing calls met the configured review threshold." },
      { id: "CA-1002", at: stamp(80), actor: "Shakshay Gupta", action: "Missed call follow-up required", recordId: "CALL-6402", detail: "Missed incoming call retained for callback review." },
    ],
    settings: { ...settings },
    localContacts: [],
  };
}

function isCallingState(value: unknown): value is CallingState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<CallingState>;
  return Array.isArray(state.calls) && Array.isArray(state.flags) && Array.isArray(state.audit) && !!state.settings && Array.isArray(state.localContacts);
}

export function useCallingStore() {
  const [state, setState] = useState<CallingState | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (!isCallingState(parsed)) throw new Error("Saved calling preview data could not be read. It has not been overwritten.");
        setState(parsed);
      } else {
        const first = createInitialCallingState();
        window.localStorage.setItem(storageKey, JSON.stringify(first));
        setState(first);
      }
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Calling preview data could not be loaded."); }
    const onStorage = (event: StorageEvent) => {
      if (event.key !== storageKey) return;
      try {
        if (!event.newValue) setState(createInitialCallingState());
        else {
          const parsed: unknown = JSON.parse(event.newValue);
          if (!isCallingState(parsed)) throw new Error();
          setState(parsed);
        }
      } catch { setError("Updated calling preview data could not be read."); }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  function update(transform: (current: CallingState) => CallingState) {
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

export function newCallId(calls: CallRecord[]) {
  const next = Math.max(6400, ...calls.map(call => Number(call.id.replace(/\D/g, "")) || 0)) + 1;
  return `CALL-${next}`;
}

export function makeCallAudit(recordId: string, action: string, detail: string, actor = "CEO / Super Admin") {
  return { id: `CA-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, at: new Date().toISOString(), actor, action, recordId, detail };
}
