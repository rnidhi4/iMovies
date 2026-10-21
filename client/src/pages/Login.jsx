import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage, getFieldErrors } from '../api/http';
import FormField from '../components/FormField';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // After logging in, go back to the page the user originally wanted
  const from = location.state?.from;
  const redirectTo = from ? `${from.pathname}${from.search || ''}` : '/';

  if (user) return <Navigate to={redirectTo} replace />;

  const handleChange = (event) => setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) nextErrors.email = 'Enter a valid email address';
    if (!form.password) nextErrors.password = 'Password is required';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const loggedIn = await login({ email: form.email.trim(), password: form.password });
      toast.success(`Welcome back, ${loggedIn.name}!`);
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
        <div className="col-md-7 col-lg-5">
          <div className="im-card p-4 p-md-5">
            <h1 className="h3 mb-1">Welcome back</h1>
            <p className="text-muted-im mb-4">Log in to book tickets and manage your bookings.</p>
            {from && <div className="alert alert-info py-2 small" role="status">Please log in to continue.</div>}

            <form onSubmit={handleSubmit} noValidate>
              <FormField id="email" label="Email" type="email" autoComplete="email" value={form.email} onChange={handleChange} error={errors.email} required />
              <FormField id="password" label="Password" type="password" autoComplete="current-password" value={form.password} onChange={handleChange} error={errors.password} required />
              <button type="submit" className="btn btn-primary w-100 mt-2" disabled={submitting}>
                {submitting && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
                Log in
              </button>
            </form>

            <p className="text-center small text-muted-im mt-4 mb-0">
              New to IMovies? <Link to="/register" state={location.state}>Create an account</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
