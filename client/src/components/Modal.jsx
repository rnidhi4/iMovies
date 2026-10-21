import { useEffect, useRef } from 'react';

// A simple accessible dialog built with Bootstrap's modal styles (no Bootstrap JavaScript needed).
// Escape closes it, focus moves into it, and focus returns to the previous element when it closes.
export default function Modal({ title, onClose, children, footer, size = '', closeDisabled = false }) {
  const contentRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const closeDisabledRef = useRef(closeDisabled);
  onCloseRef.current = onClose;
  closeDisabledRef.current = closeDisabled;

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    document.body.classList.add('modal-open');
    contentRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !closeDisabledRef.current) onCloseRef.current();
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.classList.remove('modal-open');
      document.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus();
    };
  }, []);

  return (
    <>
      <div
        className="modal d-block"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget && !closeDisabled) onClose();
        }}
      >
        <div className={`modal-dialog modal-dialog-centered modal-dialog-scrollable ${size}`}>
          <div className="modal-content im-card" ref={contentRef} tabIndex={-1}>
            <div className="modal-header">
              <h2 className="modal-title h5" id="modal-title">{title}</h2>
              <button type="button" className="btn-close" aria-label="Close" onClick={onClose} disabled={closeDisabled} />
            </div>
            <div className="modal-body">{children}</div>
            {footer && <div className="modal-footer">{footer}</div>}
          </div>
        </div>
      </div>
      <div className="modal-backdrop show" />
    </>
  );
}
