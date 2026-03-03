import { useState, useEffect, useCallback } from "react";
import Note from "./Note";
import CreateNoteForm from "./CreateNoteForm";
import NotePopup from "./NotePopup";
import { api } from "../services/api";

function Dashboard() {
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      const notesData = await api.getNotes();
      setNotes(notesData);
    } catch (err) {
      setError("Failed to load notes. Is the server running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleCreate = async ({ title, content }) => {
    try {
      const newNote = await api.createNote({ title, content });
      setNotes((prev) => [newNote, ...prev]);
    } catch (err) {
      setError(err.message || "Failed to create note.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteNote(id);
      setNotes((prev) => prev.filter((n) => n._id !== id));
      if (selectedNote?._id === id) setSelectedNote(null);
    } catch (err) {
      setError(err.message || "Failed to delete note.");
    }
  };

  const handleUpdate = async (id, notesData) => {
    try {
      const updated = await api.updateNote(id, notesData);
      setNotes((prev) => prev.map((n) => (n._id === id ? updated : n)));
      setSelectedNote(updated);
    } catch (err) {
      setError(err.message || "Failed to update note.");
    }
  };

  return (
    <>
      <main className="main-content">
        {error && (
          <div className="error-banner" onClick={() => setError(null)}>
            ⚠️ {error} <span className="dismiss">✕</span>
          </div>
        )}
        <CreateNoteForm onCreate={handleCreate} />
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading notes…</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="empty-state">
            <p>📝 No notes yet. Create your first one above!</p>
          </div>
        ) : (
          <div className="notes-container">
            {notes.map((note) => (
              <Note
                key={note._id}
                note={note}
                onDelete={handleDelete}
                onClick={() => setSelectedNote(note)}
              />
            ))}
          </div>
        )}
      </main>

      {selectedNote && (
        <NotePopup
          note={selectedNote}
          onClose={() => setSelectedNote(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </>
  );
}

export default Dashboard;
