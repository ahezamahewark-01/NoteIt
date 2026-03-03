import { useState, useEffect, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/SaveAlt";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import SendIcon from "@mui/icons-material/Send";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import TuneIcon from "@mui/icons-material/Tune";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { api } from "../services/api";
import AlertDialog from "./AlertDialog";

// ─── Sub-components ──────────────────────────────────────────────────────────

function Spinner({ size = 20 }) {
  return (
    <span
      className="ai-spinner"
      style={{ width: size, height: size }}
      aria-label="Loading"
    />
  );
}

function ChatBubble({ msg }) {
  return (
    <div className={`chat-bubble chat-bubble--${msg.role}`}>
      <p>{msg.content}</p>
    </div>
  );
}

// ─── Optimize Modal ──────────────────────────────────────────────────────────

function OptimizeModal({ onOptimize, onClose }) {
  const presets = [
    "Make it more professional",
    "Simplify for a general audience",
    "Make it more concise",
    "Expand with more detail",
    "Fix grammar and spelling",
    "Convert to bullet points",
  ];
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async (text) => {
    setLoading(true);
    try {
      await onOptimize(text || instruction);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="optimize-modal-overlay" onClick={onClose}>
      <div className="optimize-modal" onClick={(e) => e.stopPropagation()}>
        <h3>✨ Optimize Note</h3>
        <p className="optimize-hint">
          Choose a preset or enter a custom instruction:
        </p>
        <div className="optimize-presets">
          {presets.map((p) => (
            <button
              key={p}
              className="preset-chip"
              onClick={() => run(p)}
              disabled={loading}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="optimize-custom">
          <input
            placeholder="Custom instruction…"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && instruction.trim() && run()}
          />
          <button
            className="btn-icon"
            onClick={() => instruction.trim() && run()}
            disabled={!instruction.trim() || loading}
          >
            {loading ? <Spinner size={16} /> : <SendIcon fontSize="small" />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── AI Panel ────────────────────────────────────────────────────────────────

function AiPanel({ noteId, summary, onReplaceWithSummary, onCopySummary }) {
  const [chatMessages, setChatMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [loadingAnswer, setLoadingAnswer] = useState(false);
  const [error, setError] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleAsk = async () => {
    const q = question.trim();
    if (!q) return;

    const userMsg = { role: "user", content: q };
    setChatMessages((prev) => [...prev, userMsg]);
    setQuestion("");
    setLoadingAnswer(true);
    setError(null);

    try {
      const history = chatMessages.map(({ role, content }) => ({
        role,
        content,
      }));
      const { answer } = await api.askAboutNote(noteId, q, history);
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: answer },
      ]);
    } catch (err) {
      setError("Failed to get answer. Please try again.");
    } finally {
      setLoadingAnswer(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <div className="ai-panel">
      {/* Summary section */}
      <div className="ai-summary-section">
        <div className="ai-panel-header">
          <AutoAwesomeIcon fontSize="small" className="ai-icon" />
          <h3>AI Summary</h3>
          <div className="ai-panel-actions">
            <button
              className="ai-action-btn"
              title="Copy summary"
              onClick={onCopySummary}
            >
              <ContentCopyIcon fontSize="small" />
            </button>
            <button
              className="ai-action-btn"
              title="Replace note content with summary"
              onClick={onReplaceWithSummary}
            >
              <SwapHorizIcon fontSize="small" />
              <span>Use as Note</span>
            </button>
          </div>
        </div>
        <div className="ai-summary-text">
          <p>{summary}</p>
        </div>
      </div>

      {/* Divider */}
      <div className="ai-divider" />

      {/* Q&A section */}
      <div className="ai-chat-section">
        <h4 className="ai-chat-title">Ask about this note</h4>
        <div className="chat-messages">
          {chatMessages.length === 0 && (
            <p className="chat-placeholder">
              Ask anything about the note content…
            </p>
          )}
          {chatMessages.map((msg, i) => (
            <ChatBubble key={i} msg={msg} />
          ))}
          {loadingAnswer && (
            <div className="chat-bubble chat-bubble--assistant chat-bubble--loading">
              <Spinner size={16} />
            </div>
          )}
          {error && <p className="chat-error">{error}</p>}
          <div ref={chatEndRef} />
        </div>
        <div className="chat-input-row">
          <textarea
            className="chat-input"
            placeholder="Ask a question… (Enter to send)"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
          />
          <button
            className="chat-send-btn"
            onClick={handleAsk}
            disabled={!question.trim() || loadingAnswer}
            title="Send"
          >
            <SendIcon fontSize="small" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main NotePopup ──────────────────────────────────────────────────────────

function NotePopup({ note, onClose, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: note.title,
    content: note.content,
  });
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setDialogOpen] = useState(false);

  // AI state
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(null);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [showOptimize, setShowOptimize] = useState(false);
  const [isDialog2Open, setDialog2Open] = useState(false); //Dialog2 if of replace with summary confirmation

  // Keep formData in sync if note prop changes
  useEffect(() => {
    setFormData({ title: note.title, content: note.content });
    // Reset AI panel when note changes
    setSummary(null);
    setShowAiPanel(false);
    setSummaryError(null);
    setIsEditing(false);
  }, [note._id]);

  // Keyboard: Escape to close
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (showOptimize) setShowOptimize(false);
        else onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, showOptimize]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(note._id, formData);
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData({ title: note.title, content: note.content });
    setIsEditing(false);
  };

  const handleSummarize = async () => {
    if (summary) {
      // Already have summary, just show panel
      setShowAiPanel(true);
      return;
    }
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const data = await api.summarizeNote(note._id);
      setSummary(data.summary);
      setShowAiPanel(true);
    } catch (err) {
      setSummaryError(
        "Failed to generate summary. Check your API key and try again.",
      );
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleReplaceWithSummary = async () => {
    // if (!summary) return;
    // if (!window.confirm("Replace the note content with the AI summary?")) return;
    const updated = { ...formData, content: summary };
    await onUpdate(note._id, updated);
    setFormData(updated);
    setSummary(null);
    setShowAiPanel(false);
    setDialog2Open(false);
  };

  const handleCopySummary = () => {
    if (summary) navigator.clipboard.writeText(summary);
  };

  const handleOptimize = async (instruction) => {
    try {
      const { optimized } = await api.optimizeNote(note._id, instruction);
      const updated = { ...formData, content: optimized };
      await onUpdate(note._id, updated);
      setFormData(updated);
      // Invalidate old summary
      setSummary(null);
      setShowAiPanel(false);
    } catch (err) {
      alert("Optimization failed. Please try again.");
    }
  };

  const handleDelete = () => {
    onDelete(note._id);
    onClose();
  };

  return ReactDOM.createPortal(
    <>
      {/* Backdrop */}
      <div
        className="popup-overlay"
        onClick={onClose}
        aria-label="Close popup"
      />

      {/* Optimize modal */}
      {showOptimize && (
        <OptimizeModal
          onOptimize={handleOptimize}
          onClose={() => setShowOptimize(false)}
        />
      )}

      {/* Main popup */}
      <div
        className={`popup ${showAiPanel ? "popup--split" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={`Note: ${note.title || "Untitled"}`}
      >
        {/* ── Top toolbar ────────────────────────────────────────────── */}
        <div className="popup-toolbar">
          <div className="popup-toolbar-left">
            {showAiPanel && (
              <button
                className="toolbar-btn"
                title="Back to full note"
                onClick={() => setShowAiPanel(false)}
              >
                <ArrowBackIcon fontSize="small" />
              </button>
            )}
            <span className="popup-badge">Note</span>
          </div>
          <div className="popup-toolbar-right">
            {/* Optimize */}
            <button
              className="toolbar-btn toolbar-btn--label"
              title="Optimize tone / rewrite with AI"
              onClick={() => setShowOptimize(true)}
              disabled={summaryLoading}
            >
              <TuneIcon fontSize="small" />
              <span>Optimize</span>
            </button>

            {/* Summarize / AI */}
            <button
              className={`toolbar-btn toolbar-btn--label toolbar-btn--ai ${showAiPanel ? "active" : ""}`}
              title="AI Summary & Q&A"
              onClick={handleSummarize}
              disabled={summaryLoading}
            >
              {summaryLoading ? (
                <Spinner size={16} />
              ) : (
                <AutoAwesomeIcon fontSize="small" />
              )}
              <span>{summaryLoading ? "Summarizing…" : "AI Summary"}</span>
            </button>

            {/* Edit / Save / Cancel */}
            {isEditing ? (
              <>
                <button
                  className="toolbar-btn toolbar-btn--label"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </button>
                <button
                  className="toolbar-btn toolbar-btn--label toolbar-btn--save"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <Spinner size={16} />
                  ) : (
                    <SaveIcon fontSize="small" />
                  )}
                  <span>{saving ? "Saving…" : "Save"}</span>
                </button>
              </>
            ) : (
              <button
                className="toolbar-btn toolbar-btn--label"
                onClick={() => setIsEditing(true)}
                title="Edit note"
              >
                <EditIcon fontSize="small" />
                <span>Edit</span>
              </button>
            )}

            {/* Delete */}
            <button
              className="toolbar-btn toolbar-btn--danger"
              title="Delete note"
              onClick={() => setDialogOpen(true)}
            >
              <DeleteIcon fontSize="small" />
            </button>

            {/* Close */}
            <button
              className="toolbar-btn"
              title="Close (Esc)"
              onClick={onClose}
            >
              <CloseIcon fontSize="small" />
            </button>

            <AlertDialog
              open={isDialogOpen}
              onClose={() => setDialogOpen(false)}
              onConfirm={handleDelete}
              title={"Delete this note?"}
              description={"Once deleted, note can not be retrieved."}
              showCheckbox={true}
              preferenceKey={"hideDeleteDialog"}
            />
          </div>
        </div>

        {/* ── Summary error banner ──────────────────────────────────── */}
        {summaryError && (
          <div className="summary-error">
            {summaryError}
            <button onClick={() => setSummaryError(null)}>✕</button>
          </div>
        )}

        {/* ── Body (split or single) ────────────────────────────────── */}
        <div className="popup-body">
          {/* Left: Note content */}
          <div className="popup-note-pane">
            {isEditing ? (
              <>
                <input
                  className="popup-title-input"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Title"
                  autoFocus
                />
                <textarea
                  className="popup-content-input"
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  placeholder="Note content…"
                />
              </>
            ) : (
              <>
                <h2 className="popup-title">{formData.title || "Untitled"}</h2>
                <div className="popup-content">
                  <p>{formData.content}</p>
                </div>
              </>
            )}
          </div>

          {/* Right: AI Panel (only when showAiPanel) */}
          {showAiPanel && summary && (
            <div className="popup-ai-pane">
              <AiPanel
                noteId={note._id}
                summary={summary}
                onReplaceWithSummary={() => {
                  if (summary) {
                    setDialog2Open(true);
                  }
                }}
                onCopySummary={handleCopySummary}
              />

              <AlertDialog
                open={isDialog2Open}
                onClose={() => setDialog2Open(false)}
                onConfirm={handleReplaceWithSummary}
                title={"Replace the note content with the AI summary?"}
                description={
                  "Once replaced, original note can not be retrieved."
                }
              />
            </div>
          )}
        </div>
      </div>
    </>,
    document.body,
  );
}

export default NotePopup;
