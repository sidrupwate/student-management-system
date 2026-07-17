import './Navbar.css';

function Navbar({ title, onMenuClick }) {
    return (
        <header className="navbar">
            <div className="navbar-left">
                <button
                    type="button"
                    className="navbar-menu-btn"
                    onClick={onMenuClick}
                    aria-label="Toggle navigation menu"
                >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M3 12h18M3 18h18" />
                    </svg>
                </button>
                <h1 className="navbar-title">{title}</h1>
            </div>

            <div className="navbar-right">
                <div className="navbar-user">
                    <div className="navbar-user-avatar">A</div>
                    <div className="navbar-user-info">
                        <span className="navbar-user-name">Admin</span>
                        <span className="navbar-user-role">Administrator</span>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Navbar;