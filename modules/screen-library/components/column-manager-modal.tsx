"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { RiAddLine, RiArrowDownSLine, RiArrowUpSLine, RiCloseLine, RiDraggable } from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/base/modal/modal";
import { SearchField } from "@/components/base/search-field/search-field";
import { ScrollFade, useScrollFade } from "@/components/foundations/scroll-fade/scroll-fade";
import { cx } from "@/utils/cx";
import type { ConfigurableColumn } from "../lib/table-columns";
import "./column-manager.css";

function ColumnListScroll({ children, label }: { children: ReactNode; label: string }) {
  const fade = useScrollFade();
  return <div className="column-manager-list-scroll">
    <div aria-label={label} onScroll={fade.onScroll} className="column-manager-list-scroll-content">{children}</div>
    <ScrollFade progress={fade.progress} surfaceClassName="from-background-primary-default" />
  </div>;
}

type ColumnManagerModalProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  availableColumns: ConfigurableColumn[];
  selectedIds: string[];
  requiredIds?: string[];
  isSuperAdmin?: boolean;
  scopeLabel: string;
  onSave: (ids: string[], organizationDefault: boolean) => void;
};

export function ColumnManagerModal({ isOpen, onOpenChange, availableColumns, selectedIds, requiredIds = [], isSuperAdmin = false, scopeLabel, onSave }: ColumnManagerModalProps) {
  const [draft, setDraft] = useState(selectedIds);
  const [search, setSearch] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const required = useMemo(() => new Set(requiredIds), [requiredIds]);
  const selected = useMemo(() => draft.map(id => availableColumns.find(column => column.id === id)).filter((column): column is ConfigurableColumn => Boolean(column)), [availableColumns, draft]);
  const available = useMemo(() => availableColumns.filter(column => !draft.includes(column.id) && column.name.toLowerCase().includes(search.trim().toLowerCase())), [availableColumns, draft, search]);

  useEffect(() => {
    if (isOpen) {
      setDraft(selectedIds);
      setSearch("");
      setDraggedId(null);
    }
  }, [isOpen, selectedIds]);

  function move(id: string, direction: -1 | 1) {
    setDraft(current => {
      const index = current.indexOf(id);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  }

  function reorder(targetId: string) {
    if (!draggedId || draggedId === targetId) return;
    setDraft(current => {
      const next = [...current];
      const from = next.indexOf(draggedId);
      const to = next.indexOf(targetId);
      if (from < 0 || to < 0) return current;
      next.splice(from, 1);
      next.splice(to, 0, draggedId);
      return next;
    });
    setDraggedId(null);
  }

  return <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg" aria-label="Manage table columns">
    <ModalHeader title="Manage columns" description={`Choose and arrange the fields in ${scopeLabel}. Drag selected fields to reorder them.`} />
    <ModalBody className="column-manager-body">
      <div className="column-manager-grid">
        <section className="column-manager-section" aria-label="Selected columns">
          <div className="column-manager-section-heading"><div><h3>Visible columns</h3><p>{selected.length} fields · drag to reorder</p></div><span>{selected.length}</span></div>
          <ColumnListScroll label="Visible columns list"><ol className="column-manager-list">
            {selected.map((column, index) => <li key={column.id} draggable={!required.has(column.id)} onDragStart={event => { setDraggedId(column.id); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", column.id); }} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); reorder(column.id); }} onDragEnd={() => setDraggedId(null)} className={cx("column-manager-item", draggedId === column.id && "is-dragged")}>
              <button type="button" className="column-manager-grip" aria-label={`Drag ${column.name}`} disabled={required.has(column.id)}><RiDraggable aria-hidden /></button>
              <span className="column-manager-item-name"><strong>{column.name}</strong>{required.has(column.id) && <small>Required</small>}</span>
              <Button size="small" variant="secondary" leadingIcon={RiArrowUpSLine} aria-label={`Move ${column.name} up`} disabled={index === 0} onClick={() => move(column.id, -1)} />
              <Button size="small" variant="secondary" leadingIcon={RiArrowDownSLine} aria-label={`Move ${column.name} down`} disabled={index === selected.length - 1} onClick={() => move(column.id, 1)} />
              <Button size="small" variant="secondary" iconOnly leadingIcon={RiCloseLine} aria-label={`Remove ${column.name}`} disabled={required.has(column.id)} onClick={() => setDraft(current => current.filter(id => id !== column.id))} />
            </li>)}
          </ol></ColumnListScroll>
        </section>

        <section className="column-manager-section" aria-label="Available columns">
          <div className="column-manager-section-heading"><div><h3>Add a column</h3><p>Optional fields for this view</p></div><span>{available.length}</span></div>
          <SearchField aria-label="Search available columns" placeholder="Find a field" value={search} onChange={setSearch} className="column-manager-search" fieldClassName="border border-border-button-default bg-background-primary-default" />
          <ColumnListScroll label="Available columns list"><ul className="column-manager-available">
            {available.map(column => <li key={column.id}><span>{column.name}</span><Button size="small" variant="secondary" leadingIcon={RiAddLine} aria-label={`Add ${column.name}`} onClick={() => setDraft(current => [...current, column.id])}>Add</Button></li>)}
            {available.length === 0 && <li className="column-manager-no-results">{search ? "No fields match your search." : "All available fields are visible."}</li>}
          </ul></ColumnListScroll>
        </section>
      </div>
    </ModalBody>
    <ModalFooter className="column-manager-footer">
      <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
      <Button variant="secondary" onClick={() => onSave(draft, false)}>Save for me</Button>
      {isSuperAdmin && <Button variant="secondary" onClick={() => onSave(draft, true)}>Save as organization default</Button>}
    </ModalFooter>
  </Modal>;
}
