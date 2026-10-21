import { useState } from 'react';
import { toast } from 'react-toastify';
import { createTheatre, updateTheatre } from '../../api/adminApi';
import { getErrorMessage, getFieldErrors } from '../../api/http';
import FormField from '../FormField';
import Modal from '../Modal';

export default function TheatreFormModal({ theatre, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: theatre?.name || '',
    city: theatre?.city || '',
    address: theatre?.address || '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleChange = (event) => setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = { name: form.name.trim(), city: form.city.trim(), address: form.address.trim() };
    setSaving(true);
    setErrors({});
    try {
      if (theatre) await updateTheatre(theatre._id, payload);
      else await createTheatre(payload);
      toast.success(theatre ? 'Theatre updated.' : 'Theatre added.');
      onSaved();
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      setErrors(fieldErrors);
      toast.error(Object.keys(fieldErrors).length ? 'Please fix the highlighted fields.' : getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={theatre ? 'Edit theatre' : 'Add theatre'}
      onClose={onClose}
      closeDisabled={saving}
      footer={
        <>
          <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" form="theatre-form" className="btn btn-primary" disabled={saving}>
            {saving && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
            {theatre ? 'Save changes' : 'Add theatre'}
          </button>
        </>
      }
    >
      <form id="theatre-form" onSubmit={handleSubmit} noValidate>
        <FormField id="name" label="Theatre name" value={form.name} onChange={handleChange} error={errors.name} required />
        <FormField id="city" label="City" value={form.city} onChange={handleChange} error={errors.city} required />
        <FormField id="address" label="Address" value={form.address} onChange={handleChange} error={errors.address} required />
      </form>
    </Modal>
  );
}
