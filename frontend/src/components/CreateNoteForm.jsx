import { useState } from "react";
import AddIcon from "@mui/icons-material/Add";

function CreateNoteForm({ onCreate }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [note, setNote] = useState({ title: "", content: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNote((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!note.title.trim() && !note.content.trim()) return;
    setSubmitting(true);
    try {
      await onCreate(note);
      setNote({ title: "", content: "" });
      setIsExpanded(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    // Ctrl/Cmd + Enter to save
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") handleSubmit();
  };

  return (
    <form className="create-note" onKeyDown={handleKeyDown}>
      {isExpanded && (
        <input
          name="title"
          placeholder="Title"
          value={note.title}
          onChange={handleChange}
          autoFocus
        />
      )}
      <textarea
        name="content"
        placeholder="Take a note… (Ctrl+Enter to save)"
        rows={isExpanded ? 5 : 1}
        value={note.content}
        onChange={handleChange}
        onFocus={() => setIsExpanded(true)}
      />
      {isExpanded && (
        <button
          type="button"
          title="Add note"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "…" : <AddIcon />}
        </button>
      )}
    </form>
  );
}

export default CreateNoteForm;
