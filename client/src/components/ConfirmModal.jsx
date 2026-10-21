import Modal from './Modal';

// Render it only while it should be visible:  {open && <ConfirmModal ... />}
export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'danger',
  onConfirm,
  onCancel,
  loading = false,
  confirmDisabled = false,
  children,
}) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      closeDisabled={loading}
      footer={
        <>
          <button type="button" className="btn btn-outline-secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button type="button" className={`btn btn-${confirmVariant}`} onClick={onConfirm} disabled={loading || confirmDisabled}>
            {loading && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
            {confirmLabel}
          </button>
        </>
      }
    >
      {message && <p className="mb-3">{message}</p>}
      {children}
    </Modal>
  );
}
