import React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { FaBars, FaFilm, FaSignOutAlt, FaTicketAlt, FaTimes, FaUser, FaUserShield } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const navLinkClass = ({ isActive }) => `nav-link ${isActive ? 'active' : ''}`;

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Close both menus whenever the page changes
  useEffect(() => {
    setMenuOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  // Close the user menu when clicking elsewhere or pressing Escape
  useEffect(() => {
    const handleClick = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) setUserMenuOpen(false);
    };
    const handleKey = (event) => {
      if (event.key === 'Escape') setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    try {
      await logout();
      toast.success('You have been logged out.');
      navigate('/');
    } catch (error) {
      toast.error('Could not log out. Please try again.');
    }
  };

  return (
    <nav className="im-navbar navbar navbar-expand-lg" aria-label="Main navigation">
      <div className="container">
        <Link to="/" className="brand-logo navbar-brand m-0">
          <FaFilm className="brand-icon" aria-hidden="true" />
          <span className="text-white">I</span><span>Movies</span>
        </Link>

        <button
          type="button"
          className="navbar-toggler border-0 text-white"
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          aria-controls="main-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
        </button>

        <div id="main-menu" className={`navbar-collapse collapse ${menuOpen ? 'show' : ''}`}>
          <ul className="navbar-nav me-auto mt-2 mt-lg-0">
            <li className="nav-item"><NavLink to="/" end className={navLinkClass}>Home</NavLink></li>
            <li className="nav-item"><NavLink to="/movies" className={navLinkClass}>Movies</NavLink></li>
            <li className="nav-item"><NavLink to="/my-bookings" className={navLinkClass}>My Bookings</NavLink></li>
          </ul>

          <ul className="navbar-nav align-items-lg-center gap-lg-2 mb-2 mb-lg-0">
            {user ? (
              <li className="nav-item user-menu" ref={userMenuRef}>
                <button
                  type="button"
                  className="btn btn-outline-secondary d-flex align-items-center gap-2"
                  aria-haspopup="true"
                  aria-expanded={userMenuOpen}
                  onClick={() => setUserMenuOpen((open) => !open)}
                >
                  <FaUser aria-hidden="true" />
                  <span className="text-truncate" style={{ maxWidth: '9rem' }}>{user.name}</span>
                </button>
                {userMenuOpen && (
                  <div className="user-menu-panel">
                    <Link to="/my-bookings"><FaTicketAlt aria-hidden="true" /> My Bookings</Link>
                    {isAdmin && <Link to="/admin"><FaUserShield aria-hidden="true" /> Admin Dashboard</Link>}
                    <button type="button" onClick={handleLogout}><FaSignOutAlt aria-hidden="true" /> Logout</button>
                  </div>
                )}
              </li>
            ) : (
              <>
                <li className="nav-item"><NavLink to="/login" className={navLinkClass}>Login</NavLink></li>
                <li className="nav-item"><Link to="/register" className="btn btn-primary btn-sm px-3">Register</Link></li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
