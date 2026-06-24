import type { RegistrationFilter } from "@/types";

const OPTIONS: { value: RegistrationFilter; label: string; hint: string }[] = [
  { value: "all", label: "All Events", hint: "Show everything" },
  { value: "registered", label: "Registered", hint: "Events you're attending" },
  { value: "not-registered", label: "Not Registered", hint: "Events you haven't joined" },
  { value: "available", label: "Available to Register", hint: "Open, not full or past" },
];

/** Radio-group filter (mutually exclusive) for the Feed sidebar. */
export function RegistrationStatusFilter({
  value,
  onChange,
}: {
  value: RegistrationFilter;
  onChange: (value: RegistrationFilter) => void;
}) {
  return (
    <fieldset className="border-t border-border-subtle py-2">
      <legend className="px-1 py-1 text-sm font-medium text-content">Registration status</legend>
      <div className="mt-1 flex flex-col gap-0.5">
        {OPTIONS.map((opt) => {
          const checked = value === opt.value;
          return (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-sm text-content-muted hover:bg-surface-subtle hover:text-content"
              title={opt.hint}
            >
              <span
                className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border transition-colors ${
                  checked ? "border-brand" : "border-border"
                }`}
              >
                {checked && <span className="h-2 w-2 rounded-full bg-brand" />}
              </span>
              <input
                type="radio"
                name="registration-status"
                value={opt.value}
                checked={checked}
                onChange={() => onChange(opt.value)}
                className="sr-only"
              />
              <span className={checked ? "font-medium text-content" : ""}>{opt.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
