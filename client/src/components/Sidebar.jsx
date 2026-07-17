import { NavLink } from 'react-router-dom';
import { FiGrid, FiUserPlus } from 'react-icons/fi';

const NAV_ITEMS = [
    { to: '/', label: 'Dashboard', icon: FiGrid, end: true },
    { to: '/students/add', label: 'Add Student', icon: FiUserPlus },
];

function Sidebar({ isOpen, onClose }) {
    return (
        <>
            {/* Backdrop overlay on mobile */}
            {isOpen && (
                <div
                    className="position-fixed top-0 start-0 w-100 h-100"
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040 }}
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            <aside
                className="d-flex flex-column position-fixed top-0 start-0 h-100 text-white shadow"
                style={{
                    width: 250,
                    backgroundColor: '#000080',
                    zIndex: 1050,
                    transition: 'transform 0.25s ease',
                    transform: isOpen ? 'translateX(0)' : undefined,
                }}
            >
                {/* Brand */}
                <div className="d-flex align-items-center gap-3 px-3 py-4 border-bottom border-light border-opacity-10">
                    <div
                        className="rounded-2 d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                        style={{ width: 40, height: 40, backgroundColor: '#0d6efd', fontSize: '0.875rem' }}
                    >
                        SM
                    </div>
                    <div>
                        <div className="fw-bold lh-sm">StudentMS</div>
                        <small className="text-white-50">Admin Panel</small>
                    </div>
                </div>

                {/* Navigation links */}
                <nav className="d-flex flex-column gap-1 p-3 flex-grow-1">
                    {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            onClick={onClose}
                            className={({ isActive }) =>
                                `d-flex align-items-center gap-3 px-3 py-2 rounded-2 text-decoration-none ${
                                    isActive
                                        ? 'text-white fw-semibold'
                                        : 'text-white-50'
                                }`
                            }
                            style={({ isActive }) => ({
                                backgroundColor: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                                borderLeft: isActive ? '3px solid #0d6efd' : '3px solid transparent',
                                transition: 'background-color 0.15s ease',
                                fontSize: '0.9375rem',
                            })}
                        >
                            <Icon size={18} />
                            <span>{label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Footer */}
                <div className="px-3 py-3 border-top border-light border-opacity-10">
                    <small className="text-white-50 d-block">Student Management System</small>
                    <small className="text-white-50 opacity-50">v1.0.0</small>
                </div>
            </aside>
        </>
    );
}

export default Sidebar;