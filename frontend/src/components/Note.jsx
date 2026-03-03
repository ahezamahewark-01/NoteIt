import DeleteIcon from "@mui/icons-material/Delete";
import { useState } from "react";
import AlertDialog from "./AlertDialog";

function Note({ note, onDelete, onClick }) {
  const [isDialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="note" onClick={onClick}>
      <h1 className="note-title">{note.title || "Untitled"}</h1>
      <p className="note-content">{note.content}</p>
      <button
        className="note-delete-btn"
        title="Delete note"
        onClick={(e) => {
            e.stopPropagation();
             setDialogOpen(true);
        }}
      >
        <DeleteIcon fontSize="small" />
      </button>

      <AlertDialog
        open={isDialogOpen}
        onClose={()=>setDialogOpen(false)}
        onConfirm={() => onDelete(note._id) }
        title={"Delete this note?"}
        description={"Once deleted, note can not be retrieved."}
        showCheckbox={true}
        preferenceKey={"hideDeleteDialog"}
      />
    </div>
  );
}

export default Note;
