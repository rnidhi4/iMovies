import { useState } from 'react';
import { toast } from 'react-toastify';
import { createMovie, updateMovie } from '../../api/adminApi';
import { getErrorMessage, getFieldErrors } from '../../api/http';
import FormField from '../FormField';
import Modal from '../Modal';
import { GENRES, LANGUAGES } from '../../utils/constants';
import { toDateInputValue, toISTDateString } from '../../utils/format';

const emptyForm = {
  title: '', description: '', genres: [], language: 'Hindi', durationMins: 120,
  releaseDate: toISTDateString(), posterUrl: '', trailerUrl: '', rating: 7, castText: '', status: 'NOW_SHOWING',
};

const fromMovie = (movie) => ({
  title: movie.title,
  description: movie.description,
  genres: movie.genres,
  language: movie.language,
  durationMins: movie.durationMins,
  releaseDate: toDateInputValue(movie.releaseDate),
  posterUrl: movie.posterUrl || '',
  trailerUrl: movie.trailerUrl || '',
  rating: movie.rating,
  castText: (movie.cast || []).join(', '),
  status: movie.status,
});

// movie = existing movie to edit, or undefined to add a new one
export default function MovieFormModal({ movie, onClose, onSaved }) {
  const [form, setForm] = useState(() => (movie ? fromMovie(movie) : emptyForm));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleChange = (event) => setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));

  const toggleGenre = (genre) =>
    setForm((previous) => ({
      ...previous,
      genres: previous.genres.includes(genre) ? previous.genres.filter((g) => g !== genre) : [...previous.genres, genre],
    }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form.genres.length === 0) {
      setErrors({ genres: 'Choose at least one genre' });
      return;
    }
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      genres: form.genres,
      language: form.language,
      durationMins: Number(form.durationMins),
      releaseDate: form.releaseDate,
      posterUrl: form.posterUrl.trim(),
      trailerUrl: form.trailerUrl.trim(),
      rating: Number(form.rating),
      cast: form.castText.split(',').map((name) => name.trim()).filter(Boolean),
      status: form.status,
    };

    setSaving(true);
    setErrors({});
    try {
      if (movie) await updateMovie(movie._id, payload);
      else await createMovie(payload);
      toast.success(movie ? 'Movie updated.' : 'Movie added.');
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
      title={movie ? 'Edit movie' : 'Add movie'}
      size="modal-lg"
      onClose={onClose}
      closeDisabled={saving}
      footer={
        <>
          <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" form="movie-form" className="btn btn-primary" disabled={saving}>
            {saving && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
            {movie ? 'Save changes' : 'Add movie'}
          </button>
        </>
      }
    >
      <form id="movie-form" onSubmit={handleSubmit} noValidate>
        <FormField id="title" label="Title" value={form.title} onChange={handleChange} error={errors.title} required />
        <FormField as="textarea" rows={3} id="description" label="Description" value={form.description} onChange={handleChange} error={errors.description} required />

        <fieldset className="mb-3">
          <legend className="form-label fs-6">Genres</legend>
          <div className="d-flex flex-wrap gap-3">
            {GENRES.map((genre) => (
              <div className="form-check" key={genre}>
                <input className="form-check-input" type="checkbox" id={`genre-${genre}`} checked={form.genres.includes(genre)} onChange={() => toggleGenre(genre)} />
                <label className="form-check-label" htmlFor={`genre-${genre}`}>{genre}</label>
              </div>
            ))}
          </div>
          {errors.genres && <div className="text-danger small mt-1" role="alert">{errors.genres}</div>}
        </fieldset>

        <div className="row">
          <FormField as="select" className="col-md-4" id="language" label="Language" value={form.language} onChange={handleChange} error={errors.language}>
            {LANGUAGES.map((language) => <option key={language} value={language}>{language}</option>)}
          </FormField>
          <FormField className="col-md-4" id="durationMins" label="Duration (minutes)" type="number" min="1" max="600" value={form.durationMins} onChange={handleChange} error={errors.durationMins} required />
          <FormField className="col-md-4" id="rating" label="Rating (0 to 10)" type="number" min="0" max="10" step="0.1" value={form.rating} onChange={handleChange} error={errors.rating} />
        </div>

        <div className="row">
          <FormField className="col-md-6" id="releaseDate" label="Release date" type="date" value={form.releaseDate} onChange={handleChange} error={errors.releaseDate} required />
          <FormField as="select" className="col-md-6" id="status" label="Status" value={form.status} onChange={handleChange} error={errors.status}>
            <option value="NOW_SHOWING">Now showing</option>
            <option value="UPCOMING">Upcoming</option>
          </FormField>
        </div>

        <FormField id="posterUrl" label="Poster URL" type="url" placeholder="https://..." value={form.posterUrl} onChange={handleChange} error={errors.posterUrl} hint="Optional. A fallback image is shown if it is empty or broken." />
        <FormField id="trailerUrl" label="Trailer URL" type="url" placeholder="https://www.youtube.com/watch?v=..." value={form.trailerUrl} onChange={handleChange} error={errors.trailerUrl} />
        <FormField id="castText" label="Cast" value={form.castText} onChange={handleChange} error={errors.cast} hint="Separate names with commas." />
      </form>
    </Modal>
  );
}
