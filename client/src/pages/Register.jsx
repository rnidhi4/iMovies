import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage, getFieldErrors } from '../api/http';
import FormField from '../components/FormField';

// Same rules as the backend (the backend always checks again)
const validate = (form) => {
  const errors = {};
  const name = form.name.trim();
  if (name.length < 2 || name.length > 60) errors.name = 'Name must be 2 to 60 characters';
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = 'Enter a valid email address';
  if (form.password.length < 8) errors.password = 'Password must be at least 8 characters';
  else if (!/[A-Za-z]/.test(form.password)) errors.password = 'Password must contain at least one letter';
  else if (!/\d/.test(form.password)) errors.password = 'Password must contain at least one number';
  if (form.confirmPassword !== form.password) errors.confirmPassword = 'Passwords do not match';
  return errors;
};

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from;
  const redirectTo = from ? `${from.pathname}${from.search || ''}` : '/';

  if (user) return <Navigate to={redirectTo} replace />;

  const handleChange = (event) => setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const created = await register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      toast.success(`Account created. Welcome, ${created.name}!`);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      setErrors(fieldErrors);
      if (Object.keys(fieldErrors).length === 0) toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="im-card p-4 p-md-5">
            <h1 className="h3 mb-1">Create your account</h1>
            <p className="text-muted-im mb-4">It takes less than a minute.</p>

            <form onSubmit={handleSubmit} noValidate>
              <FormField id="name" label="Full name" autoComplete="name" value={form.name} onChange={handleChange} error={errors.name} required />
              <FormField id="email" label="Email" type="email" autoComplete="email" value={form.email} onChange={handleChange} error={errors.email} required />
              <FormField
                id="password"
                label="Password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={handleChange}
                error={errors.password}
                hint="At least 8 characters, with a letter and a number."
                required
              />
              <FormField id="confirmPassword" label="Confirm password" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={handleChange} error={errors.confirmPassword} required />
              <button type="submit" className="btn btn-primary w-100 mt-2" disabled={submitting}>
                {submitting && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
                Create account
              </button>
            </form>

            <p className="text-center small text-muted-im mt-4 mb-0">
              Already have an account? <Link to="/login" state={location.state}>Log in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
