"use client"; 

import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import ProductBuyButton from "../../Buttons/ProductBuy/ProductBuy";
// import Button from "@mui/material/Button";

/**
 * Props:
 * - open (boolean): whether the dialog is open
 * - onClose (function): callback when the dialog should close
 * - title? (string): optional title text
 * - message? (string): optional main message text
 */
export default function SuccessfulOrderPopup({
  open,
  onClose,
  title = "🎉 Вітаємо!",
  message = "Ваше замовлення успішно сформоване.",
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        style: {
          borderRadius: "15px",
          padding: "30px",
          backgroundColor: "#f7f9fc",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
        },
      }}
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: "blur(8px)",
          },
        },
      }}
    >
      <DialogTitle
        sx={{ textAlign: "center", fontWeight: "bold" }}
        variant="h4"
      >
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText
          sx={{ textAlign: "center", fontSize: "1.3rem", color: "#333" }}
        >
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "center" }}>
        <ProductBuyButton text="На головну" onClick={onClose} />
      </DialogActions>
    </Dialog>
  );
}
