import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import './AdminLayout.css';

const PAGE_TITLES = {
    '/': 'Dashboard',
    '/students/add': 'Add Student',
};

function getPageTitle(pathname) {
    if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
    if (pathname.startsWith('/students/') && pathname.endsWith('/edit')) return 'Edit Student';
    if (pathname.startsWith('/students/')) return 'Student Details';
    return 'Student Management System';
}

function AdminLayout() {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const location = useLocation();

    const handleToggleCollapse = () => {
        setIsSidebarCollapsed((prev) => !prev);
    };

    const handleMobileMenuClick = () => {
        setIsMobileSidebarOpen((prev) => !prev);
    };

    const handleSidebarClose = () => {
        setIsMobileSidebarOpen(false);
    };

    return (
        <div
            className={`admin-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}
        >
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                isMobileOpen={isMobileSidebarOpen}
                onToggleCollapse={handleToggleCollapse}
                onClose={handleSidebarClose}
            />

            <div className="admin-layout-main">
                <Navbar
                    title={getPageTitle(location.pathname)}
                    onMenuClick={handleMobileMenuClick}
                />
                <main className="admin-layout-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default AdminLayout;
