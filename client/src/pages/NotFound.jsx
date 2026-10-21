import { Link } from 'react-router-dom';
import { FaFilm } from 'react-icons/fa';
import EmptyState from '../components/EmptyState';

export default function NotFound() {
  return (
    <div className="container py-5">
      <EmptyState icon={FaFilm} title="404: Page not found" message="The page you are looking for does not exist or has moved.">
        <Link to="/" className="btn btn-primary">Back to home</Link>
      </EmptyState>
    </div>
  );
}
