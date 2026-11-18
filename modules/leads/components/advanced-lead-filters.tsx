"use client";

import { useEffect, useMemo, useState } from "react";
import { RiAddLine, RiCloseLine, RiDeleteBinLine, RiFilter3Line, RiSaveLine } from "@remixicon/react";
import { ScrollFade, useScrollFade } from "@/components/foundations/scroll-fade/scroll-fade";
import { cx } from "@/utils/cx";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { SearchField } from "@/components/base/search-field/search-field";
import { Select, SelectItem } from "@/components/base/select/select";

export type LeadFilterRule = { id: string; field: string; operator: string; value: string };
export type LeadAdvancedFilters = {
  match: "all" | "any";
  rules: LeadFilterRule[];
};
export type LeadFilterField = { id: string; name: string; type: "text" | "date" | "select"; options?: string[]; placeholder?: string };

function filterValuePrompt(field: LeadFilterField): string {
  if (field.placeholder) return field.placeholder;
  const prompts: Record<string, string> = {
    person: field.name === "Enquiry" ? "Enter an enquiry name" : `Enter ${field.name.toLowerCase()}`,
    id: "Enter an enquiry ID",
    brand: "Select a brand",
    owner: "Select an assignee",
    status: "Select a status",
    stage: "Select a stage",
    city: "Select a city",
    location: "Select a location",
    state: "Select a state",
    leadSource: "Select a lead source",
    enquiryType: "Select an enquiry type",
    investment: "Select an investment range",
    timeline: "Select a requirement timeline",
    experience: "Select an experience range",
    noticePeriod: "Select a notice period",
    created: "Select a creation date",
  };
  return prompts[field.id] ?? `${field.type === "text" ? "Enter" : "Select"} ${field.name.toLowerCase()}`;
}

type SavedFilter = { id: string; name: string; filters: LeadAdvancedFilters };

const emptyFiltersFor = (field: string): LeadAdvancedFilters => ({
  match: "all",
  rules: [{ id: "rule-1", field, operator: "is", value: "" }],
});

const storageKey = (scope: string, userId: string) => `ifranchise:advanced-filters:${scope}:${userId}`;
const cloneFilters = (filters: LeadAdvancedFilters): LeadAdvancedFilters => ({ match: "all", rules: filters.rules.map(rule => ({ ...rule, operator: ["contains", "does not contain"].includes(rule.operator) ? "is" : rule.operator })) });

export function AdvancedLeadFilters({
  id,
  fields,
  scope,
  userId,
  countFor,
  onApply,
  onClear,
  onClose,
  activeFilterCount,
  initialFilters,
  title = "Filter leads by",
  description = "Build and save a focused lead view.",
  recordLabel = "leads",
  className,
  searchPlaceholder = "Find a field",
}: {
  id?: string;
  fields: LeadFilterField[];
  scope: string;
  userId: string;
  resultCount: number;
  countFor: (filters: LeadAdvancedFilters) => number;
  activeFilterCount: number;
  initialFilters?: LeadAdvancedFilters | null;
  onApply: (filters: LeadAdvancedFilters) => void;
  onClear: () => void;
  onClose: () => void;
  title?: string;
  description?: string;
  recordLabel?: string;
  className?: string;
  searchPlaceholder?: string;
}) {
  const scrollFade = useScrollFade();
  const defaultField = fields[0]?.id ?? "person";
  const [draft, setDraft] = useState<LeadAdvancedFilters>(() => cloneFilters(initialFilters ?? emptyFiltersFor(defaultField)));
  const [saved, setSaved] = useState<SavedFilter[]>([]);
  const [fieldSearch, setFieldSearch] = useState("");
  const [saveName, setSaveName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const operators = (field: LeadFilterField | undefined) => field?.type === "date"
    ? ["is", "before", "after"]
    : field?.type === "select"
      ? ["is", "is not"]
      : ["is", "is not", "starts with", "is empty", "is not empty"];

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey(scope, userId));
      const parsed: SavedFilter[] = stored ? JSON.parse(stored) : [];
      setSaved(Array.isArray(parsed) ? parsed.filter(item => item && typeof item.name === "string" && item.filters) : []);
    } catch {
      setSaved([]);
    }
  }, [scope, userId]);

  useEffect(() => {
    setDraft(cloneFilters(initialFilters ?? emptyFiltersFor(defaultField)));
    setFieldSearch("");
    setSaveName("");
    setIsSaving(false);
  }, [scope, userId, initialFilters, defaultField]);

  const filteredFields = useMemo(() => fields.filter(field => field.name.toLowerCase().includes(fieldSearch.toLowerCase())), [fields, fieldSearch]);

  function updateRule(id: string, patch: Partial<LeadFilterRule>) {
    setDraft(current => ({ ...current, rules: current.rules.map(rule => {
      if (rule.id !== id) return rule;
      const next = { ...rule, ...patch };
      if (patch.field) {
        const nextField = fields.find(field => field.id === patch.field);
        next.operator = operators(nextField)[0];
        next.value = "";
      }
      return next;
    }) }));
  }

  function apply(filters: LeadAdvancedFilters) {
    const normalized: LeadAdvancedFilters = { ...cloneFilters(filters), rules: filters.rules.map(rule => ({ ...rule, operator: ["contains", "does not contain"].includes(rule.operator) ? "is" : rule.operator })).filter(rule => rule.value || ["is empty", "is not empty"].includes(rule.operator)) };
    setDraft(cloneFilters(filters));
    onApply(normalized);
  }

  function saveCurrent() {
    const name = saveName.trim();
    if (!name || saved.length >= 10) return;
    const normalized: LeadAdvancedFilters = { ...cloneFilters(draft), rules: draft.rules.filter(rule => rule.value || ["is empty", "is not empty"].includes(rule.operator)) };
    apply(normalized);
    const next = [...saved, { id: `filter-${Date.now()}`, name, filters: cloneFilters(normalized) }];
    setSaved(next);
    window.localStorage.setItem(storageKey(scope, userId), JSON.stringify(next));
    setSaveName("");
    setIsSaving(false);
  }

  function removeSaved(id: string) {
    const next = saved.filter(item => item.id !== id);
    setSaved(next);
    window.localStorage.setItem(storageKey(scope, userId), JSON.stringify(next));
  }

  function moveSaved(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= saved.length) return;
    const next = [...saved];
    [next[index], next[target]] = [next[target], next[index]];
    setSaved(next);
    window.localStorage.setItem(storageKey(scope, userId), JSON.stringify(next));
  }

  return (
    <aside id={id} className={cx("ld-advanced-filter-panel", className)} aria-label="Advanced filters">
      <header className="ld-advanced-filter-header">
        <div className="ld-advanced-filter-title">
          <span className="ld-advanced-filter-icon"><RiFilter3Line aria-hidden="true" /></span>
          <div><h3>{title}</h3><p>{description}</p></div>
        </div>
        <Button iconOnly aria-label="Close advanced filters" size="small" variant="ghost" leadingIcon={RiCloseLine} onClick={onClose} />
      </header>

      <div className="ld-filter-body-wrap"><div className="ld-filter-body" onScroll={scrollFade.onScroll}>
      <SearchField aria-label="Search filter fields" placeholder={searchPlaceholder} value={fieldSearch} onChange={setFieldSearch} className="ld-advanced-filter-search" fieldClassName="bg-background-primary-default" />
      {fieldSearch && <div className="ld-filter-field-suggestions" aria-label="Matching filter fields">
        {filteredFields.slice(0, 5).map(field => <button type="button" key={field.id} onClick={() => { setDraft(current => ({ ...current, rules: [...current.rules, { id: `rule-${Date.now()}`, field: field.id, operator: operators(field)[0], value: "" }] })); setFieldSearch(""); }}>{field.name}<RiAddLine aria-hidden="true" /></button>)}
        {!filteredFields.length && <span>No matching fields</span>}
      </div>}

      {saved.length > 0 && <section className="ld-filter-section">
        <div className="ld-filter-section-title"><h4>Saved filters</h4><span>{saved.length}/10</span></div>
        <div className="ld-saved-filters">
          {saved.map((filter, index) => <div className="ld-saved-filter-row" key={filter.id}>
            <button type="button" className="ld-saved-filter-name" onClick={() => apply(filter.filters)}>{filter.name}</button>
            <span className="ld-saved-filter-count">{countFor(filter.filters)}</span>
            <button type="button" aria-label={`Move ${filter.name} up`} disabled={index === 0} onClick={() => moveSaved(index, -1)}>↑</button>
            <button type="button" aria-label={`Move ${filter.name} down`} disabled={index === saved.length - 1} onClick={() => moveSaved(index, 1)}>↓</button>
            <button type="button" aria-label={`Delete ${filter.name}`} onClick={() => removeSaved(filter.id)}><RiDeleteBinLine aria-hidden="true" /></button>
          </div>)}
        </div>
      </section>}

      <section className="ld-filter-section">
        <div className="ld-filter-section-title"><h4>Filter by fields</h4><span>{draft.rules.length} {draft.rules.length === 1 ? "criterion" : "criteria"}</span></div>
        <div className="ld-filter-match-row">
          <span>Match</span>
          <span className="text-body-medium text-text-primary">All criteria</span>
        </div>
        <div className="ld-filter-rules">
          {draft.rules.map(rule => {
            const field = fields.find(item => item.id === rule.field) ?? fields[0];
            if (!field) return null;
            const fieldOperators = operators(field);
            return <div className="ld-filter-rule" key={rule.id}>
              <div className="ld-filter-rule-head"><span>{field.name}</span><button type="button" aria-label={`Remove ${field.name} filter`} onClick={() => setDraft(current => ({ ...current, rules: current.rules.filter(item => item.id !== rule.id) }))}><RiCloseLine aria-hidden="true" /></button></div>
              <div className="ld-filter-rule-selects">
              <Select aria-label={`${field.name} field`} selectedKey={field.id} onSelectionChange={key => updateRule(rule.id, { field: String(key) })} size="sm" className="ld-filter-compact-select" triggerClassName="w-full" popoverClassName="w-(--trigger-width) min-w-(--trigger-width)">
                {fields.map(option => <SelectItem id={option.id} key={option.id}>{option.name}</SelectItem>)}
              </Select>
              <Select aria-label={`${field.name} condition`} selectedKey={fieldOperators.includes(rule.operator) ? rule.operator : fieldOperators[0]} onSelectionChange={key => updateRule(rule.id, { operator: String(key), value: "" })} size="sm" className="ld-filter-compact-select" triggerClassName="w-full" popoverClassName="w-(--trigger-width) min-w-(--trigger-width)">
                {fieldOperators.map(operator => <SelectItem id={operator} key={operator}>{operator}</SelectItem>)}
              </Select>
              </div>
              {!(["is empty", "is not empty"].includes(rule.operator)) && (field.type === "select" ? <Select aria-label={`${field.name} value`} selectedKey={rule.value || null} placeholder={filterValuePrompt(field)} onSelectionChange={key => updateRule(rule.id, { value: key == null ? "" : String(key) })} size="sm" className="ld-filter-compact-select" triggerClassName="w-full" popoverClassName="w-(--trigger-width) min-w-(--trigger-width)">
                {(field.options ?? []).map(value => <SelectItem id={value} key={value}>{value}</SelectItem>)}
              </Select> : <Input aria-label={`${field.name} value`} type={field.type === "date" ? "date" : "text"} value={rule.value} onChange={value => updateRule(rule.id, { value })} placeholder={filterValuePrompt(field)} className="ld-filter-value" fieldClassName="border border-border-button-default bg-background-primary-default" />)}
            </div>;
          })}
        </div>
        <div className="ld-filter-rule-actions">
          <Button size="small" variant="secondary" leadingIcon={RiAddLine} disabled={draft.rules.length >= 25} onClick={() => setDraft(current => ({ ...current, rules: [...current.rules, { id: `rule-${Date.now()}`, field: fields[0]?.id ?? "person", operator: operators(fields[0])[0], value: "" }] }))}>Add criteria</Button>
          <span>All criteria must match.</span>
        </div>
      </section>

      <section className="ld-filter-save">
        {isSaving ? <div className="ld-filter-save-entry"><Input aria-label="Saved filter name" placeholder="Name this filter" value={saveName} onChange={setSaveName} maxLength={48} fieldClassName="border border-border-button-default bg-background-primary-default" /><Button size="small" onClick={saveCurrent} disabled={!saveName.trim() || saved.length >= 10}>Save</Button></div> : <Button size="small" variant="secondary" leadingIcon={RiSaveLine} onClick={() => setIsSaving(true)} disabled={saved.length >= 10}>Save current filter</Button>}
        {saved.length >= 10 && <span>You have reached the 10 saved filters per view limit.</span>}
      </section>

      </div><ScrollFade progress={scrollFade.progress} surfaceClassName="from-background-primary-default" /></div>
      <footer className="ld-advanced-filter-footer">
        <span>{countFor(draft)} matching {recordLabel}{activeFilterCount > 0 ? ` · ${activeFilterCount} filters applied` : ""}</span>
        <div>
          <Button size="small" variant="ghost" onClick={() => { setDraft(emptyFiltersFor(defaultField)); onClear(); }}>Clear</Button>
          <Button size="small" onClick={() => apply(draft)}>Apply filters</Button>
        </div>
      </footer>
    </aside>
  );
}
