import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FiCode, FiLogOut, FiPlus, FiGrid, FiLogIn, FiUserPlus, FiSun, FiMoon } from 'react-icons/fi';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <div className="brand-icon">
            <FiCode />
          </div>
          <span className="brand-text">Code Snippet</span>
        </Link>

        <div className="navbar-links">
          <Link to="/" className="nav-link">
            <FiGrid size={16} />
            <span>Explore</span>
          </Link>

          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="nav-link">
                <FiCode size={16} />
                <span>My Snippets</span>
              </Link>
              <Link to="/create" className="btn btn-primary btn-sm">
                <FiPlus size={14} />
                <span>New Snippet</span>
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">
                <FiLogIn size={16} />
                <span>Login</span>
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                <FiUserPlus size={14} />
                <span>Sign Up</span>
              </Link>
            </>
          )}

          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
          >
            <div className="theme-toggle-icon">
              {theme === 'dark' ? <FiSun size={16} /> : <FiMoon size={16} />}
            </div>
          </button>

          {isAuthenticated && (
            <button onClick={handleLogout} className="btn btn-ghost btn-sm">
              <FiLogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
