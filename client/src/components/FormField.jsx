// A label + input (or select/textarea) + error message, wired up for screen readers.
// Usage: <FormField id="email" label="Email" type="email" value={...} onChange={...} error={errors.email} />
//        <FormField as="select" id="language" label="Language" ...><option>...</option></FormField>
export default function FormField({ id, label, error, hint, as: Control = 'input', className = '', children, ...props }) {
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`mb-3 ${className}`}>
      <label htmlFor={id} className="form-label">{label}</label>
      <Control
        id={id}
        name={id}
        className={`${Control === 'select' ? 'form-select' : 'form-control'} ${error ? 'is-invalid' : ''}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...props}
      >
        {children}
      </Control>
      {hint && <div id={`${id}-hint`} className="form-text">{hint}</div>}
      {error && <div id={`${id}-error`} className="invalid-feedback">{error}</div>}
    </div>
  );
}
