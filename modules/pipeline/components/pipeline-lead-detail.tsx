"use client";

import { EnquiryDetail } from "@/modules/leads/components/enquiry-detail";
import { initialActivities, initialEnquiries } from "@/modules/leads/data";
import type { Activity, Enquiry } from "@/modules/leads/types";
import { initialOpportunities } from "../data";
import { opportunityLead } from "../records";
import type { Opportunity, PipelineStage } from "../types";

type Props = {
  opportunity: Opportunity;
  stages: PipelineStage[];
  owners: string[];
  contacts: { name: string; email: string }[];
  actor: string;
  onBack: () => void;
  onPatch: (patch: Partial<Opportunity>) => void;
  onStageChange: (stage?: string) => void;
  onDelete: () => void;
};

export function PipelineLeadDetail({ opportunity, stages, owners, contacts, actor, onBack, onPatch, onStageChange, onDelete }: Props) {
  const isOriginalLead = initialOpportunities.some(item => item.id === opportunity.id && item.enquiryId === opportunity.enquiryId);
  const enquiry = opportunityLead(opportunity, stages, isOriginalLead ? initialEnquiries.find(item => item.id === opportunity.enquiryId) : undefined);
  const activities = opportunity.leadActivities ?? (isOriginalLead ? initialActivities.filter(item => item.enquiryId === opportunity.enquiryId) : []);
  const pipelineActivities: Activity[] = (opportunity.activities ?? []).map(item => ({
    id: item.id, enquiryId: enquiry.id, title: item.title, summary: item.note, when: item.at,
    kind: /meeting/i.test(item.title) ? "meeting" : "call", status: "Completed", type: "Phone Call",
    due: item.at, direction: "Outgoing", outcome: item.title, followUp: "", manual: true, createdBy: "", createdAt: item.at,
  }));
  const stageActivities: Activity[] = opportunity.history.map((entry, index) => ({
    id: `pipeline-stage-${opportunity.id}-${opportunity.history.length - index}`, enquiryId: enquiry.id, title: `Stage: ${entry.stage}`,
    summary: entry.note ?? `Opportunity moved to ${entry.stage}.`, when: entry.at, kind: "follow-up", status: "Completed",
    type: "Pipeline stage", due: entry.at, direction: "—", outcome: "Other", followUp: "", manual: false, createdBy: "", createdAt: entry.at,
  }));
  const hidden = new Set(opportunity.hiddenActivityIds ?? []);
  // Stored edits take precedence over activities derived from the pipeline log.
  const allActivities = [...new Map([...stageActivities, ...pipelineActivities, ...activities].map(item => [item.id, item])).values()].filter(item => !hidden.has(item.id));

  function saveLead(patch: Partial<Enquiry>) {
    onPatch({
      leadDetails: { ...opportunity.leadDetails, ...patch },
      ...(patch.name !== undefined && { name: patch.name }),
      ...(patch.email !== undefined && { email: patch.email }),
      ...(patch.mobile !== undefined && { phone: patch.mobile }),
      ...(patch.brand !== undefined && { brand: patch.brand }),
      ...(patch.owner !== undefined && { owner: patch.owner }),
      ...(patch.originalSource !== undefined && { source: patch.originalSource }),
      ...(patch.received !== undefined && { createdAt: patch.received }),
    });
  }
  function addActivity(patch: Partial<Activity>) {
    const now = new Date().toISOString();
    const activity: Activity = {
      id: `ACT-${crypto.randomUUID()}`, enquiryId: enquiry.id, title: "Follow-up", kind: "follow-up", status: "Scheduled",
      due: now, type: "Task", when: now, direction: "—", summary: "", outcome: "Follow-up Required", followUp: "",
      manual: true, createdBy: actor, createdAt: now, ...patch,
    };
    onPatch({ leadActivities: [activity, ...activities], lastActivity: "Just now" });
  }

  return <EnquiryDetail
    enquiry={enquiry} activities={allActivities} owners={owners} contacts={contacts} canDelete
    pipelineStages={stages.map(stage => stage.name)} onPipelineStageChange={onStageChange}
    backLabel="Back to sales pipeline" onBack={onBack} onSave={saveLead}
    onStatus={status => saveLead({ status })} onDeleteEnquiry={onDelete}
    onSchedule={update => {
      if (update.id) {
        onPatch({ leadActivities: allActivities.map(item => item.id === update.id ? { ...item, due: update.due, when: update.due, meetLink: update.meetLink, status: "Scheduled" } : item) });
      } else addActivity({ title: update.title ?? "Follow-up call", kind: update.kind ?? "follow-up", type: update.type ?? "Phone Call", due: update.due, when: update.due, meetLink: update.meetLink, summary: update.summary ?? "Follow-up scheduled." });
    }}
    onPatchActivity={(id, patch) => onPatch({ leadActivities: allActivities.map(item => item.id === id ? { ...item, ...patch } : item) })}
    onDeleteActivity={id => onPatch({ leadActivities: activities.filter(item => item.id !== id), hiddenActivityIds: [...hidden, id] })}
    onCreateTask={task => addActivity({ ...task, when: task.due, kind: "follow-up", type: "Task" })}
    onCreateNote={note => addActivity({ title: note.title, summary: note.detail, noteType: note.noteType, pinned: note.pinned, kind: "follow-up", type: "Other Communication", status: "Completed", outcome: "Other" })}
  />;
}
