import Link from "next/link";
import { Children, Fragment, cloneElement, isValidElement, useEffect, useRef, useState, type CSSProperties, type ReactElement, type ReactNode } from "react";
import { RiArrowDownSLine, RiArrowLeftLine, RiArrowRightLine, RiArrowUpSLine, RiCheckLine, RiEyeLine, RiEyeOffLine, RiPushpinLine, RiSubtractLine, RiUnpinLine } from "@remixicon/react";
import { Dropdown, DropdownDivider, DropdownItem, DropdownPopover, DropdownTrigger } from "@/components/base/dropdown/dropdown";
import { ReviewShell } from "@/modules/screen-library/components/review-shell";
import type { IconName } from "@/modules/auth/components/icon";
import "./workspaces.css";

export type ModuleView = { id: string; label: string };

export function ModuleFrame({ moduleId, moduleName, icon, current, views, children, controls, showPreviewNotice = true, className, headerTitleOnly = false, singleModuleSidebar = false }: {
  moduleId: string; moduleName: string; icon: IconName; current: string; views: ModuleView[]; children: ReactNode; controls?: ReactNode; showPreviewNotice?: boolean; className?: string; headerTitleOnly?: boolean; singleModuleSidebar?: boolean;
}) {
  const base = `/library/modules/${moduleId}`;
  const navigation = <nav className="review-navigation fin-module-nav" aria-label={`${moduleName} navigation`}>
    {views.map(view => <Link key={view.id} className="review-overview-link" href={view.id === "Overview" ? base : `${base}?view=${encodeURIComponent(view.id)}`} aria-current={current === view.id ? "page" : undefined}>{view.label}</Link>)}
  </nav>;
  return <ReviewShell moduleName={moduleName} icon={icon} subtitle="Connected CRM workspace" overviewHref={base} title={current} navigation={navigation} moduleDropdown={!singleModuleSidebar} singleModuleSidebar={singleModuleSidebar} controls={controls} className={className} headerTitleOnly={headerTitleOnly}>
    <div className="review-information fin-page-content">
      <div className="fin-content-limit">
        {showPreviewNotice ? <div className="fin-preview-banner"><span aria-hidden="true">i</span><p>Preview data is stored in this browser. Secure server authorization, shared database storage, file storage and email delivery are not configured.</p></div> : null}
        {children}
      </div>
    </div>
  </ReviewShell>;
}

export function PageHeading({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return <div className="fin-page-heading"><div><h2>{title}</h2>{description ? <p>{description}</p> : null}</div>{actions ? <div className="fin-heading-actions">{actions}</div> : null}</div>;
}

export function MetricCards({ items }: { items: { label: string; value: string; note?: string }[] }) {
  return <div className="fin-metrics">{items.map(item => <article className="fin-metric-card" key={item.label}><span>{item.label}</span><strong>{item.value}</strong>{item.note ? <small>{item.note}</small> : null}</article>)}</div>;
}

export function DataTable({ headers, children, empty, initialFrozenColumns = [], hiddenColumns: controlledHiddenColumns, onHiddenColumnsChange }: { headers: ReactNode[]; children: ReactNode; empty?: boolean; initialFrozenColumns?: number[]; hiddenColumns?: number[]; onHiddenColumnsChange?: (columns: number[]) => void }) {
  const [openColumn, setOpenColumn] = useState<number | null>(null);
  const [sort, setSort] = useState<{ index: number; direction: "asc" | "desc" } | null>(null);
  const [columnOrder, setColumnOrder] = useState(() => headers.map((_, index) => index));
  const [localHiddenColumns, setLocalHiddenColumns] = useState<number[]>([]);
  const hiddenColumns = controlledHiddenColumns ?? localHiddenColumns;
  const [frozenColumns, setFrozenColumns] = useState(() => new Set(initialFrozenColumns));
  const [columnWidths, setColumnWidths] = useState<Record<number, number>>({});
  const headerSignature = headers.map(header => cellText(header)).join("\u001f");
  const tableRef = useRef<HTMLTableElement>(null);
  const headerRefs = useRef(new Map<number, HTMLTableCellElement>());
  const rows = flattenTableRows(children);
  const orderedVisibleColumns = columnOrder.filter(index => index < headers.length && !hiddenColumns.includes(index));
  const orderedFrozenColumns = orderedVisibleColumns.filter(index => frozenColumns.has(index));
  const visibleRows = [...rows];
  useEffect(() => {
    setColumnOrder(headers.map((_, index) => index));
    setLocalHiddenColumns([]);
    setSort(null);
    setFrozenColumns(new Set(initialFrozenColumns));
    setColumnWidths({});
  }, [headerSignature]);
  if (sort) {
    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
    visibleRows.sort((left, right) => {
      const a = cellText(Children.toArray(left.props.children)[sort.index]);
      const b = cellText(Children.toArray(right.props.children)[sort.index]);
      return collator.compare(a, b) * (sort.direction === "asc" ? 1 : -1);
    });
  }
  useEffect(() => {
    const table = tableRef.current;
    if (!table) return;
    const measure = () => {
      const next: Record<number, number> = {};
      for (const index of orderedVisibleColumns) {
        const header = headerRefs.current.get(index);
        if (header) next[index] = header.getBoundingClientRect().width;
      }
      setColumnWidths(current => Object.keys(next).length === Object.keys(current).length && Object.entries(next).every(([index, width]) => Math.abs((current[Number(index)] ?? 0) - width) < 1) ? current : next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(table);
    for (const index of orderedVisibleColumns) {
      const header = headerRefs.current.get(index);
      if (header) observer.observe(header);
    }
    return () => observer.disconnect();
  }, [columnOrder, hiddenColumns, rows.length, headerSignature]);
  let stickyOffset = 0;
  const stickyOffsets = new Map<number, number>();
  for (const index of orderedFrozenColumns) {
    stickyOffsets.set(index, stickyOffset);
    stickyOffset += columnWidths[index] ?? 0;
  }
  const reorderColumn = (index: number, target: number) => {
    setColumnOrder(current => {
      const from = current.indexOf(index);
      if (from < 0) return current;
      const next = [...current];
      next.splice(from, 1);
      next.splice(Math.max(0, Math.min(next.length, target)), 0, index);
      const frozen = next.filter(column => frozenColumns.has(column));
      return [...frozen, ...next.filter(column => !frozenColumns.has(column))];
    });
  };
  const freezeColumn = (index: number) => {
    if (frozenColumns.has(index)) return;
    setFrozenColumns(current => new Set([...current, index]));
    setColumnOrder(current => [...current.filter(column => column !== index && frozenColumns.has(column)), index, ...current.filter(column => column !== index && !frozenColumns.has(column))]);
  };
  const unfreezeColumn = (index: number) => {
    setFrozenColumns(current => { const next = new Set(current); next.delete(index); return next; });
  };
  const updateHiddenColumns = (next: number[]) => {
    setLocalHiddenColumns(next);
    onHiddenColumnsChange?.(next);
  };
  const renderedRows = visibleRows.map(row => {
    const cells = Children.toArray(row.props.children);
    const orderedCells = orderedVisibleColumns.map(index => cells[index]).filter(cell => cell !== undefined);
    const rowKey = String(row.key ?? "");
    const rowCells = orderedCells.map((cell, index) => {
      const column = orderedVisibleColumns[index];
      if (!frozenColumns.has(column)) return cell;
      const offset = stickyOffsets.get(column) ?? 0;
      return isValidElement(cell) ? cloneElement(cell as ReactElement<{ className?: string; style?: CSSProperties }>, {
        className: `${(cell.props as { className?: string }).className ?? ""} fin-table-cell-frozen`.trim(),
        style: { ...(cell.props as { style?: CSSProperties }).style, "--fin-sticky-offset": `${offset}px` } as CSSProperties,
      }) : cell;
    });
    return cloneElement(row, { key: rowKey, children: rowCells });
  });
  const columnLabel = (header: ReactNode) => cellText(header).trim() || "Column";
  const menuHeader = (header: ReactNode, index: number) => {
    if (typeof header !== "string") return header;
    const label = columnLabel(header);
    const activeSort = sort?.index === index;
    const position = columnOrder.indexOf(index);
    const closeMenu = () => setOpenColumn(null);
    return <Dropdown key={`${label}-${index}`} isOpen={openColumn === index} onOpenChange={open => setOpenColumn(open ? index : null)}>
      <DropdownTrigger className="fin-table-column-trigger" aria-label={`${label} column options`} aria-expanded={openColumn === index}>
        <span>{header}</span>{activeSort ? sort?.direction === "asc" ? <RiArrowUpSLine aria-label="Sorted ascending" /> : <RiArrowDownSLine aria-label="Sorted descending" /> : null}
      </DropdownTrigger>
      <DropdownPopover aria-label={`${label} column options`} placement="bottom start" className="fin-table-column-menu">
        <DropdownItem selected={activeSort && sort?.direction === "asc"} onSelect={() => { setSort({ index, direction: "asc" }); setOpenColumn(null); }}><RiArrowUpSLine aria-hidden="true" /><span>Ascending</span></DropdownItem>
        <DropdownItem selected={activeSort && sort?.direction === "desc"} onSelect={() => { setSort({ index, direction: "desc" }); setOpenColumn(null); }}><RiArrowDownSLine aria-hidden="true" /><span>Descending</span></DropdownItem>
        <DropdownItem selected={!sort} onSelect={() => { setSort(null); setOpenColumn(null); }}><RiSubtractLine aria-hidden="true" /><span>No sorting</span>{!sort ? <RiCheckLine className="fin-table-column-check" aria-hidden="true" /> : null}</DropdownItem>
        <DropdownDivider />
        <DropdownItem selected={frozenColumns.has(index)} onSelect={() => { frozenColumns.has(index) ? unfreezeColumn(index) : freezeColumn(index); closeMenu(); }}>{frozenColumns.has(index) ? <RiUnpinLine aria-hidden="true" /> : <RiPushpinLine aria-hidden="true" />}<span>{frozenColumns.has(index) ? "Unfreeze column" : "Freeze column"}</span>{frozenColumns.has(index) ? <RiCheckLine className="fin-table-column-check" aria-hidden="true" /> : null}</DropdownItem>
        <DropdownDivider />
        <DropdownItem className={position >= columnOrder.length - 1 ? "is-disabled" : ""} onSelect={() => { if (position < columnOrder.length - 1) reorderColumn(index, position + 1); closeMenu(); }}><RiArrowRightLine aria-hidden="true" /><span>Move right</span></DropdownItem>
        <DropdownItem className={position <= 0 ? "is-disabled" : ""} onSelect={() => { if (position > 0) reorderColumn(index, position - 1); closeMenu(); }}><RiArrowLeftLine aria-hidden="true" /><span>Move left</span></DropdownItem>
        <DropdownItem className={position >= columnOrder.length - 1 ? "is-disabled" : ""} onSelect={() => { if (position < columnOrder.length - 1) reorderColumn(index, columnOrder.length - 1); closeMenu(); }}><RiArrowRightLine aria-hidden="true" /><span>Move to right end</span></DropdownItem>
        <DropdownItem className={position <= 0 ? "is-disabled" : ""} onSelect={() => { if (position > 0) reorderColumn(index, 0); closeMenu(); }}><RiArrowLeftLine aria-hidden="true" /><span>Move to left end</span></DropdownItem>
        <DropdownDivider />
        <DropdownItem className="fin-table-hide-column" onSelect={() => { if (orderedVisibleColumns.length > 1) updateHiddenColumns([...hiddenColumns, index]); setFrozenColumns(current => { const next = new Set(current); next.delete(index); return next; }); closeMenu(); }}><RiEyeOffLine aria-hidden="true" /><span>Hide column</span></DropdownItem>
      </DropdownPopover>
    </Dropdown>;
  };
  return <>
    {hiddenColumns.length ? <div className="fin-table-restore-bar"><span>{hiddenColumns.length} hidden</span><Dropdown><DropdownTrigger className="fin-table-restore-trigger"><RiEyeLine aria-hidden="true" />Show columns</DropdownTrigger><DropdownPopover aria-label="Show hidden columns" placement="bottom end" className="fin-table-column-menu">{hiddenColumns.map(index => <DropdownItem key={index} onSelect={() => updateHiddenColumns(hiddenColumns.filter(column => column !== index))}><RiEyeLine aria-hidden="true" /><span>Show {columnLabel(headers[index])}</span></DropdownItem>)}</DropdownPopover></Dropdown></div> : null}
    <div className="fin-table-scroll">
      <table className="fin-table" ref={tableRef}><thead><tr>{orderedVisibleColumns.map(index => <th key={index} scope="col" ref={element => { if (element) headerRefs.current.set(index, element); else headerRefs.current.delete(index); }} className={frozenColumns.has(index) ? "fin-table-cell-frozen" : undefined} style={frozenColumns.has(index) ? { "--fin-sticky-offset": `${stickyOffsets.get(index) ?? 0}px` } as CSSProperties : undefined}>{menuHeader(headers[index], index)}</th>)}</tr></thead><tbody>{empty || !renderedRows.length ? <tr><td className="fin-empty" colSpan={orderedVisibleColumns.length}>No matching records</td></tr> : renderedRows}</tbody></table>
    </div>
  </>;
}

function flattenTableRows(nodes: ReactNode): ReactElement<{ children?: ReactNode }>[] {
  return Children.toArray(nodes).flatMap(node => {
    if (!isValidElement(node)) return [];
    if (node.type === Fragment) return flattenTableRows((node.props as { children?: ReactNode }).children);
    return node.type === "tr" ? [node as ReactElement<{ children?: ReactNode }>] : [];
  });
}

function cellText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(cellText).join(" ");
  if (isValidElement(node)) return cellText((node.props as { children?: ReactNode }).children);
  return "";
}

export function StatusLabel({ children }: { children: string }) {
  const value = children.toLowerCase();
  const tone = value === "upcoming" ? "purple" : value === "sent" ? "info" : value.includes("overdue") || value.includes("reject") || value.includes("cancel") || value.includes("failed") ? "danger" : value.includes("verified") || value === "paid" || value === "issued" || value === "approved" ? "success" : value.includes("pending") || value.includes("partial") || value.includes("unknown") ? "warning" : "neutral";
  return <span className={`fin-status fin-status-${tone}`}><span className="fin-status-dot" aria-hidden="true" />{children}</span>;
}

export function Money({ amount }: { amount: number }) {
  return <>{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount)}</>;
}

export function FormGrid({ children }: { children: ReactNode }) { return <div className="fin-form-grid">{children}</div>; }

export function TextAction({ children, onClick, disabled = false, danger = false, type = "button" }: { children: ReactNode; onClick?: () => void; disabled?: boolean; danger?: boolean; type?: "button" | "submit" }) {
  return <button className={`fin-text-action${danger ? " is-danger" : ""}`} type={type} onClick={onClick} disabled={disabled}>{children}</button>;
}

