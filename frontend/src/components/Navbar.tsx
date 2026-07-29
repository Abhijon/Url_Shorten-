import { Link } from 'react-router-dom';
import './Navbar.css';

export function Navbar() {
  return (
    <header className="navbar">
      <Link to="/" className="navbar__brand">
        ShortLink
      </Link>
      <nav className="navbar__links">
        <Link to="/">Home</Link>
        <Link to="/dashboard">Dashboard</Link>
      </nav>
    </header>
  );
}
