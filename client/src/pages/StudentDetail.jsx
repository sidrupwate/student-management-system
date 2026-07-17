import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    FiArrowLeft,
    FiUser,
    FiMail,
    FiPhone,
    FiBook,
    FiCalendar,
    FiMapPin,
    FiEdit2,
    FiTrash2,
    FiInfo,
    FiAward
} from 'react-icons/fi';
import studentService from '../services/studentService';
import { API_URL } from '../services/Api';
import './StudentDetail.css';

function StudentDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    // Student profile state
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Fetch student profile details
    useEffect(() => {
        const fetchStudentDetails = async () => {
            try {
                const response = await studentService.getStudentById(id);
                if (response.success && response.data) {
                    setStudent(response.data);
                } else {
                    toast.error('Student profile not found');
                    navigate('/');
                }
            } catch (error) {
                toast.error(error.message || 'Failed to load profile details');
                navigate('/');
            } finally {
                setLoading(false);
            }
        };

        fetchStudentDetails();
    }, [id, navigate]);

    // Handle delete/drop student profile
    const handleDeleteStudent = async () => {
        if (!student) return;
        setIsDeleting(true);
        try {
            await studentService.deleteStudent(student.id);
            toast.success(`Student profile of ${student.name} deleted successfully`);
            navigate('/');
        } catch (error) {
            toast.error(error.message || 'Failed to delete student profile');
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    };

    // Helper: format photo URL
    const getPhotoSrc = (photoUrl) => {
        if (!photoUrl) return null;
        if (photoUrl.startsWith('/uploads')) {
            return `${API_URL}${photoUrl}`;
        }
        return photoUrl;
    };

    // Helper: format birth date to a beautiful format
    const formatDob = (dobString) => {
        if (!dobString) return 'N/A';
        try {
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            return new Date(dobString).toLocaleDateString(undefined, options);
        } catch (e) {
            return dobString;
        }
    };

    // Helper: format timestamp
    const formatTimestamp = (timestampString) => {
        if (!timestampString) return 'N/A';
        try {
            const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            return new Date(timestampString).toLocaleDateString(undefined, options);
        } catch (e) {
            return timestampString;
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                <svg className="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ width: '40px', height: '40px', margin: '0 auto 12px' }}>
                    <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="8" />
                </svg>
                <p>Retrieving student profile...</p>
            </div>
        );
    }

    if (!student) {
        return (
            <div style={{ padding: '80px 20px', textAlign: 'center' }}>
                <h3>Student profile not found</h3>
                <Link to="/" className="btn btn-primary" style={{ marginTop: '16px' }}>
                    <FiArrowLeft /> Back to Dashboard
                </Link>
            </div>
        );
    }

    return (
        <div className="profile-container">
            {/* Header with Back button and Unique Admission ID */}
            <div className="profile-header">
                <button
                    type="button"
                    className="btn-back"
                    onClick={() => navigate('/')}
                    aria-label="Go back to dashboard"
                >
                    <FiArrowLeft /> Back to Dashboard
                </button>

                <div>
                    <span className="admission-chip" style={{ fontSize: '0.9rem', padding: '6px 12px' }}>
                        {student.admission_number}
                    </span>
                </div>
            </div>

            {/* Profile grid layout */}
            <div className="profile-layout">

                {/* Left Panel: Profile Summary Card */}
                <div className="profile-summary-card">
                    {student.photo_url ? (
                        <img
                            src={getPhotoSrc(student.photo_url)}
                            alt={student.name}
                            className="profile-avatar-large"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '';
                                e.target.classList.add('fallback-avatar');
                            }}
                        />
                    ) : (
                        <div className="profile-avatar-large">
                            {student.name.charAt(0).toUpperCase()}
                        </div>
                    )}

                    <h2 className="profile-name-title">{student.name}</h2>
                    <span className="profile-joined-text">
                        Enrolled: {formatTimestamp(student.created_at)}
                    </span>

                    <div className="profile-actions">
                        <Link to={`/students/${student.id}/edit`} className="btn btn-primary">
                            <FiEdit2 /> Edit Profile
                        </Link>
                        <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => setShowDeleteModal(true)}
                        >
                            <FiTrash2 /> Drop Student
                        </button>
                    </div>
                </div>

                {/* Right Panel: Information Details Card */}
                <div className="profile-details-card">

                    {/* Section 1: Academic Profile */}
                    <h3 className="details-section-title">
                        <FiAward /> Academic Profile
                    </h3>
                    <div className="details-grid">
                        <div className="detail-item">
                            <span className="detail-label">Registered Course</span>
                            <span className="detail-value">
                                <FiBook /> {student.course}
                            </span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Current Academic Year</span>
                            <span className="detail-value">
                                <FiCalendar /> Year {student.year}
                            </span>
                        </div>
                    </div>

                    {/* Section 2: Contact Information */}
                    <h3 className="details-section-title">
                        <FiMail /> Contact Details
                    </h3>
                    <div className="details-grid">
                        <div className="detail-item">
                            <span className="detail-label">Email Address</span>
                            <span className="detail-value">
                                <FiMail />
                                <a href={`mailto:${student.email}`} style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}>
                                    {student.email}
                                </a>
                            </span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Mobile Number</span>
                            <span className="detail-value">
                                <FiPhone />
                                <a href={`tel:${student.mobile_number}`} style={{ color: 'inherit' }}>
                                    {student.mobile_number}
                                </a>
                            </span>
                        </div>
                    </div>

                    {/* Section 3: Personal Details */}
                    <h3 className="details-section-title">
                        <FiUser /> Personal Details
                    </h3>
                    <div className="details-grid">
                        <div className="detail-item">
                            <span className="detail-label">Date of Birth</span>
                            <span className="detail-value">
                                <FiCalendar /> {formatDob(student.date_of_birth)}
                            </span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Gender Selection</span>
                            <span className="detail-value">
                                <FiUser /> {student.gender}
                            </span>
                        </div>
                    </div>

                    {/* Section 4: Residential Address */}
                    <h3 className="details-section-title">
                        <FiMapPin /> Residential Address
                    </h3>
                    <div className="details-grid" style={{ marginBottom: 0 }}>
                        <div className="detail-item detail-item-full">
                            <span className="detail-label">Full Address</span>
                            <span className="detail-value" style={{ lineHeight: '1.5', alignItems: 'flex-start' }}>
                                <FiMapPin style={{ marginTop: '4px' }} />
                                {student.address}
                            </span>
                        </div>
                    </div>

                </div>

            </div>

            {/* Drop (Delete) Confirmation Modal */}
            {showDeleteModal && (
                <div className="modal-backdrop">
                    <div className="modal-card">
                        <div className="modal-icon-warning">
                            <FiTrash2 />
                        </div>
                        <h3 className="modal-title">Delete Student Profile?</h3>
                        <p className="modal-description">
                            Are you sure you want to delete the profile of <strong>{student.name}</strong>?
                            <br />
                            This will wipe the admission profile{' '}
                            <span className="admission-chip" style={{ fontSize: '0.75rem', padding: '2px 6px' }}>
                                {student.admission_number}
                            </span>{' '}
                            permanently. This action cannot be undone.
                        </p>
                        <div className="modal-actions">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setShowDeleteModal(false)}
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn-danger"
                                onClick={handleDeleteStudent}
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default StudentDetail;
