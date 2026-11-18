"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  RiAddLine, RiArrowRightLine, RiBarChartBoxLine, RiCalendarLine,
  RiCheckLine, RiCloseLine, RiCoinsLine, RiDeleteBinLine,
  RiEditLine, RiFileList3Line, RiFireLine, RiFilter3Line, RiLayoutColumnLine,
  RiMore2Fill, RiPhoneLine, RiSearchLine, RiStackLine, RiTrophyLine,
} from "@remixicon/react";
import { IconButton } from "@/components/base/buttons/icon-button";
import { Button } from "@/components/base/buttons/button";
import { Chip } from "@/components/base/badges/chip";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { Select, SelectItem } from "@/components/base/select/select";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/base/modal/modal";
import { Textarea } from "@/components/base/textarea/textarea";
import { Icon } from "@/modules/auth/components/icon";
import { ReviewShell } from "@/modules/screen-library/components/review-shell";
import { DirectionProvider } from "@/components/foundations/direction/direction";
import { ScrollFade, useScrollFade } from "@/components/foundations/scroll-fade/scroll-fade";
import { brands, initialOpportunities, initialPipelines, initialStages, lostReasons, owners } from "../data";
import type { Opportunity, PipelineConfig, PipelineStage } from "../types";
import { ColumnManagerModal } from "@/modules/screen-library/components/column-manager-modal";
import { readActiveCrmRole, readTableColumns, savePersonalTableColumns } from "@/modules/screen-library/lib/table-columns";
import { AdvancedLeadFilters, type LeadAdvancedFilters, type LeadFilterField } from "@/modules/leads/components/advanced-lead-filters";
import { PipelineLeadDetail } from "./pipeline-lead-detail";
import { OpportunityActions, type OpportunityAction } from "./opportunity-actions";
import { matchesOpportunityFilters, validateOpportunity, type OpportunityDraft } from "../records";
import { originalSources } from "@/modules/leads/types";
import { cx } from "@/utils/cx";
import "@/modules/leads/components/leads.css";

type ModalKind = "create" | "edit" | "stage" | "activity" | "payment" | "lost" | "reopen" | "delete" | "pipelines" | "stage-config" | "create-pipeline" | null;
type ViewMode = "kanban" | "list";
const opportunityColumns = [
  { id: "person", name: "Opportunity" }, { id: "brand", name: "Brand" },
  { id: "stage", name: "Stage" }, { id: "owner", name: "Owner" },
  { id: "value", name: "Deal value" }, { id: "lastActivity", name: "Last activity" },
  { id: "email", name: "Email" }, { id: "phone", name: "Contact number" },
  { id: "source", name: "Lead source" }, { id: "created", name: "Enquiry date" },
  { id: "nextAction", name: "Next action" },
];
const defaultColumns = opportunityColumns.slice(0, 6).map(column => column.id);
const formFieldClass = "h-10 border border-border-button-default bg-background-primary-default text-text-primary";
const STORAGE_KEY = "ifranchise-sales-pipeline-v1";
const TRANSITIONS: Record<string, string[]> = {
  new: ["rnr", "cold", "lost"], rnr: ["cold", "lost"], cold: ["manager-meeting", "lost"],
  "manager-meeting": ["warm", "lost"], warm: ["brand-meeting", "lost"], "brand-meeting": ["hot", "lost"],
  hot: ["token", "lost"], token: ["won", "lost"], won: [], lost: [],
};
const money = (value: number) => `₹${(value / 10000000).toFixed(value >= 10000000 ? 2 : 2)} Cr`;
const stageName = (stages: PipelineStage[], id: string) => stages.find(stage => stage.id === id)?.name ?? id;
const stamp = () => new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date());
const todayKey = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

export function SalesPipelineWorkspace() {
  const workspaceFade = useScrollFade();
  const workspaceRef = useRef<HTMLDivElement>(null);
  const previousScroll = useRef(0);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<LeadAdvancedFilters | null>(null);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [columnIds, setColumnIds] = useState(defaultColumns);
  const [profile, setProfile] = useState({ id: "assignment-coordinator", name: "Anitha K" });
  useEffect(() => { setProfile(readActiveCrmRole()); }, []);
  useEffect(() => {
    workspaceRef.current?.scrollTo({ top: detailId ? 0 : previousScroll.current });
    workspaceFade.reset();
  }, [detailId]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>(initialOpportunities);
  const [stages, setStages] = useState<PipelineStage[]>(initialStages);
  const [pipelineConfigs, setPipelineConfigs] = useState<PipelineConfig[]>(initialPipelines);
  const [activePipelineId, setActivePipelineId] = useState("franchise");
  const [isHydrated, setIsHydrated] = useState(false);
  const [query, setQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState("All brands");
  const [ownerFilter, setOwnerFilter] = useState("All owners");
  const [stageFilter, setStageFilter] = useState("All stages");
  const [dateFilter, setDateFilter] = useState("This month");
  const [view, setView] = useState<ViewMode>("kanban");
  const [modal, setModal] = useState<ModalKind>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [targetStage, setTargetStage] = useState("");
  const [rnrTarget, setRnrTarget] = useState("");
  const [pipelineName, setPipelineName] = useState("Franchise Sales Pipeline");
  const [pipelineDescription, setPipelineDescription] = useState("Primary pipeline for franchise sales opportunities, from enquiry to deal closure.");
  const [form, setForm] = useState<OpportunityDraft>({ pipelineId: "franchise", name: "", email: "", phone: "", brand: brands[0] ?? "", owner: owners[0] ?? "", source: "Website", value: "7500000", stageId: "new", nextAction: "Make initial contact" });
  const [activity, setActivity] = useState({ outcome: "Completed", note: "", minutes: "" });
  const [payment, setPayment] = useState({ amount: "", reference: "", date: "", verified: false });
  const [lostReason, setLostReason] = useState(lostReasons[0]);
  const [otherReason, setOtherReason] = useState("");
  const [reopenReason, setReopenReason] = useState("");
  const [newStage, setNewStage] = useState({ name: "", probability: "10", color: "blue" });
  const [newPipeline, setNewPipeline] = useState({ name: "", description: "" });
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const state = JSON.parse(saved) as { opportunities?: Opportunity[]; stages?: PipelineStage[]; pipelineName?: string; pipelineDescription?: string; pipelines?: PipelineConfig[]; activePipelineId?: string };
        if (state.opportunities) setOpportunities(state.opportunities.map(item => ({ ...item, pipelineId: item.pipelineId ?? "franchise" })));
        if (state.pipelines?.length) {
          setPipelineConfigs(state.pipelines);
          const active = state.pipelines.find(item => item.id === state.activePipelineId) ?? state.pipelines.find(item => item.isDefault) ?? state.pipelines[0];
          setActivePipelineId(active.id);
          setStages(active.stages);
          setPipelineName(active.name);
          setPipelineDescription(active.description);
        } else {
          if (state.stages) setStages(state.stages);
          if (state.pipelineName) setPipelineName(state.pipelineName);
          if (state.pipelineDescription) setPipelineDescription(state.pipelineDescription);
        }
      }
    } catch { window.localStorage.removeItem(STORAGE_KEY); }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ opportunities, stages, pipelineName, pipelineDescription, pipelines: pipelineConfigs, activePipelineId }));
  }, [isHydrated, opportunities, stages, pipelineName, pipelineDescription, pipelineConfigs, activePipelineId]);

  function updateStages(next: PipelineStage[] | ((current: PipelineStage[]) => PipelineStage[])) {
    const updated = typeof next === "function" ? next(stages) : next;
    setStages(updated);
    setPipelineConfigs(configs => configs.map(config => config.id === activePipelineId ? { ...config, stages: updated } : config));
  }
  function updatePipelineName(value: string) {
    setPipelineName(value);
    setPipelineConfigs(configs => configs.map(config => config.id === activePipelineId ? { ...config, name: value } : config));
  }
  function updatePipelineDescription(value: string) {
    setPipelineDescription(value);
    setPipelineConfigs(configs => configs.map(config => config.id === activePipelineId ? { ...config, description: value } : config));
  }
  function selectPipeline(id: string) {
    const pipeline = pipelineConfigs.find(item => item.id === id);
    if (!pipeline) return;
    setActivePipelineId(id);
    setStages(pipeline.stages);
    setPipelineName(pipeline.name);
    setPipelineDescription(pipeline.description);
    setStageFilter("All stages");
    setAdvancedFilters(null);
  }

  const columnScope = `pipeline:${activePipelineId}`;
  useEffect(() => {
    setColumnIds(readTableColumns(columnScope, profile.id, opportunityColumns, ["person"], defaultColumns));
  }, [columnScope, profile.id]);
  const detailOpportunity = opportunities.find(item => item.id === detailId) ?? null;
  const filterFields: LeadFilterField[] = [
    { id: "person", name: "Opportunity name", type: "text" },
    { id: "enquiryId", name: "Enquiry ID", type: "text" },
    { id: "brand", name: "Brand", type: "select", options: brands },
    { id: "owner", name: "Owner", type: "select", options: owners },
    { id: "stage", name: "Stage", type: "select", options: stages.map(stage => stage.name) },
    { id: "source", name: "Lead source", type: "select", options: [...originalSources] },
    { id: "email", name: "Email", type: "text" }, { id: "phone", name: "Contact number", type: "text" },
    { id: "created", name: "Enquiry date", type: "date" }, { id: "value", name: "Deal value", type: "text" },
  ];
  const selected = opportunities.find(item => item.id === selectedId) ?? null;
  const activeOpportunities = opportunities.filter(item => item.pipelineId === activePipelineId);
  const quickFiltered = useMemo(() => activeOpportunities.filter(item =>
    `${item.name} ${item.enquiryId} ${item.brand} ${item.owner}`.toLowerCase().includes(query.trim().toLowerCase()) &&
    (brandFilter === "All brands" || item.brand === brandFilter) &&
    (ownerFilter === "All owners" || item.owner === ownerFilter) &&
    (stageFilter === "All stages" || item.stageId === stageFilter) &&
    (dateFilter === "All time" || new Date(item.createdAt).getMonth() === new Date().getMonth() && new Date(item.createdAt).getFullYear() === new Date().getFullYear()),
  ), [activeOpportunities, query, brandFilter, ownerFilter, stageFilter, dateFilter]);
  const filtered = quickFiltered.filter(item => matchesOpportunityFilters(item, advancedFilters, stages));
  const activeFilterCount = advancedFilters?.rules.length ?? 0;

  function openDetails(id: string) {
    previousScroll.current = workspaceRef.current?.scrollTop ?? 0;
    closeModal();
    setDetailId(id);
  }
  function handleAction(action: OpportunityAction, item: Opportunity) {
    if (action === "details") { openDetails(item.id); return; }
    if (action === "clone") { cloneOpportunity(item.id); return; }
    begin(action === "stage" && item.stageId === "lost" ? "reopen" : action, item.id);
  }
  function requestDetailStage(name?: string) {
    if (!detailOpportunity) return;
    begin(detailOpportunity.stageId === "lost" ? "reopen" : "stage", detailOpportunity.id);
    if (!name || detailOpportunity.stageId === "lost") return;
    const target = stages.find(stage => stage.name === name);
    if (target && (TRANSITIONS[detailOpportunity.stageId] ?? []).includes(target.id)) setTargetStage(target.id);
    else setNotice("This stage is not available directly. Choose an available next stage below.");
  }

  const active = activeOpportunities.filter(item => !["won", "lost"].includes(item.stageId));
  const hot = active.filter(item => item.stageId === "hot" || item.stageId === "token");
  const tokenCount = activeOpportunities.filter(item => item.stageId === "token" || item.stageId === "won").length;
  const wonMonth = activeOpportunities.filter(item => item.stageId === "won").length;

  function closeModal() { setModal(null); setTargetStage(""); setRnrTarget(""); setNotice(""); }
  function patchOpportunity(id: string, patch: Partial<Opportunity>) { setOpportunities(current => current.map(item => item.id === id ? { ...item, ...patch } : item)); }
  function begin(kind: ModalKind, id?: string) {
    setSelectedId(id ?? null);
    setNotice("");
    if (kind === "create") setForm({ pipelineId: activePipelineId, name: "", email: "", phone: "", brand: brands[0] ?? "", owner: owners[0] ?? "", source: "Website", value: "7500000", stageId: "new", nextAction: "Make initial contact" });
    if (kind === "edit" && id) { const opportunity = opportunities.find(item => item.id === id); if (opportunity) setForm({ pipelineId: opportunity.pipelineId, name: opportunity.name, email: opportunity.email, phone: opportunity.phone, brand: opportunity.brand, owner: opportunity.owner, source: opportunity.source, value: String(opportunity.value), stageId: opportunity.stageId, nextAction: opportunity.nextAction }); }
    if (kind === "stage" && id) { const opportunity = opportunities.find(item => item.id === id); if (opportunity) setTargetStage(TRANSITIONS[opportunity.stageId]?.[0] ?? ""); }
    if (kind === "lost") { setLostReason(lostReasons[0]); setOtherReason(""); }
    if (kind === "reopen") setReopenReason("");
    if (kind === "activity") setActivity({ outcome: "Completed", note: "", minutes: "" });
    if (kind === "payment") setPayment({ amount: "", reference: "", date: new Date().toISOString().slice(0, 10), verified: false });
    setModal(kind);
  }

  function saveOpportunity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validateOpportunity(form, pipelineConfigs, modal === "edit");
    if (validationError) { setNotice(validationError); return; }
    const value = Number(form.value);
    const normalizedForm = { ...form, name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), nextAction: form.nextAction.trim() };
    if (modal === "edit" && selected) {
      patchOpportunity(selected.id, { ...normalizedForm, value, history: selected.history });
    } else {
      const id = `OPP-${Math.max(1000, ...opportunities.map(item => (Number(item.id.slice(4)) || 0) + 1))}`;
      const enquiryId = `ENQ-${Math.max(2400, ...opportunities.map(item => Number(item.enquiryId.replace(/\D/g, "")) || 0)) + 1}`;
      const name = form.name.trim();
      const stage = stageName(pipelineConfigs.find(item => item.id === form.pipelineId)?.stages ?? stages, form.stageId);
      setOpportunities(current => [{ ...normalizedForm, id, enquiryId, name, value, createdAt: new Date().toISOString(), lastActivity: "Just now", history: [{ stage, at: stamp() }], payments: [], verifiedAmount: 0 }, ...current]);
    }
    if (form.pipelineId !== activePipelineId) selectPipeline(form.pipelineId);
    closeModal();
  }

  function moveOpportunity() {
    if (!selected || !targetStage) return;
    if (targetStage === "lost") { setModal("lost"); setLostReason(lostReasons[0]); setOtherReason(""); return; }
    if (selected.stageId === "manager-meeting" && targetStage === "warm" && (!selected.meetingComplete || !selected.meetingMinutes?.trim())) { setNotice("Complete the manager meeting and add meeting minutes before moving to Warm."); return; }
    if (selected.stageId === "brand-meeting" && targetStage === "hot" && (!selected.meetingComplete || !selected.meetingMinutes?.trim())) { setNotice("Complete the brand meeting and add meeting minutes before moving to Hot."); return; }
    if (selected.stageId === "token" && targetStage === "won" && (selected.verifiedAmount ?? 0) < selected.value) { setNotice(`Finance must verify the full ${money(selected.value)} deal amount before this opportunity can be Won.`); return; }
    const nextStageName = stageName(stages, targetStage);
    const rnrNote = targetStage === "rnr" ? `RNR update ${todayKey()} · RNR 1 · follow-up email queued in prototype; delivery is not connected.` : undefined;
    patchOpportunity(selected.id, { stageId: targetStage, rnrStep: targetStage === "rnr" ? 1 : undefined, lastActivity: "Just now", history: [{ stage: nextStageName, at: stamp(), note: rnrNote }, ...selected.history] });
    closeModal();
  }

  function confirmLost() {
    if (!selected || (lostReason === "Other" && !otherReason.trim())) { setNotice("Add a reason when selecting Other."); return; }
    if (selected.stageId === "won") { setNotice("Won opportunities cannot be marked Lost. Reopen with an authorized correction if the deal status is wrong."); return; }
    const reason = lostReason === "Other" ? otherReason.trim() : lostReason;
    patchOpportunity(selected.id, { stageId: "lost", lostReason: reason, lastActivity: "Just now", history: [{ stage: "Lost", at: stamp(), note: reason }, ...selected.history] });
    closeModal();
  }

  function saveActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const meetingReady = ["manager-meeting", "brand-meeting"].includes(selected.stageId) && activity.outcome === "Meeting conducted";
    const note = activity.note.trim();
    if (meetingReady && !note) { setNotice("Add the meeting minutes before saving a conducted meeting."); return; }
    const title = meetingReady ? "Meeting conducted" : activity.outcome;
    patchOpportunity(selected.id, { lastActivity: "Just now", nextAction: activity.outcome === "Meeting scheduled" ? "Attend scheduled meeting" : "Follow up", activities: [{ id: `ACT-${Date.now()}`, title, at: stamp(), note: note || "No additional notes." }, ...(selected.activities ?? [])], ...(meetingReady ? { meetingComplete: true, meetingMinutes: note } : {}) });
    setNotice(`${activity.outcome} logged for ${selected.name}.`);
    window.setTimeout(closeModal, 650);
  }

  function savePayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const amount = Number(payment.amount);
    if (!amount || amount <= 0 || !payment.reference.trim()) { setNotice("Enter a payment amount and transaction reference."); return; }
    if (amount > Math.max(0, selected.value - (selected.verifiedAmount ?? 0))) { setNotice("The payment amount is greater than the remaining deal balance."); return; }
    const payments = [...(selected.payments ?? []), { id: `PAY-${Date.now()}`, amount, date: payment.date, reference: payment.reference.trim(), verified: payment.verified }];
    const verifiedAmount = payments.reduce((sum, item) => sum + (item.verified ? item.amount : 0), 0);
    patchOpportunity(selected.id, { payments, verifiedAmount, lastActivity: "Just now", nextAction: verifiedAmount >= selected.value ? "Close as Won" : "Collect balance", history: [{ stage: payment.verified ? "Payment verified" : "Payment submitted", at: stamp(), note: `${money(amount)} · ${payment.reference.trim()}` }, ...selected.history] });
    closeModal();
  }

  function saveReopen() {
    if (!selected || !reopenReason.trim()) { setNotice("Add a reason to reopen this opportunity."); return; }
    patchOpportunity(selected.id, { stageId: "new", lostReason: undefined, lastActivity: "Just now", history: [{ stage: "Reopened · New Opportunity", at: stamp(), note: reopenReason.trim() }, ...selected.history] });
    closeModal();
  }

  function deleteOpportunity() {
    if (!selected) return;
    setOpportunities(current => current.filter(item => item.id !== selected.id));
    if (detailId === selected.id) setDetailId(null);
    closeModal();
  }

  function cloneOpportunity(id: string) {
    const source = opportunities.find(item => item.id === id);
    if (!source) return;
    const nextNumber = Math.max(1000, ...opportunities.map(item => (Number(item.id.slice(4)) || 0) + 1));
    const nextEnquiry = Math.max(2400, ...opportunities.map(item => Number(item.enquiryId.replace(/\D/g, "")) || 0)) + 1;
    const clone: Opportunity = { ...source, id: `OPP-${nextNumber}`, enquiryId: `ENQ-${nextEnquiry}`, name: `${source.name} (copy)`, stageId: "new", rnrStep: undefined, createdAt: new Date().toISOString(), leadActivities: [], hiddenActivityIds: [], lastActivity: "Just now", meetingComplete: false, meetingMinutes: undefined, verifiedAmount: 0, activities: [], lostReason: undefined, nextAction: "Make initial contact", history: [{ stage: "New Opportunity", at: stamp(), note: "Cloned opportunity" }], payments: [] };
    setOpportunities(current => [clone, ...current]);
    setNotice(`${source.name} was cloned.`);
  }

  function createStage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newStage.name.trim()) return;
    const stage: PipelineStage = { id: `custom-${Date.now()}`, name: newStage.name.trim(), probability: Number(newStage.probability), category: "Open", color: newStage.color, children: [] };
    updateStages(current => [...current.slice(0, -2), stage, ...current.slice(-2)]);
    setNewStage({ name: "", probability: "10", color: "blue" }); setModal("pipelines");
  }

  function createPipeline(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newPipeline.name.trim();
    if (!name) { setNotice("Enter a pipeline name."); return; }
    if (pipelineConfigs.some(config => config.name.toLowerCase() === name.toLowerCase())) { setNotice("A pipeline with this name already exists."); return; }
    const pipeline: PipelineConfig = { id: `pipeline-${Date.now()}`, name, description: newPipeline.description.trim() || "A separate opportunity workflow.", stages: initialStages, isDefault: false };
    setPipelineConfigs(current => [...current, pipeline]);
    setNewPipeline({ name: "", description: "" });
    setActivePipelineId(pipeline.id); setStages(pipeline.stages); setPipelineName(pipeline.name); setPipelineDescription(pipeline.description); setModal("pipelines");
  }

  const title = modal === "create" ? "Add opportunity" : modal === "edit" ? "Edit opportunity" : modal === "stage" ? `Move ${selected?.name ?? "opportunity"}` : modal === "activity" ? "Log activity" : modal === "payment" ? "Record payment" : modal === "lost" ? "Mark opportunity as Lost" : modal === "reopen" ? "Reopen opportunity" : modal === "delete" ? "Delete opportunity?" : modal === "pipelines" ? "Pipeline management" : modal === "create-pipeline" ? "Create a pipeline" : "Add a pipeline stage";

  const managingPipeline = ["pipelines", "stage-config", "create-pipeline"].includes(modal ?? "");
  const navigation = <nav className="review-navigation sp-side-nav" aria-label="Sales Pipeline navigation">
    <Button variant={!managingPipeline ? "primary" : "ghost"} className="w-full justify-start" leadingIcon={RiStackLine} aria-current={!managingPipeline ? "page" : undefined} onClick={event => { setDetailId(null); closeModal(); event.currentTarget.closest("dialog")?.close(); }}>Sales pipeline</Button>
    <Button variant={managingPipeline ? "primary" : "ghost"} className="w-full justify-start" leadingIcon={RiEditLine} aria-current={managingPipeline ? "page" : undefined} onClick={event => { event.currentTarget.closest("dialog")?.close(); begin("pipelines"); }}>Pipeline management</Button>
  </nav>;

  return <DirectionProvider locale="en-US"><ReviewShell className="sp-shell" moduleName="Sales Pipeline" icon="layers" subtitle="Opportunities, stages & closure" overviewHref="/library/modules/pipeline" title={detailOpportunity ? detailOpportunity.enquiryId : managingPipeline ? "Pipeline management" : view === "list" ? "Pipeline list" : "Pipeline board"} navigation={navigation}>
    <div className="relative min-h-0"><div ref={workspaceRef} className={cx("review-information sp-workspace", detailOpportunity && "sp-detail-workspace")} onScroll={workspaceFade.onScroll}>
    {modal === null && notice ? <div className="sp-toast" role="status"><RiCheckLine />{notice}<button aria-label="Dismiss notification" onClick={() => setNotice("")}><RiCloseLine /></button></div> : null}
    {detailOpportunity ? <PipelineLeadDetail
      key={detailOpportunity.id} opportunity={detailOpportunity} stages={stages} owners={owners}
      contacts={opportunities.map(item => ({ name: item.name, email: item.email }))}
      actor={profile.name} onBack={() => setDetailId(null)}
      onPatch={patch => patchOpportunity(detailOpportunity.id, patch)}
      onStageChange={requestDetailStage} onDelete={() => begin("delete", detailOpportunity.id)}
    /> : <>
    <div className="sp-page-heading">
      <div><p className="sp-eyebrow">OPPORTUNITY MANAGEMENT</p><h2>Sales Pipeline</h2><p>Track and manage franchise opportunities from first enquiry to closure.</p></div>
      <div className="sp-header-actions">
        <div className="sp-header-tools">
          <div className="flex gap-1" role="group" aria-label="Pipeline view">
            <Button iconOnly variant={view === "kanban" ? "primary" : "secondary"} className="size-10" leadingIcon={RiStackLine} aria-label="Board view" title="Board view" aria-pressed={view === "kanban"} onClick={() => setView("kanban")} />
            <Button iconOnly variant={view === "list" ? "primary" : "secondary"} className="size-10" leadingIcon={RiFileList3Line} aria-label="List view" title="List view" aria-pressed={view === "list"} onClick={() => setView("list")} />
          </div>
          <IconButton icon={RiFilter3Line} className={cx("size-10", activeFilterCount > 0 && "bg-accent-50 text-accent-700")} aria-label="Advanced filters" title={activeFilterCount ? `Advanced filters (${activeFilterCount} applied)` : "Advanced filters"} aria-pressed={advancedFiltersOpen || activeFilterCount > 0} onClick={() => setAdvancedFiltersOpen(true)} />
          <IconButton icon={RiLayoutColumnLine} className="size-10" aria-label="Customize columns" title="Customize list columns" onClick={() => { setView("list"); setColumnsOpen(true); }} />
        </div>
        <Select aria-label="Active pipeline" selectedKey={activePipelineId} onSelectionChange={key => selectPipeline(String(key))} className="sp-active-pipeline" triggerClassName="h-10">{pipelineConfigs.map(item => <SelectItem key={item.id} id={item.id}>{item.name}</SelectItem>)}</Select><Button className="h-10" leadingIcon={RiAddLine} onClick={() => begin("create")}>Add opportunity</Button></div>
    </div>

    <section className="sp-kpis" aria-label="Pipeline summary">
      <Metric icon={RiStackLine} label="Active opportunities" value={String(active.length)} detail="Across open stages" tone="blue" />
      <Metric icon={RiBarChartBoxLine} label="Pipeline value" value={money(active.reduce((sum, item) => sum + item.value, 0))} detail="Open opportunity value" tone="purple" />
      <Metric icon={RiFireLine} label="Hot opportunities" value={String(hot.length)} detail="Hot and token stages" tone="rose" />
      <Metric icon={RiCoinsLine} label="Token collected" value={String(tokenCount)} detail="Awaiting final close" tone="green" />
      <Metric icon={RiTrophyLine} label="Won this month" value={String(wonMonth)} detail="Closed opportunities" tone="amber" />
    </section>

    <section className="sp-board-panel">
      <div className="sp-toolbar">
        <Input className="sp-search" label="Search" aria-label="Search opportunities" leadingIcon={RiSearchLine} fieldClassName="h-10 border border-border-button-default bg-background-primary-default" placeholder="Search opportunities, customers…" value={query} onChange={setQuery} />
        <Select className="sp-filter" label="Brand" aria-label="Filter by brand" selectedKey={brandFilter} onSelectionChange={key => setBrandFilter(String(key))} triggerClassName="h-10"><SelectItem id="All brands">All brands</SelectItem>{brands.map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</Select>
        <Select className="sp-filter" label="Owner" aria-label="Filter by owner" selectedKey={ownerFilter} onSelectionChange={key => setOwnerFilter(String(key))} triggerClassName="h-10"><SelectItem id="All owners">All owners</SelectItem>{owners.map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</Select>
        <Select className="sp-filter" label="Date" aria-label="Filter by date" selectedKey={dateFilter} onSelectionChange={key => setDateFilter(String(key))} triggerClassName="h-10"><SelectItem id="This month">This month</SelectItem><SelectItem id="All time">All time</SelectItem></Select>
        <Select className="sp-filter" label="Stage" aria-label="Filter by stage" selectedKey={stageFilter} onSelectionChange={key => setStageFilter(String(key))} triggerClassName="h-10"><SelectItem id="All stages">All stages</SelectItem>{stages.map(item => <SelectItem key={item.id} id={item.id}>{item.name}</SelectItem>)}</Select>

      </div>
      {view === "kanban" ? <div className="sp-board-scroller"><div className="sp-board" aria-label="Sales pipeline stages">
        {stages.map(stage => {
          const items = filtered.filter(opportunity => opportunity.stageId === stage.id);
          const amount = items.reduce((sum, item) => sum + item.value, 0);
          return <section className="sp-lane" data-tone={stage.color} key={stage.id} aria-label={`${stage.name} stage`}>
            <header className="sp-lane-header"><div><span>{stage.name}</span><small>{money(amount)}</small></div><Chip variant="caption" color={stage.color === "purple" || stage.color === "violet" ? "purple" : stage.color === "green" ? "lime" : stage.color === "rose" || stage.color === "red" ? "rose" : stage.color === "amber" || stage.color === "orange" ? "yellow" : "blue"}>{items.length}</Chip></header>
            {stage.id === "rnr" && stage.children?.length ? <div className="sp-rnr-note">8 response attempts tracked separately</div> : null}
            <LaneCards>{items.map(opportunity => <OpportunityCard key={opportunity.id} opportunity={opportunity} onDetails={() => openDetails(opportunity.id)} onAction={action => handleAction(action, opportunity)} />)}</LaneCards>
            {items.length === 0 ? <div className="sp-empty-lane">No opportunities</div> : null}
          </section>;
        })}
      </div></div> : <div className="sp-list-wrap"><table className="sp-table" aria-label="Opportunities"><thead><tr>{columnIds.map(id => <th key={id}>{opportunityColumns.find(column => column.id === id)?.name}</th>)}<th aria-label="Actions" /></tr></thead><tbody>{filtered.map(item => <tr key={item.id} className="cursor-pointer hover:bg-background-secondary-hover" onClick={event => { if (!(event.target as HTMLElement).closest("button, a, [role=dialog]")) openDetails(item.id); }}>
        {columnIds.map(id => <td key={id}>
          {id === "person" ? <button className="sp-table-link outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring" onClick={() => openDetails(item.id)}><strong>{item.name}</strong><small>{item.enquiryId}</small></button>
            : id === "stage" ? <Chip variant="caption" color="blue">{stageName(stages, item.stageId)}{item.stageId === "rnr" ? ` · ${item.rnrStep}/8` : ""}</Chip>
            : id === "value" ? money(item.value)
            : id === "created" ? new Date(item.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })
            : item[id as keyof Opportunity] as string}
        </td>)}
        <td className="sp-row-actions"><OpportunityActions name={item.name} isLost={item.stageId === "lost"} onAction={action => handleAction(action, item)} /></td>
      </tr>)}</tbody></table>{filtered.length === 0 ? <div className="sp-no-results">No opportunities match these filters.</div> : null}</div>}
    </section>
    </>}

    <Modal isOpen={advancedFiltersOpen} onOpenChange={setAdvancedFiltersOpen} size="sm" aria-label="Advanced opportunity filters">
      <ModalBody className="p-0">
        <AdvancedLeadFilters fields={filterFields} scope={columnScope} userId={profile.id} title="Advanced filters" description="Narrow down your opportunities." recordLabel="opportunities" showRelatedRecords={false} className="sp-advanced-panel" searchPlaceholder="Search opportunity fields"
          initialFilters={advancedFilters} resultCount={filtered.length} activeFilterCount={activeFilterCount}
          countFor={filters => quickFiltered.filter(item => matchesOpportunityFilters(item, filters, stages)).length}
          onApply={filters => { setAdvancedFilters(filters); setAdvancedFiltersOpen(false); }}
          onClear={() => setAdvancedFilters(null)} onClose={() => setAdvancedFiltersOpen(false)} />
      </ModalBody>
    </Modal>
    <ColumnManagerModal isOpen={columnsOpen} onOpenChange={setColumnsOpen} availableColumns={opportunityColumns} selectedIds={columnIds} requiredIds={["person"]} scopeLabel="sales pipeline opportunities"
      onSave={ids => { setColumnIds(ids); savePersonalTableColumns(columnScope, profile.id, ids); setColumnsOpen(false); }} />

    <Modal isOpen={modal !== null} onOpenChange={open => { if (!open) closeModal(); }} size={modal === "pipelines" ? "xl" : "lg"}>
      <ModalHeader title={title} description={modal === "stage" ? "Choose a valid next step. Required meeting notes and verified payments are checked before a move is saved." : modal === "create" ? "Create an opportunity and place it in the correct pipeline stage." : modal === "pipelines" ? "Manage the default franchise pipeline and its stage sequence." : undefined} />
      {modal === "create" || modal === "edit" ? <form className="flex min-h-0 flex-col gap-4" onSubmit={saveOpportunity}>
        <ModalBody className="sp-modal-form"><div className="sp-form-grid">
          <Input label="Customer / enquiry name" isRequired fieldClassName={formFieldClass} value={form.name} onChange={name => setForm(current => ({ ...current, name }))} placeholder="Customer or business name" />
          <Input label="Email (optional)" type="email" fieldClassName={formFieldClass} value={form.email} onChange={email => setForm(current => ({ ...current, email }))} placeholder="name@example.com" />
          <Input label="Contact number" type="tel" isRequired fieldClassName={formFieldClass} value={form.phone} onChange={phone => setForm(current => ({ ...current, phone }))} placeholder="+91 00000 00000" />
          <Select label="Brand" isRequired triggerClassName="h-10" selectedKey={form.brand} onSelectionChange={key => setForm(current => ({ ...current, brand: String(key) }))}>{brands.map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</Select>
          <Select label="Assigned to" isRequired triggerClassName="h-10" selectedKey={form.owner} onSelectionChange={key => setForm(current => ({ ...current, owner: String(key) }))}>{owners.map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</Select>
          <Input label="Expected deal value (₹)" type="number" isRequired fieldClassName={formFieldClass} value={form.value} onChange={value => setForm(current => ({ ...current, value }))} />
          {modal === "create" ? <Select label="Pipeline" isRequired triggerClassName="h-10" selectedKey={form.pipelineId} onSelectionChange={key => setForm(current => ({ ...current, pipelineId: String(key), stageId: "new" }))}>{pipelineConfigs.map(item => <SelectItem key={item.id} id={item.id}>{item.name}</SelectItem>)}</Select> : <Input label="Pipeline" isReadOnly fieldClassName={formFieldClass} value={pipelineConfigs.find(item => item.id === form.pipelineId)?.name ?? pipelineName} />}
          <Input label={modal === "create" ? "Initial stage" : "Pipeline stage"} isReadOnly isRequired fieldClassName={formFieldClass} value={modal === "create" ? "New Opportunity" : stageName(stages, form.stageId)} hint={modal === "create" ? "New opportunities start here." : "Use Update stage to change the stage."} />
          <Select label="Lead source" isRequired triggerClassName="h-10" selectedKey={form.source} onSelectionChange={key => setForm(current => ({ ...current, source: String(key) }))}>{[...new Set([...originalSources, form.source].filter(Boolean))].map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</Select>
          <Input label="Next action (optional)" fieldClassName={formFieldClass} value={form.nextAction} onChange={nextAction => setForm(current => ({ ...current, nextAction }))} />
        </div>{notice ? <p className="sp-notice" role="alert">{notice}</p> : null}</ModalBody>
        <ModalFooter><Button variant="secondary" onClick={closeModal}>Cancel</Button><Button type="submit" leadingIcon={RiCheckLine}>{modal === "edit" ? "Save opportunity" : "Create opportunity"}</Button></ModalFooter>
      </form> : null}

      {modal === "stage" && selected ? <ModalBody className="sp-modal-form"><div className="sp-move-person"><span>{selected.name.slice(0, 1).toUpperCase()}</span><div><strong>{selected.name}</strong><small>{selected.enquiryId} · {selected.brand}</small></div></div><div className="sp-stage-flow"><div><span>Current stage</span><strong>{stageName(stages, selected.stageId)}{selected.stageId === "rnr" ? ` · RNR ${selected.rnrStep ?? 1}` : ""}</strong></div><RiArrowRightLine /><div><span>New stage</span><Select aria-label="New stage" selectedKey={targetStage || undefined} onSelectionChange={key => setTargetStage(String(key))} triggerClassName="sp-modal-select"><SelectItem id="">Choose a stage</SelectItem>{selected.stageId === "rnr" && (selected.rnrStep ?? 1) < 8 ? <SelectItem id="rnr">RNR response attempt</SelectItem> : null}{(TRANSITIONS[selected.stageId] ?? []).map(id => <SelectItem key={id} id={id}>{stageName(stages, id)}</SelectItem>)}</Select></div></div>{selected.stageId === "rnr" && targetStage === "rnr" ? <div className="sp-rnr-selector"><p>Next response attempt · RNR {(selected.rnrStep ?? 1) + 1} of 8</p><div>{(stages.find(item => item.id === "rnr")?.children ?? []).map((step, index) => <button key={step} type="button" disabled={index + 1 !== (selected.rnrStep ?? 1) + 1} aria-pressed={String(index + 1) === rnrTarget} onClick={() => setRnrTarget(String(index + 1))}>{step}</button>)}</div><p>Limit: two RNR updates per opportunity per day. This prototype records the activity for review; it does not send email.</p></div> : null}{notice ? <p className="sp-notice" role="alert">{notice}</p> : null}<ModalFooter className="sp-inline-footer"><Button variant="secondary" onClick={closeModal}>Keep current stage</Button><Button onClick={() => { if (selected.stageId === "rnr" && targetStage === "rnr") { const isoDay = todayKey(); const todaysRnrUpdates = selected.history.filter(entry => entry.note?.includes(`RNR update ${isoDay}`)).length; if (todaysRnrUpdates >= 2) { setNotice("This opportunity has reached the two RNR updates allowed for today."); return; } const step = Number(rnrTarget); if (!step || step !== (selected.rnrStep ?? 1) + 1) { setNotice("RNR attempts must be completed in order."); return; } const entry = { stage: "RNR", at: stamp(), note: `RNR update ${isoDay} · RNR ${step} · follow-up email queued in prototype; delivery is not connected.` }; patchOpportunity(selected.id, { rnrStep: step, lastActivity: "Just now", history: [entry, ...selected.history] }); closeModal(); } else moveOpportunity(); }} disabled={!targetStage || selected.stageId === "rnr" && targetStage === "rnr" && !rnrTarget}>{selected.stageId === "rnr" && targetStage === "rnr" ? `Record ${rnrTarget || "next RNR"}` : `Move to ${targetStage ? stageName(stages, targetStage) : "stage"}`}</Button></ModalFooter></ModalBody> : null}

      {modal === "lost" && selected ? <ModalBody className="sp-modal-form"><div className="sp-move-person"><span>{selected.name.slice(0, 1).toUpperCase()}</span><div><strong>{selected.name}</strong><small>{selected.enquiryId} · {stageName(stages, selected.stageId)}</small></div></div><Select label="Reason for loss" selectedKey={lostReason} onSelectionChange={key => setLostReason(String(key))}>{lostReasons.map(reason => <SelectItem key={reason} id={reason}>{reason}</SelectItem>)}</Select>{lostReason === "Other" ? <Textarea label="Reason details" isRequired value={otherReason} onChange={setOtherReason} rows={3} placeholder="Explain why this opportunity was lost" /> : null}{notice ? <p className="sp-notice" role="alert">{notice}</p> : null}<ModalFooter className="sp-inline-footer"><Button variant="secondary" onClick={() => setModal("stage")}>Cancel</Button><Button variant="danger" onClick={confirmLost}>Mark as Lost</Button></ModalFooter></ModalBody> : null}

      {modal === "activity" && selected ? <form className="flex min-h-0 flex-col gap-4" onSubmit={saveActivity}><ModalBody className="sp-modal-form"><div className="sp-context-line"><strong>{selected.name}</strong><span>{stageName(stages, selected.stageId)}</span></div><Select label="Activity outcome" selectedKey={activity.outcome} onSelectionChange={key => setActivity(current => ({ ...current, outcome: String(key) }))}>{["Completed", "Meeting conducted", "Rescheduled", "Postponed", "No-show", "Cancelled", "Follow-up required"].map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</Select>{["manager-meeting", "brand-meeting"].includes(selected.stageId) && activity.outcome === "Meeting conducted" ? <Textarea label="Minutes of meeting" isRequired value={activity.note} onChange={note => setActivity(current => ({ ...current, note }))} rows={4} placeholder="Summary, requirements, concerns, interest and next steps" /> : <Textarea label="Activity notes" value={activity.note} onChange={note => setActivity(current => ({ ...current, note }))} rows={3} placeholder="What happened? Add the next steps." />}{notice ? <p className="sp-notice" role="alert">{notice}</p> : null}</ModalBody><ModalFooter><Button variant="secondary" onClick={closeModal}>Cancel</Button><Button type="submit" leadingIcon={RiCheckLine}>Save activity</Button></ModalFooter></form> : null}

      {modal === "payment" && selected ? <form className="flex min-h-0 flex-col gap-4" onSubmit={savePayment}><ModalBody className="sp-modal-form"><div className="sp-payment-summary"><span>Deal value</span><strong>{money(selected.value)}</strong><span>Verified</span><strong>{money(selected.verifiedAmount ?? 0)}</strong><span>Remaining</span><strong>{money(Math.max(0, selected.value - (selected.verifiedAmount ?? 0)))}</strong></div><Input label="Payment amount (₹)" type="number" isRequired value={payment.amount} onChange={amount => setPayment(current => ({ ...current, amount }))} /><Input label="Transaction reference" isRequired value={payment.reference} onChange={reference => setPayment(current => ({ ...current, reference }))} placeholder="UTR / transaction ID" /><Input label="Payment date" type="date" value={payment.date} onChange={date => setPayment(current => ({ ...current, date }))} /><Checkbox isSelected={payment.verified} onChange={verified => setPayment(current => ({ ...current, verified }))} className="sp-verify-check"><span><strong>Mark as verified</strong><small>Prototype Finance review control. Only verified funds count toward Won.</small></span></Checkbox>{notice ? <p className="sp-notice" role="alert">{notice}</p> : null}</ModalBody><ModalFooter><Button variant="secondary" onClick={closeModal}>Cancel</Button><Button type="submit" leadingIcon={RiCoinsLine}>Save payment</Button></ModalFooter></form> : null}

      {modal === "reopen" && selected ? <ModalBody className="sp-modal-form"><div className="sp-move-person"><span>{selected.name.slice(0, 1).toUpperCase()}</span><div><strong>{selected.name}</strong><small>{selected.enquiryId} · Lost: {selected.lostReason}</small></div></div><Textarea label="Reopening reason" isRequired value={reopenReason} onChange={setReopenReason} rows={3} placeholder="Why is this opportunity being reopened?" />{notice ? <p className="sp-notice" role="alert">{notice}</p> : null}<ModalFooter className="sp-inline-footer"><Button variant="secondary" onClick={closeModal}>Cancel</Button><Button onClick={saveReopen}>Reopen opportunity</Button></ModalFooter></ModalBody> : null}



      {modal === "delete" && selected ? <><ModalBody className="sp-modal-form"><p className="sp-delete-copy">This will remove <strong>{selected.name}</strong> and its local prototype history from this browser. This cannot be undone.</p></ModalBody><ModalFooter><Button variant="secondary" onClick={closeModal}>Cancel</Button><Button variant="danger" leadingIcon={RiDeleteBinLine} onClick={deleteOpportunity}>Delete opportunity</Button></ModalFooter></> : null}

      {modal === "pipelines" ? <ModalBody className="sp-modal-form"><div className="sp-stage-table-head"><h3>Sales pipelines</h3><Button size="small" leadingIcon={RiAddLine} onClick={() => { setNewPipeline({ name: "", description: "" }); setModal("create-pipeline"); }}>Create pipeline</Button></div><div className="sp-stage-table sp-pipeline-list">{pipelineConfigs.map(config => <div className="sp-pipeline-row" key={config.id}><div><strong>{config.name}</strong><small>{config.description}</small><span>{config.stages.length} stages · {opportunities.filter(item => item.pipelineId === config.id).length} records{config.isDefault ? " · Default" : ""}</span></div><Button size="small" variant={config.id === activePipelineId ? "secondary" : "ghost"} onClick={() => selectPipeline(config.id)}>{config.id === activePipelineId ? "Active" : "Open"}</Button></div>)}</div><div className="sp-config-fields"><Input label="Pipeline name" value={pipelineName} onChange={updatePipelineName} /><Textarea label="Description" value={pipelineDescription} onChange={updatePipelineDescription} rows={2} /></div><div className="sp-stage-table-head"><h3>Stages · {pipelineName}</h3><Button size="small" leadingIcon={RiAddLine} onClick={() => setModal("stage-config")}>Add stage</Button></div><div className="sp-stage-table"><div className="sp-stage-row sp-stage-row-head"><span>#</span><span>Stage name</span><span>Probability</span><span>Category</span><span /></div>{stages.map((stage, index) => <div className="sp-stage-row" key={stage.id}><span>{index + 1}</span><span>{stage.name}{stage.id === "rnr" ? <small>{stage.children?.join(" · ")}</small> : null}</span><span>{stage.probability}%</span><span><Chip variant="caption" color={stage.category === "Open" ? "blue" : stage.category === "Closed - Won" ? "lime" : "rose"}>{stage.category}</Chip></span><span>{stage.id.startsWith("custom-") ? <button className="sp-icon-action sp-danger" aria-label={`Remove ${stage.name}`} onClick={() => { if (activeOpportunities.some(item => item.stageId === stage.id)) { setNotice("Move opportunities out of this stage before removing it."); return; } updateStages(current => current.filter(item => item.id !== stage.id)); }}><RiDeleteBinLine /></button> : <RiMore2Fill />}</span></div>)}</div><p className="sp-config-note"><RiCheckLine /> RNR 1–8 remain sub-stages under RNR. Meeting and payment prerequisites are checked when a stage change is saved.</p>{notice ? <p className="sp-notice" role="alert">{notice}</p> : null}<ModalFooter><Button variant="secondary" onClick={closeModal}>Close</Button><Button onClick={closeModal}>Save pipeline</Button></ModalFooter></ModalBody> : null}

      {modal === "create-pipeline" ? <form className="flex min-h-0 flex-col gap-4" onSubmit={createPipeline}><ModalBody className="sp-modal-form"><Input label="Pipeline name" isRequired value={newPipeline.name} onChange={name => setNewPipeline(current => ({ ...current, name }))} placeholder="e.g. Regional expansion pipeline" /><Textarea label="Description" value={newPipeline.description} onChange={description => setNewPipeline(current => ({ ...current, description }))} rows={3} placeholder="What business process does this pipeline support?" /><p className="sp-config-note"><RiCheckLine /> The new pipeline starts with the standard ten stage sequence and has no opportunities until you add them.</p>{notice ? <p className="sp-notice" role="alert">{notice}</p> : null}</ModalBody><ModalFooter><Button variant="secondary" onClick={() => setModal("pipelines")}>Cancel</Button><Button type="submit" leadingIcon={RiAddLine}>Create pipeline</Button></ModalFooter></form> : null}

      {modal === "stage-config" ? <form className="flex min-h-0 flex-col gap-4" onSubmit={createStage}><ModalBody className="sp-modal-form"><Input label="Stage name" isRequired value={newStage.name} onChange={name => setNewStage(current => ({ ...current, name }))} placeholder="e.g. Site visit" /><div className="sp-form-grid"><Input label="Probability (%)" type="number" value={newStage.probability} onChange={probability => setNewStage(current => ({ ...current, probability }))} /><Select label="Stage color" selectedKey={newStage.color} onSelectionChange={key => setNewStage(current => ({ ...current, color: String(key) }))}>{["blue", "purple", "slate", "amber", "orange", "violet", "rose", "green"].map(color => <SelectItem key={color} id={color}>{color}</SelectItem>)}</Select></div><ModalFooter><Button variant="secondary" onClick={() => setModal("pipelines")}>Cancel</Button><Button type="submit" leadingIcon={RiAddLine}>Add stage</Button></ModalFooter></ModalBody></form> : null}
    </Modal>
    </div><ScrollFade progress={workspaceFade.progress} surfaceClassName="from-background-full" /></div>
  </ReviewShell></DirectionProvider>;
}

function LaneCards({ children }: { children: ReactNode }) {
  const fade = useScrollFade();
  return <div className="sp-lane-scroll"><div className="sp-lane-cards" onScroll={fade.onScroll}>{children}</div><ScrollFade progress={fade.progress} surfaceClassName="from-background-secondary-default" /></div>;
}

function Metric({ icon: IconComponent, label, value, detail, tone }: { icon: typeof RiStackLine; label: string; value: string; detail: string; tone: string }) {
  return <article className="sp-metric" data-tone={tone}><span><IconComponent /></span><div><small>{label}</small><strong>{value}</strong><p>{detail}</p></div></article>;
}

function OpportunityCard({ opportunity, onDetails, onAction }: { opportunity: Opportunity; onDetails: () => void; onAction: (action: OpportunityAction) => void }) {
  return <article className="sp-opportunity-card">
    <div className="sp-card-top">
      <button className="sp-card-title" onClick={onDetails} aria-label={`Open lead details for ${opportunity.name}`}><strong>{opportunity.name}</strong><small>{opportunity.enquiryId}</small></button>
      <OpportunityActions name={opportunity.name} isLost={opportunity.stageId === "lost"} onAction={onAction} />
    </div>
    <div className="sp-card-brand"><Icon name="building" />{opportunity.brand}<span>{money(opportunity.value)}</span></div>
    <div className="sp-card-owner"><span>{opportunity.owner.split(" ").map(word => word[0]).slice(0, 2).join("")}</span>{opportunity.owner.split(" ")[0]} {opportunity.owner.split(" ").at(-1)}</div>
    <div className="sp-card-meta"><span>Last activity</span><strong>{opportunity.lastActivity}</strong><span>Time in stage</span><strong>{opportunity.history[0]?.at ?? opportunity.createdAt}</strong></div>
    {opportunity.stageId === "rnr" ? <div className="sp-rnr-badge">RNR {opportunity.rnrStep ?? 1}/8</div> : null}
    {opportunity.stageId === "token" ? <div className="sp-card-payment">Verified {money(opportunity.verifiedAmount ?? 0)} of {money(opportunity.value)}</div> : null}
    <Button size="small" variant="secondary" className="sp-next-action" leadingIcon={opportunity.stageId === "manager-meeting" || opportunity.stageId === "brand-meeting" ? RiCalendarLine : RiPhoneLine} onClick={() => onAction(opportunity.stageId === "token" ? "payment" : "activity")}>{opportunity.nextAction}</Button>
  </article>;
}
