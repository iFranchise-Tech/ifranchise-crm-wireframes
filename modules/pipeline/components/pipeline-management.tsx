"use client";

import { useState, type FormEvent } from "react";
import { RiAddLine, RiArrowLeftLine, RiArrowRightLine, RiCheckLine, RiDeleteBinLine, RiEditLine } from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { Chip } from "@/components/base/badges/chip";
import { Input } from "@/components/base/input/input";
import { Select, SelectItem } from "@/components/base/select/select";
import { Textarea } from "@/components/base/textarea/textarea";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@/components/base/table/table";
import { initialStages } from "../data";
import type { Opportunity, PipelineConfig } from "../types";

const fieldClass = "border border-border-button-default bg-background-primary-default text-text-primary";
const emptyStage = { name: "", probability: "90", color: "blue" };

export function PipelineManagement({ pipelines, opportunities, onSave, onOpenBoard, onStartEditing }: {
  pipelines: PipelineConfig[];
  opportunities: Opportunity[];
  onSave: (pipeline: PipelineConfig) => void;
  onStartEditing: () => void;
  onOpenBoard: (id: string) => void;
}) {
  const [draft, setDraft] = useState<PipelineConfig | null>(null);
  const [addingStage, setAddingStage] = useState(false);
  const [newStage, setNewStage] = useState(emptyStage);
  const [error, setError] = useState("");
  const isNew = draft && !pipelines.some(pipeline => pipeline.id === draft.id);
  const recordCount = (id: string) => opportunities.filter(item => item.pipelineId === id).length;

  function edit(pipeline: PipelineConfig) {
    onStartEditing();
    setDraft({ ...pipeline, stages: pipeline.stages.map(stage => ({ ...stage })) });
    setAddingStage(false);
    setNewStage(emptyStage);
    setError("");
  }

  function cancel() {
    setDraft(null);
    setError("");
    setAddingStage(false);
  }

  function addStage() {
    if (!draft) return;
    const name = newStage.name.trim();
    const probability = Number(newStage.probability);
    if (!name) { setError("Enter a stage name."); return; }
    if (draft.stages.some(stage => stage.name.toLowerCase() === name.toLowerCase())) { setError("A stage with this name already exists."); return; }
    if (!newStage.probability.trim() || !Number.isFinite(probability) || probability < 0 || probability > 100) { setError("Enter a probability from 0 to 100."); return; }
    const position = draft.stages.findIndex(stage => stage.id === "won");
    const stages = [...draft.stages];
    stages.splice(position, 0, { id: `custom-${crypto.randomUUID()}`, name, probability, category: "Open", color: newStage.color });
    setDraft({ ...draft, stages });
    setAddingStage(false);
    setNewStage(emptyStage);
    setError("");
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    const name = draft.name.trim();
    if (!name) { setError("Enter a pipeline name."); return; }
    if (pipelines.some(item => item.id !== draft.id && item.name.toLowerCase() === name.toLowerCase())) { setError("A pipeline with this name already exists."); return; }
    if (addingStage) { setError("Add or cancel the new stage before saving the pipeline."); return; }
    onSave({ ...draft, name, description: draft.description.trim() });
    cancel();
  }

  return <section className="flex min-w-0 flex-col gap-6" aria-label="Pipeline management">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-2">
        {draft && <Button size="small" variant="ghost" className="self-start" leadingIcon={RiArrowLeftLine} onClick={cancel}>Back to pipelines</Button>}
        <h2 className="text-title-2-medium text-text-primary">{draft ? isNew ? "Create pipeline" : "Edit pipeline" : "Pipeline management"}</h2>
        <p className="text-body-regular text-text-secondary">{draft ? "Update pipeline details and review the stage sequence." : "Manage your sales workflows and the stages in each pipeline."}</p>
      </div>
      {!draft && <Button leadingIcon={RiAddLine} onClick={() => edit({ id: `pipeline-${crypto.randomUUID()}`, name: "", description: "", stages: initialStages, isDefault: false })}>Create pipeline</Button>}
    </header>

    {!draft ? <div className="overflow-hidden rounded-3xl border border-border-button-default bg-background-primary-default">
      <Table aria-label="Sales pipelines" className="sp-management-table">
        <TableHeader>
          <TableColumn isRowHeader>Pipeline</TableColumn>
          <TableColumn>Stages</TableColumn>
          <TableColumn>Opportunities</TableColumn>
          <TableColumn className="text-end" aria-label="Pipeline actions">Actions</TableColumn>
        </TableHeader>
        <TableBody>{pipelines.map(pipeline => <TableRow key={pipeline.id} id={pipeline.id}>
          <TableCell><div className="flex min-w-0 flex-col gap-2 py-2">
            <div className="flex flex-wrap items-center gap-2"><span className="text-body-medium text-text-primary">{pipeline.name}</span>{pipeline.isDefault && <Chip variant="caption" color="blue">Default</Chip>}</div>
            <p className="max-w-xl text-body-2-regular text-text-secondary">{pipeline.description || "No description added."}</p>
          </div></TableCell>
          <TableCell>{pipeline.stages.length}</TableCell>
          <TableCell>{recordCount(pipeline.id)}</TableCell>
          <TableCell><div className="flex justify-end gap-2">
            <Button size="small" variant="secondary" leadingIcon={RiEditLine} aria-label={`Edit ${pipeline.name}`} onClick={() => edit(pipeline)}>Edit</Button>
            <Button size="small" variant="ghost" trailingIcon={RiArrowRightLine} aria-label={`View ${pipeline.name} board`} onClick={() => onOpenBoard(pipeline.id)}>View board</Button>
          </div></TableCell>
        </TableRow>)}</TableBody>
      </Table>
    </div> : <form className="flex min-w-0 flex-col gap-6" onSubmit={save}>
      <section className="sp-management-details grid gap-4 rounded-3xl border border-border-button-default bg-background-primary-default p-5" aria-label="Pipeline details">
        <Input label="Pipeline name" isRequired fieldClassName={fieldClass} value={draft.name} onChange={name => setDraft({ ...draft, name })} placeholder="e.g. Regional expansion pipeline" />
        <Textarea label="Description (optional)" fieldClassName={fieldClass} value={draft.description} onChange={description => setDraft({ ...draft, description })} rows={2} placeholder="Describe the purpose of this pipeline" />
      </section>
      <section className="flex min-w-0 flex-col overflow-hidden rounded-3xl border border-border-button-default bg-background-primary-default" aria-label="Pipeline stages">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-separator-border p-5">
          <div className="flex flex-col gap-1"><h3 className="text-headline-medium text-text-primary">Stages <span className="text-text-secondary">({draft.stages.length})</span></h3><p className="text-body-2-regular text-text-secondary">Stages appear on the board in this order.</p></div>
          <Button size="small" variant="secondary" leadingIcon={RiAddLine} disabled={addingStage} onClick={() => { setAddingStage(true); setError(""); }}>Add stage</Button>
        </div>
        {addingStage && <div className="flex flex-col gap-4 border-b border-separator-border bg-background-secondary-default p-5">
          <div className="sp-new-stage grid gap-4">
            <Input label="Stage name" fieldClassName={fieldClass} value={newStage.name} onChange={name => setNewStage({ ...newStage, name })} placeholder="e.g. Final review" />
            <Input label="Probability (%)" type="number" fieldClassName={fieldClass} value={newStage.probability} onChange={probability => setNewStage({ ...newStage, probability })} />
            <Select label="Stage color" selectedKey={newStage.color} onSelectionChange={key => setNewStage({ ...newStage, color: String(key) })}>{["blue", "purple", "slate", "amber", "orange", "violet", "rose", "green"].map(color => <SelectItem key={color} id={color}>{color[0].toUpperCase() + color.slice(1)}</SelectItem>)}</Select>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-body-2-regular text-text-secondary">New stages are added before Won.</p><div className="flex gap-2"><Button variant="secondary" size="small" onClick={() => { setAddingStage(false); setNewStage(emptyStage); setError(""); }}>Cancel stage</Button><Button size="small" leadingIcon={RiCheckLine} onClick={addStage}>Add to pipeline</Button></div></div>
        </div>}
        <Table aria-label="Pipeline stage sequence" className="sp-management-table" size="sm">
          <TableHeader><TableColumn>#</TableColumn><TableColumn isRowHeader>Stage name</TableColumn><TableColumn>Probability</TableColumn><TableColumn>Category</TableColumn><TableColumn aria-label="Stage actions">Actions</TableColumn></TableHeader>
          <TableBody>{draft.stages.map((stage, index) => {
            const hasRecords = opportunities.some(item => item.pipelineId === draft.id && item.stageId === stage.id);
            return <TableRow key={stage.id} id={stage.id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell><div className="flex flex-col gap-1 py-2"><span className="text-body-medium">{stage.name}</span>{stage.children?.length ? <span className="text-caption-1-regular text-text-secondary">{stage.children.length} response attempts</span> : null}</div></TableCell>
              <TableCell>{stage.probability}%</TableCell>
              <TableCell><Chip variant="caption" color={stage.category === "Open" ? "blue" : stage.category === "Closed - Won" ? "lime" : "rose"}>{stage.category}</Chip></TableCell>
              <TableCell>{stage.id.startsWith("custom-") ? <Button iconOnly size="small" variant="ghost" leadingIcon={RiDeleteBinLine} aria-label={`Remove ${stage.name}`} title={hasRecords ? "Move opportunities out of this stage before removing it" : `Remove ${stage.name}`} disabled={hasRecords} onClick={() => setDraft({ ...draft, stages: draft.stages.filter(item => item.id !== stage.id) })} /> : <span className="text-caption-1-regular text-text-secondary">Standard stage</span>}</TableCell>
            </TableRow>;
          })}</TableBody>
        </Table>
        <p className="border-t border-separator-border px-5 py-4 text-body-2-regular text-text-secondary">Standard stages keep meeting and payment checks in place. Custom stages can be removed when they have no opportunities.</p>
      </section>
      <footer className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border-button-default bg-background-primary-default p-4 shadow-sm">
        <p className="text-body-2-regular text-text-secondary">{error ? <span role="alert" className="text-text-error-primary">{error}</span> : "Changes take effect when you save."}</p>
        <div className="flex gap-2"><Button variant="secondary" onClick={cancel}>Cancel</Button><Button type="submit" leadingIcon={RiCheckLine}>{isNew ? "Create pipeline" : "Save pipeline"}</Button></div>
      </footer>
    </form>}
  </section>;
}
