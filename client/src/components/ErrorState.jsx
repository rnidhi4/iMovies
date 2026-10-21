import React from "react";
import { FaExclamationTriangle, FaRedo } from 'react-icons/fa';

export default function ErrorState({ title = 'Something went wrong', message, onRetry, children }) {
  return (
    <div className="im-card text-center p-4 p-md-5 my-4" role="alert">
      <FaExclamationTriangle size={36} className="text-warning mb-3" aria-hidden="true" />
      <h2 className="h5">{title}</h2>
      {message && <p className="text-muted-im mb-3">{message}</p>}
      <div className="d-flex gap-2 justify-content-center flex-wrap">
        {onRetry && (
          <button type="button" className="btn btn-primary" onClick={() => onRetry()}>
            <FaRedo className="me-2" aria-hidden="true" />
            Try again
          </button>
        )}
        {children}
      </div>
    </div>
  );
}
