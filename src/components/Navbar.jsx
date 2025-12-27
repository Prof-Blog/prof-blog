import { Link } from 'react-router-dom';
import { useState } from 'react';
import './navbar.css';

export default function Navbar({ pages, user, onLogout }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="navbar">
      <div className="nav-brand">Dr. Jayanthi K Pragatheeswaran</div>

      <button
        className="nav-toggle"
        onClick={() => setOpen(!open)}
      >
        ☰
      </button>

      <nav className={`nav-links ${open ? 'open' : ''}`}>
        {pages.map(page => {
          const publicPath =
            page.slug === 'home' ? '/' : `/${page.slug}`;
          const adminPath = `/admin/${page.slug}`;

          return (
            <Link
              key={page.id}
              to={user ? adminPath : publicPath}
              onClick={() => setOpen(false)}
            >
              {page.title}
            </Link>
          );
        })}

        {user && (
          <button className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        )}
      </nav>
    </header>
  );
}
