import { NavLink } from 'react-router-dom';
import { FiGrid, FiUserPlus, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import './Sidebar.css';

const NAV_ITEMS = [
    { to: '/', label: 'Dashboard', icon: FiGrid, end: true },
    { to: '/students/add', label: 'Add Student', icon: FiUserPlus },
];

function Sidebar({ isCollapsed, isMobileOpen, onToggleCollapse, onClose }) {
    return (
        <>
            {isMobileOpen && (
                <div
                    className="sidebar-backdrop"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            <aside
                className={[
                    'sidebar',
                    isCollapsed && 'sidebar-collapsed',
                    isMobileOpen && 'sidebar-open',
                ]
                    .filter(Boolean)
                    .join(' ')}
            >
                <div className="sidebar-header">
                    <div className="sidebar-brand">
                        <div className="sidebar-brand-mark">SM</div>
                        <div className="sidebar-brand-text">
                            <div className="sidebar-brand-name">StudentMS</div>
                            <small className="sidebar-brand-sub">Admin Panel</small>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="sidebar-toggle-btn"
                        onClick={onToggleCollapse}
                        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {isCollapsed ? <FiChevronRight size={18} /> : <FiChevronLeft size={18} />}
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            title={isCollapsed ? label : undefined}
                            onClick={onClose}
                            className={({ isActive }) =>
                                `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
                            }
                        >
                            <Icon size={18} className="sidebar-link-icon" />
                            <span className="sidebar-link-label">{label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-footer-text">
                        <small>Student Management System</small>
                        <small className="sidebar-footer-version">v1.0.0</small>
                    </div>
                </div>
            </aside>
        </>
    );
}

export default Sidebar;
