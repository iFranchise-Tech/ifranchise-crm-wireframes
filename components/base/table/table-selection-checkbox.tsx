"use client";

import { CheckboxGlyph } from "@/components/base/checkbox/checkbox-glyph";

export function TableSelectionCheckbox({
  label,
  isSelected,
  isIndeterminate = false,
  isDisabled = false,
  onChange,
}: {
  label: string;
  isSelected: boolean;
  isIndeterminate?: boolean;
  isDisabled?: boolean;
  onChange: (selected: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-label={label}
      aria-checked={isIndeterminate ? "mixed" : isSelected}
      disabled={isDisabled}
      className="inline-flex rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring focus-visible:ring-offset-2"
      onPointerDown={event => event.stopPropagation()}
      onClick={event => {
        event.stopPropagation();
        onChange(!isSelected);
      }}
      onKeyDown={event => event.stopPropagation()}
    >
      <CheckboxGlyph
        state={{ isSelected, isIndeterminate, isFocusVisible: false, isDisabled, isHovered: false }}
      />
    </button>
  );
}
