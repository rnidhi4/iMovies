import React from 'react';
import { FaInbox } from 'react-icons/fa';

export default function EmptyState({ icon: Icon = FaInbox, title, message, children }) {
  return (
    <div className="im-card text-center p-4 p-md-5 my-3">
      <Icon size={36} className="text-muted-im mb-3" aria-hidden="true" />
      <h2 className="h5">{title}</h2>
      {message && <p className="text-muted-im mb-3">{message}</p>}
      {children}
    </div>
  );
}
