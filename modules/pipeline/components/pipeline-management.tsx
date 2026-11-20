"use client";

import { useState, type FormEvent } from "react";
import { RiAddLine, RiArrowLeftLine, RiArrowRightLine, RiCheckLine, RiDeleteBinLine, RiEditLine } from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { Chip } from "@/components/base/badges/chip";
import { Input } from "@/components/base/input/input";
import { Select, SelectItem } from "@/components/base/select/select";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@/components/base/table/table";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/base/modal/modal";
import { initialStages } from "../data";
import type { Opportunity, PipelineConfig, PipelineStage } from "../types";

const fieldClass = "h-10 border border-border-button-default bg-background-primary-default text-text-primary";
const emptyStage: { name: string; probability: string; color: string; category: PipelineStage["category"] } = {
  name: "", probability: "50", color: "blue", category: "Open",
};
const stageColors = ["blue", "purple", "slate", "amber", "orange", "violet", "rose", "green", "red"];
const stageCategories: PipelineStage["category"][] = ["Open", "Closed - Lost"];

export function PipelineManagement({ pipelines, opportunities, onSave, onOpenBoard, onStartEditing }: {
  pipelines: PipelineConfig[];
  opportunities: Opportunity[];
  onSave: (pipeline: PipelineConfig) => void;
  onStartEditing: () => void;
  onOpenBoard: (id: string) => void;
}) {
  const [draft, setDraft] = useState<PipelineConfig | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [stageOpen, setStageOpen] = useState(false);
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [pipelineName, setPipelineName] = useState("");
  const [description, setDescription] = useState("");
  const [newStage, setNewStage] = useState(emptyStage);
  const [error, setError] = useState("");
  const recordCount = (id: string) => opportunities.filter(item => item.pipelineId === id).length;

  function openCreate() {
    setPipelineName("");
    setDescription("");
    setError("");
    setCreateOpen(true);
  }

  function edit(pipeline: PipelineConfig) {
    onStartEditing();
    setDraft({ ...pipeline, stages: pipeline.stages.map(stage => ({ ...stage })) });
    setError("");
  }

  function closeStage() {
    setStageOpen(false);
    setEditingStageId(null);
    setNewStage(emptyStage);
    setError("");
  }

  function openStageEditor(stage?: PipelineStage) {
    setEditingStageId(stage?.id ?? null);
    setNewStage(stage ? { name: stage.name, probability: String(stage.probability), color: stage.color, category: stage.category } : emptyStage);
    setError("");
    setStageOpen(true);
  }

  function createPipeline(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = pipelineName.trim();
    if (!name) { setError("Enter a pipeline name."); return; }
    if (pipelines.some(item => item.name.toLowerCase() === name.toLowerCase())) { setError("A pipeline with this name already exists."); return; }
    onSave({ id: `pipeline-${crypto.randomUUID()}`, name, description: description.trim(), stages: initialStages.map(stage => ({ ...stage })), isDefault: false });
    setCreateOpen(false);
    setError("");
  }

  function addStage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    const name = newStage.name.trim();
    const probability = Number(newStage.probability);
    if (!name) { setError("Enter a stage name."); return; }
    if (draft.stages.some(stage => stage.id !== editingStageId && stage.name.toLowerCase() === name.toLowerCase())) { setError("A stage with this name already exists."); return; }
    if (!newStage.probability.trim() || !Number.isFinite(probability) || probability < 0 || probability > 100) { setError("Enter a probability from 0 to 100."); return; }
    if (editingStageId) {
      setDraft({ ...draft, stages: draft.stages.map(stage => stage.id === editingStageId ? { ...stage, name, probability, color: newStage.color, category: newStage.category } : stage) });
      closeStage();
      return;
    }
    const position = draft.stages.findIndex(stage => stage.id === "won");
    const stages = [...draft.stages];
    stages.splice(position < 0 ? stages.length : position, 0, {
      id: `custom-${crypto.randomUUID()}`, name, probability, category: newStage.category, color: newStage.color,
    });
    setDraft({ ...draft, stages });
    closeStage();
  }

  function saveStages(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    onSave(draft);
    setDraft(null);
    setError("");
  }

  return <section className="flex min-w-0 flex-col gap-6" aria-label="Pipeline management">
    {!draft ? <>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-title-2-medium text-text-primary">Pipeline management</h2>
        <Button leadingIcon={RiAddLine} onClick={openCreate}>Create pipeline</Button>
      </header>
      <div className="overflow-hidden rounded-3xl border border-border-button-default bg-background-primary-default">
        <Table aria-label="Sales pipelines" className="sp-management-table">
          <TableHeader>
            <TableColumn isRowHeader>Pipeline</TableColumn>
            <TableColumn>Stages</TableColumn>
            <TableColumn>Opportunities</TableColumn>
            <TableColumn className="text-end" aria-label="Pipeline actions">Actions</TableColumn>
          </TableHeader>
          <TableBody>{pipelines.map(pipeline => <TableRow key={pipeline.id} id={pipeline.id} className="sp-management-row">
            <TableCell><div className="flex min-w-0 flex-col gap-2 py-2">
              <div className="flex flex-wrap items-center gap-2"><span className="text-body-medium text-text-primary">{pipeline.name}</span>{pipeline.isDefault && <Chip variant="caption" color="blue">Default</Chip>}</div>
              {pipeline.description ? <p className="max-w-xl text-body-2-regular text-text-secondary">{pipeline.description}</p> : null}
            </div></TableCell>
            <TableCell>{pipeline.stages.length}</TableCell>
            <TableCell>{recordCount(pipeline.id)}</TableCell>
            <TableCell><div className="flex justify-end gap-2">
              <Button size="small" variant="secondary" leadingIcon={RiEditLine} aria-label={`Edit ${pipeline.name}`} onClick={() => edit(pipeline)}>Edit</Button>
              <Button size="small" variant="ghost" trailingIcon={RiArrowRightLine} aria-label={`View ${pipeline.name} board`} onClick={() => onOpenBoard(pipeline.id)}>View board</Button>
            </div></TableCell>
          </TableRow>)}</TableBody>
        </Table>
      </div>
    </> : <form className="flex min-w-0 flex-col gap-4" onSubmit={saveStages}>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Button iconOnly size="small" variant="secondary" leadingIcon={RiArrowLeftLine} aria-label="Back to pipelines" title="Back to pipelines" onClick={() => { setDraft(null); setError(""); }} />
          <h2 className="truncate text-title-2-medium text-text-primary">Edit stages · {draft.name}</h2>
        </div>
        <Button size="small" variant="secondary" leadingIcon={RiAddLine} onClick={() => { setError(""); setStageOpen(true); }}>Add stage</Button>
      </header>
      <section className="flex min-w-0 flex-col overflow-hidden rounded-3xl border border-border-button-default bg-background-primary-default" aria-label="Pipeline stages">
        <Table aria-label="Pipeline stage sequence" className="sp-management-table" size="sm">
          <TableHeader><TableColumn>#</TableColumn><TableColumn isRowHeader>Stage name</TableColumn><TableColumn>Probability</TableColumn><TableColumn>Category</TableColumn><TableColumn aria-label="Stage actions">Actions</TableColumn></TableHeader>
          <TableBody>{draft.stages.map((stage, index) => {
            const hasRecords = opportunities.some(item => item.pipelineId === draft.id && item.stageId === stage.id);
            const categoryColor = stage.category === "Open" ? "blue" : stage.category === "Closed - Won" ? "lime" : "rose";
            return <TableRow key={stage.id} id={stage.id} className="sp-management-row">
              <TableCell>{index + 1}</TableCell>
              <TableCell><span className="text-body-medium text-text-primary">{stage.name}</span></TableCell>
              <TableCell>{stage.probability}%</TableCell>
              <TableCell><Chip variant="caption" color={categoryColor}>{stage.category}</Chip></TableCell>
              <TableCell><div className="sp-stage-actions">
                <Button iconOnly size="small" variant="ghost" leadingIcon={RiEditLine} aria-label={`Edit ${stage.name}`} title={`Edit ${stage.name}`} onClick={() => openStageEditor(stage)} />
                <Button iconOnly size="small" variant="ghost" leadingIcon={RiDeleteBinLine} aria-label={`Remove ${stage.name}`} title={!stage.id.startsWith("custom-") ? "Standard stages cannot be removed" : hasRecords ? "Move opportunities out of this stage before removing it" : `Remove ${stage.name}`} disabled={!stage.id.startsWith("custom-") || hasRecords} onClick={() => { if (!window.confirm(`Remove the “${stage.name}” stage from this pipeline? Save stages to apply this change.`)) return; setDraft(current => current ? { ...current, stages: current.stages.filter(item => item.id !== stage.id) } : current); }} />
              </div></TableCell>
            </TableRow>;
          })}</TableBody>
        </Table>
      </section>
      <footer className="sp-stage-editor-footer">
        {error ? <p className="text-body-2-medium text-text-error-primary" role="alert">{error}</p> : null}
        <div className="flex flex-wrap justify-center gap-2">
        <Button variant="secondary" onClick={() => { setDraft(null); setError(""); }}>Cancel</Button>
        <Button type="submit" leadingIcon={RiCheckLine}>Save stages</Button>
        </div>
      </footer>
    </form>}

    <Modal isOpen={createOpen} onOpenChange={open => { if (!open) { setCreateOpen(false); setError(""); } }} size="lg">
      <ModalHeader title="Create pipeline" />
      <form className="flex min-h-0 flex-col gap-4" onSubmit={createPipeline}>
        <ModalBody className="sp-modal-form">
          <div className="sp-pipeline-create-fields">
            <Input label="Pipeline name" isRequired fieldClassName={fieldClass} value={pipelineName} onChange={setPipelineName} placeholder="e.g. Regional expansion" />
            <Input label="Description" fieldClassName={fieldClass} value={description} onChange={setDescription} placeholder="What this pipeline is for" />
          </div>
          {error ? <p className="text-body-2-medium text-text-error-primary" role="alert">{error}</p> : null}
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button type="submit" leadingIcon={RiCheckLine}>Create pipeline</Button>
        </ModalFooter>
      </form>
    </Modal>

    <Modal isOpen={stageOpen} onOpenChange={open => { if (!open) closeStage(); }} size="lg">
      <ModalHeader title={`${editingStageId ? "Edit stage" : "Add stage"}${draft ? ` · ${draft.name}` : ""}`} />
      <form className="flex min-h-0 flex-col gap-4" onSubmit={addStage}>
        <ModalBody className="sp-modal-form">
          <div className="sp-new-stage-fields">
            <Input label="Stage name" isRequired fieldClassName={fieldClass} value={newStage.name} onChange={name => setNewStage(current => ({ ...current, name }))} placeholder="e.g. Final review" />
            <Input label="Probability (%)" isRequired isReadOnly={editingStageId === "won" || editingStageId === "lost"} type="number" fieldClassName={fieldClass} value={newStage.probability} onChange={probability => setNewStage(current => ({ ...current, probability }))} />
            <Select label="Stage color" selectedKey={newStage.color} onSelectionChange={key => setNewStage(current => ({ ...current, color: String(key) }))} triggerClassName={fieldClass}>
              {stageColors.map(color => <SelectItem key={color} id={color}>{color[0].toUpperCase() + color.slice(1)}</SelectItem>)}
            </Select>
            <Select label="Category" isDisabled={editingStageId === "won" || editingStageId === "lost"} selectedKey={newStage.category} onSelectionChange={key => setNewStage(current => ({ ...current, category: String(key) as PipelineStage["category"] }))} triggerClassName={fieldClass}>
              {(editingStageId === "won" ? ["Closed - Won"] : editingStageId === "lost" ? ["Closed - Lost"] : stageCategories).map(category => <SelectItem key={category} id={category}>{category}</SelectItem>)}
            </Select>
          </div>
          {error ? <p className="text-body-2-medium text-text-error-primary" role="alert">{error}</p> : null}
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={closeStage}>Cancel</Button>
          <Button type="submit" leadingIcon={RiCheckLine}>{editingStageId ? "Save stage" : "Add stage"}</Button>
        </ModalFooter>
      </form>
    </Modal>
  </section>;
}
