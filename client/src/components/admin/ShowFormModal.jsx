import { useState } from 'react';
import { toast } from 'react-toastify';
import { createShow, updateShow } from '../../api/adminApi';
import { getErrorMessage, getFieldErrors } from '../../api/http';
import FormField from '../FormField';
import Modal from '../Modal';
import { toDateTimeLocalValue } from '../../utils/format';

// show = existing show to edit (movie and screen are fixed once created), or undefined to add one.
// movies = [{ _id, title }], screens = [{ _id, label }]
export default function ShowFormModal({ show, movies, screens, onClose, onSaved }) {
  const [form, setForm] = useState({
    movie: show?.movie?._id || movies[0]?._id || '',
    screen: show?.screen?._id || screens[0]?._id || '',
    startsAt: show ? toDateTimeLocalValue(show.startsAt) : '',
    standardPrice: show?.pricing?.STANDARD ?? 200,
    premiumPrice: show?.pricing?.PREMIUM ?? 350,
    isActive: show ? show.isActive : true,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((previous) => ({ ...previous, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const clientErrors = {};
    if (!form.movie) clientErrors.movie = 'Choose a movie';
    if (!form.screen) clientErrors.screen = 'Choose a screen';
    if (!form.startsAt) clientErrors.startsAt = 'Choose a start date and time';
    if (!(Number(form.standardPrice) >= 0)) clientErrors['pricing.STANDARD'] = 'Enter a valid price';
    if (!(Number(form.premiumPrice) >= 0)) clientErrors['pricing.PREMIUM'] = 'Enter a valid price';
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) return;

    const pricing = { STANDARD: Number(form.standardPrice), PREMIUM: Number(form.premiumPrice) };
    const startsAt = new Date(form.startsAt).toISOString();

    setSaving(true);
    try {
      if (show) await updateShow(show._id, { startsAt, pricing, isActive: form.isActive });
      else await createShow({ movie: form.movie, screen: form.screen, startsAt, pricing });
      toast.success(show ? 'Show updated.' : 'Show created.');
      onSaved();
    } catch (error) {
      setErrors(getFieldErrors(error));
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={show ? 'Edit show' : 'Add show'}
      onClose={onClose}
      closeDisabled={saving}
      footer={
        <>
          <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" form="show-form" className="btn btn-primary" disabled={saving}>
            {saving && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
            {show ? 'Save changes' : 'Create show'}
          </button>
        </>
      }
    >
      <form id="show-form" onSubmit={handleSubmit} noValidate>
        <FormField as="select" id="movie" label="Movie" value={form.movie} onChange={handleChange} error={errors.movie} disabled={Boolean(show)}>
          {movies.map((movie) => <option key={movie._id} value={movie._id}>{movie.title}</option>)}
        </FormField>
        <FormField as="select" id="screen" label="Theatre and screen" value={form.screen} onChange={handleChange} error={errors.screen} disabled={Boolean(show)}>
          {screens.map((screen) => <option key={screen._id} value={screen._id}>{screen.label}</option>)}
        </FormField>
        <FormField id="startsAt" label="Start date and time" type="datetime-local" value={form.startsAt} onChange={handleChange} error={errors.startsAt} hint="Uses your computer's timezone; customers see it in IST." required />
        <div className="row">
          <FormField className="col-6" id="standardPrice" label="Standard price (₹)" type="number" min="0" step="1" value={form.standardPrice} onChange={handleChange} error={errors['pricing.STANDARD']} />
          <FormField className="col-6" id="premiumPrice" label="Premium price (₹)" type="number" min="0" step="1" value={form.premiumPrice} onChange={handleChange} error={errors['pricing.PREMIUM']} />
        </div>
        {show && (
          <div className="form-check">
            <input className="form-check-input" type="checkbox" id="isActive" name="isActive" checked={form.isActive} onChange={handleChange} />
            <label className="form-check-label" htmlFor="isActive">Show is active (visible to customers)</label>
          </div>
        )}
      </form>
    </Modal>
  );
}
