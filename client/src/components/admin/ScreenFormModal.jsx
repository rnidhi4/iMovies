import { useState } from 'react';
import { toast } from 'react-toastify';
import { createScreen } from '../../api/adminApi';
import { getErrorMessage, getFieldErrors } from '../../api/http';
import FormField from '../FormField';
import Modal from '../Modal';

// Turns the simple form values into the row-by-row layout the API expects.
// Rows are lettered A, B, C... and the LAST rows (furthest from the screen) are premium.
export const buildLayout = ({ rows, seatsPerRow, premiumRows, aisleAfter }) =>
  Array.from({ length: rows }, (_, index) => ({
    label: String.fromCharCode(65 + index),
    seatCount: seatsPerRow,
    tier: index >= rows - premiumRows ? 'PREMIUM' : 'STANDARD',
    aisleAfter: aisleAfter > 0 && aisleAfter < seatsPerRow ? [aisleAfter] : [],
  }));

export default function ScreenFormModal({ theatre, onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', rows: 8, seatsPerRow: 12, premiumRows: 2, aisleAfter: 6 });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleChange = (event) => setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));

  const numbers = {
    rows: Number(form.rows),
    seatsPerRow: Number(form.seatsPerRow),
    premiumRows: Number(form.premiumRows),
    aisleAfter: Number(form.aisleAfter),
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Screen name is required';
    if (!Number.isInteger(numbers.rows) || numbers.rows < 1 || numbers.rows > 26) next.rows = 'Use 1 to 26 rows';
    if (!Number.isInteger(numbers.seatsPerRow) || numbers.seatsPerRow < 1 || numbers.seatsPerRow > 30) next.seatsPerRow = 'Use 1 to 30 seats per row';
    if (!Number.isInteger(numbers.premiumRows) || numbers.premiumRows < 0 || numbers.premiumRows > numbers.rows) next.premiumRows = 'Cannot be more than the number of rows';
    if (!Number.isInteger(numbers.aisleAfter) || numbers.aisleAfter < 0) next.aisleAfter = 'Use 0 for no aisle';
    return next;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const clientErrors = validate();
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) return;

    setSaving(true);
    try {
      await createScreen({ theatre: theatre._id, name: form.name.trim(), layout: { rows: buildLayout(numbers) } });
      toast.success('Screen added.');
      onSaved();
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      setErrors(fieldErrors);
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const total = Number.isFinite(numbers.rows * numbers.seatsPerRow) ? numbers.rows * numbers.seatsPerRow : 0;

  return (
    <Modal
      title={`Add screen to ${theatre.name}`}
      onClose={onClose}
      closeDisabled={saving}
      footer={
        <>
          <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" form="screen-form" className="btn btn-primary" disabled={saving}>
            {saving && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
            Add screen
          </button>
        </>
      }
    >
      <form id="screen-form" onSubmit={handleSubmit} noValidate>
        <FormField id="name" label="Screen name" placeholder="Screen 1" value={form.name} onChange={handleChange} error={errors.name || errors['layout.rows']} required />
        <div className="row">
          <FormField className="col-6" id="rows" label="Rows" type="number" min="1" max="26" value={form.rows} onChange={handleChange} error={errors.rows} />
          <FormField className="col-6" id="seatsPerRow" label="Seats per row" type="number" min="1" max="30" value={form.seatsPerRow} onChange={handleChange} error={errors.seatsPerRow} />
        </div>
        <div className="row">
          <FormField className="col-6" id="premiumRows" label="Premium rows (at the back)" type="number" min="0" value={form.premiumRows} onChange={handleChange} error={errors.premiumRows} />
          <FormField className="col-6" id="aisleAfter" label="Aisle after seat no." type="number" min="0" value={form.aisleAfter} onChange={handleChange} error={errors.aisleAfter} hint="0 means no aisle." />
        </div>
        <p className="small text-muted-im mb-0">This screen will have {total} seats in rows A to {String.fromCharCode(64 + Math.max(1, Math.min(26, numbers.rows || 1)))}.</p>
      </form>
    </Modal>
  );
}
