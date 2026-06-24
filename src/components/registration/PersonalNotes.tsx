import { useState } from "react";
import { useRegistrationStore } from "@/store/registrationStore";
import { toast } from "@/store/toast";

/**
 * Inline personal-notes editor for a registered event on the schedule page.
 * Notes persist in the registration store (localStorage).
 */
export function PersonalNotes({ eventId }: { eventId: string }) {
  const notes = useRegistrationStore(
    (s) => s.registrations.find((r) => r.eventId === eventId)?.notes ?? ""
  );
  const updateNotes = useRegistrationStore((s) => s.updateNotes);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(notes);

  const startEdit = () => {
    setDraft(notes);
    setEditing(true);
  };

  const save = () => {
    updateNotes(eventId, draft);
    setEditing(false);
    toast.success(draft.trim() ? "Note saved" : "Note cleared");
  };

  if (editing) {
    return (
      <div className="mt-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          autoFocus
          placeholder="e.g. Bring laptop · Team: Rahul, Priya · Room changed to Seminar Hall 3"
          aria-label="Personal notes"
          className="input-base text-sm"
        />
        <div className="mt-1.5 flex items-center gap-2">
          <button type="button" onClick={save} className="btn-primary px-3 py-1.5 text-xs">
            Save
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="btn px-3 py-1.5 text-xs text-content-muted hover:bg-surface"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (notes) {
    return (
      <div className="mt-2 rounded-lg border border-border-subtle bg-surface-subtle/60 px-3 py-2 text-sm text-content-muted">
        <span className="mr-1" aria-hidden="true">
          📝
        </span>
        {notes}
        <button
          type="button"
          onClick={startEdit}
          className="ml-2 text-xs font-medium text-brand hover:underline"
          aria-label="Edit note"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={startEdit}
      className="mt-2 text-xs font-medium text-brand hover:underline"
      aria-label="Add a personal note"
    >
      + Add Notes
    </button>
  );
}
