import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    FiSearch,
    FiUsers,
    FiBook,
    FiCalendar,
    FiEye,
    FiEdit2,
    FiTrash2,
    FiPlus,
    FiFilter,
    FiX,
    FiChevronLeft,
    FiChevronRight,
    FiArrowUp,
    FiArrowDown,
    FiAlertTriangle
} from 'react-icons/fi';
import studentService from '../services/studentService';
import { API_URL } from '../services/Api';

function Dashboard() {
    const navigate = useNavigate();

    // Student list & pagination state
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        totalRecords: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
    });

    // Filtering, searching, sorting state
    const [search, setSearch] = useState('');
    const [searchDebounce, setSearchDebounce] = useState('');
    const [course, setCourse] = useState('');
    const [year, setYear] = useState('');
    const [gender, setGender] = useState('');
    const [sortBy, setSortBy] = useState('created_at');
    const [order, setOrder] = useState('desc');
    const [page, setPage] = useState(1);

    // Delete confirmation modal state
    const [studentToDelete, setStudentToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Debounce search input
    useEffect(() => {
        const handler = setTimeout(() => {
            setSearchDebounce(search);
            setPage(1);
        }, 300);
        return () => clearTimeout(handler);
    }, [search]);

    // Fetch students
    const fetchStudents = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: pagination.limit,
                search: searchDebounce,
                course,
                year: year ? parseInt(year, 10) : undefined,
                gender,
                sortBy,
                order
            };
            const response = await studentService.getStudents(params);
            if (response.success) {
                setStudents(response.data || []);
                setPagination(response.pagination || {
                    page: 1, limit: 10, totalRecords: 0,
                    totalPages: 1, hasNextPage: false, hasPrevPage: false
                });
            }
        } catch (error) {
            toast.error(error.message || 'Failed to load students.');
        } finally {
            setLoading(false);
        }
    }, [page, searchDebounce, course, year, gender, sortBy, order, pagination.limit]);

    useEffect(() => { fetchStudents(); }, [fetchStudents]);

    const handleClearFilters = () => {
        setSearch(''); setCourse(''); setYear(''); setGender('');
        setSortBy('created_at'); setOrder('desc'); setPage(1);
    };

    const handleToggleOrder = () => {
        setOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    };

    const handleDeleteConfirm = async () => {
        if (!studentToDelete) return;
        setIsDeleting(true);
        try {
            await studentService.deleteStudent(studentToDelete.id);
            toast.success(`Student ${studentToDelete.name} dropped successfully`);
            setStudentToDelete(null);
            fetchStudents();
        } catch (error) {
            toast.error(error.message || 'Failed to delete student');
        } finally {
            setIsDeleting(false);
        }
    };

    const getPhotoSrc = (photoUrl) => {
        if (!photoUrl) return null;
        if (photoUrl.startsWith('/uploads')) return `${API_URL}${photoUrl}`;
        return photoUrl;
    };

    const activeFiltersCount = [course, year, gender, searchDebounce].filter(Boolean).length;

    return (
        <div className="container-fluid py-4 px-3 px-md-4">

            {/* ── Analytics Stat Cards ── */}
            <div className="row g-3 mb-4">
                <div className="col-6 col-lg-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body d-flex align-items-center gap-3">
                            <div className="rounded-3 stat-icon stat-icon--sidebar">
                                <FiUsers size={22} />
                            </div>
                            <div>
                                <h4 className="mb-0 fw-bold">{pagination.totalRecords}</h4>
                                <small className="text-muted">Total Students</small>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-lg-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body d-flex align-items-center gap-3">
                            <div className="rounded-3 stat-icon stat-icon--success">
                                <FiBook size={22} />
                            </div>
                            <div>
                                <h4 className="mb-0 fw-bold">7</h4>
                                <small className="text-muted">Offered Courses</small>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-lg-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body d-flex align-items-center gap-3">
                            <div className="rounded-3 stat-icon stat-icon--accent">
                                <FiCalendar size={22} />
                            </div>
                            <div>
                                <h4 className="mb-0 fw-bold">6</h4>
                                <small className="text-muted">Academic Years</small>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-lg-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body d-flex align-items-center gap-3">
                            <div className={`rounded-3 stat-icon ${activeFiltersCount > 0 ? 'stat-icon--danger' : 'stat-icon--neutral'}`}>
                                <FiFilter size={22} />
                            </div>
                            <div>
                                <h4 className="mb-0 fw-bold" style={{ fontSize: '1.1rem' }}>
                                    {activeFiltersCount > 0 ? `${students.length} found` : 'Active'}
                                </h4>
                                <small className="text-muted">
                                    {activeFiltersCount > 0 ? `${activeFiltersCount} filter(s)` : 'No filters'}
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Search & Filter Controls ── */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
                    <span className="fw-semibold">
                        <FiFilter className="me-2" style={{ verticalAlign: '-2px' }} />
                        Search &amp; Filter
                    </span>
                    {activeFiltersCount > 0 && (
                        <button type="button" className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                            onClick={handleClearFilters}>
                            <FiX size={14} /> Clear All
                        </button>
                    )}
                </div>
                <div className="card-body">
                    <div className="row g-3">
                        {/* Search */}
                        <div className="col-12 col-md-4">
                            <label className="form-label small fw-semibold text-muted text-uppercase">Search</label>
                            <div className="input-group">
                                <span className="input-group-text bg-white"><FiSearch size={14} /></span>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Name, admission no., course..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Course */}
                        <div className="col-6 col-md-2">
                            <label className="form-label small fw-semibold text-muted text-uppercase">Course</label>
                            <select className="form-select" value={course}
                                onChange={(e) => { setCourse(e.target.value); setPage(1); }}>
                                <option value="">All Courses</option>
                                <option value="Computer Science">Computer Science</option>
                                <option value="Electronics">Electronics</option>
                                <option value="Mechanical">Mechanical</option>
                                <option value="Civil">Civil</option>
                                <option value="Electrical">Electrical</option>
                                <option value="Chemical">Chemical</option>
                                <option value="Information Technology">IT</option>
                            </select>
                        </div>

                        {/* Year */}
                        <div className="col-6 col-md-2">
                            <label className="form-label small fw-semibold text-muted text-uppercase">Year</label>
                            <select className="form-select" value={year}
                                onChange={(e) => { setYear(e.target.value); setPage(1); }}>
                                <option value="">All Years</option>
                                {[1, 2, 3, 4, 5, 6].map(y => <option key={y} value={y}>Year {y}</option>)}
                            </select>
                        </div>

                        {/* Gender */}
                        <div className="col-6 col-md-2">
                            <label className="form-label small fw-semibold text-muted text-uppercase">Gender</label>
                            <select className="form-select" value={gender}
                                onChange={(e) => { setGender(e.target.value); setPage(1); }}>
                                <option value="">All</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        {/* Sort */}
                        <div className="col-6 col-md-2">
                            <label className="form-label small fw-semibold text-muted text-uppercase">Sort By</label>
                            <div className="input-group">
                                <select className="form-select" value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}>
                                    <option value="created_at">Date Joined</option>
                                    <option value="name">Name</option>
                                    <option value="admission_number">Admission No.</option>
                                    <option value="course">Course</option>
                                    <option value="year">Year</option>
                                </select>
                                <button type="button" className="btn btn-outline-secondary"
                                    onClick={handleToggleOrder}
                                    title={order === 'asc' ? 'Ascending' : 'Descending'}>
                                    {order === 'asc' ? <FiArrowUp size={14} /> : <FiArrowDown size={14} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Student Table ── */}
            <div className="card border-0 shadow-sm mb-4">
                {loading ? (
                    <div className="card-body text-center py-5 text-muted">
                        <div className="spinner-border text-primary mb-3" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mb-0">Loading student directory...</p>
                    </div>
                ) : students.length === 0 ? (
                    <div className="card-body text-center py-5">
                        <FiUsers size={48} className="text-muted mb-3" />
                        <h5>No Students Found</h5>
                        <p className="text-muted mb-3">Try adjusting your filters or add a new student.</p>
                        <Link to="/students/add" className="btn btn-primary d-inline-flex align-items-center gap-2">
                            <FiPlus /> Add Student
                        </Link>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Student</th>
                                    <th>Admission No.</th>
                                    <th>Course</th>
                                    <th>Year</th>
                                    <th>Mobile</th>
                                    <th>Gender</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student) => (
                                    <tr key={student.id}>
                                        {/* Avatar + Name + Email */}
                                        <td>
                                            <div className="d-flex align-items-center gap-3">
                                                {student.photo_url ? (
                                                    <img
                                                        src={getPhotoSrc(student.photo_url)}
                                                        alt={student.name}
                                                        className="student-avatar"
                                                        onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                                                    />
                                                ) : (
                                                    <div className="student-avatar-fallback">
                                                        {student.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div>
                                                    <Link to={`/students/${student.id}`}
                                                        className="fw-semibold text-decoration-none text-dark d-block">
                                                        {student.name}
                                                    </Link>
                                                    <small className="text-muted">{student.email}</small>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Admission Number Badge */}
                                        <td>
                                            <span className="admission-chip">
                                                {student.admission_number}
                                            </span>
                                        </td>

                                        <td>{student.course}</td>
                                        <td><span className="badge bg-accent-soft text-accent">Year {student.year}</span></td>
                                        <td>{student.mobile_number}</td>
                                        <td><span className="badge bg-neutral-soft text-neutral">{student.gender}</span></td>

                                        {/* Actions */}
                                        <td className="text-end">
                                            <div className="btn-group btn-group-sm">
                                                <button type="button" className="btn btn-outline-primary" title="View"
                                                    onClick={() => navigate(`/students/${student.id}`)}>
                                                    <FiEye size={14} />
                                                </button>
                                                <button type="button" className="btn btn-outline-success" title="Edit"
                                                    onClick={() => navigate(`/students/${student.id}/edit`)}>
                                                    <FiEdit2 size={14} />
                                                </button>
                                                <button type="button" className="btn btn-outline-danger" title="Delete"
                                                    onClick={() => setStudentToDelete(student)}>
                                                    <FiTrash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Pagination ── */}
            {!loading && students.length > 0 && (
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 mb-4">
                    <small className="text-muted">
                        Showing {(pagination.page - 1) * pagination.limit + 1} –{' '}
                        {Math.min(pagination.page * pagination.limit, pagination.totalRecords)} of{' '}
                        {pagination.totalRecords} records
                    </small>
                    <nav>
                        <ul className="pagination pagination-sm mb-0">
                            <li className={`page-item ${!pagination.hasPrevPage ? 'disabled' : ''}`}>
                                <button className="page-link d-flex align-items-center gap-1"
                                    onClick={() => setPage((p) => Math.max(p - 1, 1))}>
                                    <FiChevronLeft size={14} /> Prev
                                </button>
                            </li>
                            <li className="page-item active">
                                <span className="page-link">
                                    {pagination.page} / {pagination.totalPages}
                                </span>
                            </li>
                            <li className={`page-item ${!pagination.hasNextPage ? 'disabled' : ''}`}>
                                <button className="page-link d-flex align-items-center gap-1"
                                    onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages))}>
                                    Next <FiChevronRight size={14} />
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>
            )}

            {/* ── Delete Confirmation Modal (Bootstrap) ── */}
            {studentToDelete && (
                <>
                    <div className="modal fade show d-block modal-overlay" tabIndex="-1">
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content border-0 shadow">
                                <div className="modal-header border-0 pb-0">
                                    <h5 className="modal-title">Drop Student Record</h5>
                                    <button type="button" className="btn-close"
                                        onClick={() => setStudentToDelete(null)} disabled={isDeleting} />
                                </div>
                                <div className="modal-body text-center py-4">
                                    <div className="rounded-circle bg-danger bg-opacity-10 d-inline-flex align-items-center justify-content-center mb-3"
                                        style={{ width: 64, height: 64 }}>
                                        <FiAlertTriangle size={28} className="text-danger" />
                                    </div>
                                    <p className="mb-2">
                                        Are you sure you want to drop <strong>{studentToDelete.name}</strong>?
                                    </p>
                                    <p className="text-muted small mb-0">
                                        Admission profile{' '}
                                        <span className="badge bg-warning bg-opacity-10 text-warning border border-warning"
                                            style={{ fontFamily: 'monospace' }}>
                                            {studentToDelete.admission_number}
                                        </span>{' '}
                                        will be permanently deleted. This cannot be undone.
                                    </p>
                                </div>
                                <div className="modal-footer border-0 pt-0 justify-content-center gap-2">
                                    <button type="button" className="btn btn-secondary"
                                        onClick={() => setStudentToDelete(null)} disabled={isDeleting}>
                                        Cancel
                                    </button>
                                    <button type="button" className="btn btn-danger d-flex align-items-center gap-2"
                                        onClick={handleDeleteConfirm} disabled={isDeleting}>
                                        {isDeleting ? (
                                            <><span className="spinner-border spinner-border-sm" /> Dropping...</>
                                        ) : (
                                            <><FiTrash2 size={14} /> Confirm Drop</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default Dashboard;
