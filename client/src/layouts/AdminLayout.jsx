import { NavLink, Outlet } from 'react-router-dom';

const links = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/movies', label: 'Movies' },
  { to: '/admin/theatres', label: 'Theatres & Screens' },
  { to: '/admin/shows', label: 'Shows' },
  { to: '/admin/bookings', label: 'Bookings' },
  { to: '/admin/users', label: 'Users' },
];

export default function AdminLayout() {
  return (
    <div className="container py-4">
      <h1 className="page-title mb-3">Admin</h1>
      <nav className="admin-nav mb-4" aria-label="Admin sections">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            {link.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
