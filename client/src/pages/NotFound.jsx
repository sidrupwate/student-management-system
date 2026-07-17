// ============================================================
// pages/NotFound.jsx
// ------------------------------------------------------------
// Shown for any route that doesn't match - registered as the
// catch-all route ("*") in App.jsx.
// ============================================================

import { Link } from 'react-router-dom';
import './NotFound.css';

function NotFound() {
    return (
        <div className="not-found">
            <span className="not-found-code">404</span>
            <h2>This page doesn't exist</h2>
            <p>The page you're looking for was moved, deleted, or never existed.</p>
            <Link to="/" className="btn btn-primary">
                Back to Dashboard
            </Link>
        </div>
    );
}

export default NotFound;