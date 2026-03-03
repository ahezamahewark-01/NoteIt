import { useState, useEffect, Fragment } from "react"; 
import { Button, Dialog, DialogActions, DialogTitle, DialogContent, DialogContentText, Checkbox, FormControlLabel } from "@mui/material";

function AlertDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  showCheckbox = false,
  preferenceKey
}) 
{
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleConfirm = ()=>{
    if(showCheckbox && dontShowAgain && preferenceKey){
      localStorage.setItem(preferenceKey, "true")
    }
    onConfirm()
  }

  useEffect(()=>{
    if(!preferenceKey) return;
    const isHidden = localStorage.getItem(preferenceKey) === "true"
    if(open && isHidden){
        onConfirm()
        onClose()
    }
  }, [open, preferenceKey])

  return (
      <Fragment>
        <Dialog
          onClick={(e) => e.stopPropagation()}
          open={open}
          onClose={onClose}
          closeAfterTransition={false}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
          PaperProps={{
            sx: { borderRadius: "16px", padding: "8px", maxWidth: "400px", bgcolor: "#f0e4d3" },
          }}
        >
          <DialogTitle
            id="alert-dialog-title"
            sx={{ fontWeight: "bold", fontSize: "1.5rem" }}
          >
            {title || "Are you sure?"}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description" sx={{ mb: 2 }}>
              {description}
            </DialogContentText>
            {showCheckbox && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={dontShowAgain}
                    onChange={(e) => setDontShowAgain(e.target.checked)}
                    color="primary"
                  />
                }
                label="Do not show it anymore"
              />
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, justifyContent: "space-between" }}>
            <Button
              sx={{
                backgroundColor: "#f0f0f0",
                color: "#666",
                textTransform: "none",
                borderRadius: "8px",
                flex: 1,
                mr: 1,
                "&:hover": { backgroundColor: "#e0e0e0" },
              }}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              sx={{
                textTransform: "none",
                borderRadius: "8px",
                flex: 1,
                ml: 1,
                boxShadow: "none",
              }}
              variant="contained"
              color="primary"
              onClick={handleConfirm}
              autoFocus
            >
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
      </Fragment>
    )
  // );
}

export default AlertDialog;
