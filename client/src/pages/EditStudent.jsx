import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    FiArrowLeft,
    FiUser,
    FiMail,
    FiPhone,
    FiBook,
    FiCalendar,
    FiMapPin,
    FiCamera,
    FiTrash2
} from 'react-icons/fi';
import studentService from '../services/studentService';
import { API_URL } from '../services/Api';
import './AddStudent.css'; // Reuses form layout & photo upload styles

function EditStudent() {
    const { id } = useParams();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    // Page state
    const [loadingStudent, setLoadingStudent] = useState(true);
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState('');
    const [existingPhotoUrl, setExistingPhotoUrl] = useState('');
    const [admissionNumber, setAdmissionNumber] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Calculate valid date ranges for Date of Birth (Age: 10 - 100)
    const today = new Date();
    const maxDate = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate())
        .toISOString()
        .split('T')[0];
    const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate())
        .toISOString()
        .split('T')[0];

    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors }
    } = useForm({
        defaultValues: {
            name: '',
            email: '',
            mobile_number: '',
            gender: '',
            course: '',
            year: '',
            date_of_birth: '',
            address: ''
        }
    });

    // Fetch existing student details
    useEffect(() => {
        const fetchStudent = async () => {
            try {
                const response = await studentService.getStudentById(id);
                if (response.success && response.data) {
                    const student = response.data;

                    // Format date to YYYY-MM-DD for the HTML date input
                    let formattedDob = '';
                    if (student.date_of_birth) {
                        formattedDob = new Date(student.date_of_birth).toISOString().split('T')[0];
                    }

                    reset({
                        name: student.name || '',
                        email: student.email || '',
                        mobile_number: student.mobile_number || '',
                        gender: student.gender || '',
                        course: student.course || '',
                        year: student.year ? String(student.year) : '',
                        date_of_birth: formattedDob,
                        address: student.address || ''
                    });

                    setAdmissionNumber(student.admission_number || '');

                    if (student.photo_url) {
                        setExistingPhotoUrl(student.photo_url);
                        // If it starts with /uploads, prepend the server URL
                        const fullUrl = student.photo_url.startsWith('/uploads')
                            ? `${API_URL}${student.photo_url}`
                            : student.photo_url;
                        setPhotoPreview(fullUrl);
                    }
                } else {
                    toast.error('Student profile not found');
                    navigate('/');
                }
            } catch (err) {
                toast.error(err.message || 'Failed to fetch student details');
                navigate('/');
            } finally {
                setLoadingStudent(false);
            }
        };

        fetchStudent();
    }, [id, reset, navigate]);

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Size limit: 5MB
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Photo size must be smaller than 5MB');
                return;
            }
            // File type limit
            if (!file.type.startsWith('image/')) {
                toast.error('Only image files (JPG, PNG, GIF) are allowed');
                return;
            }
            setPhotoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerFileSelect = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleRemovePhoto = (e) => {
        e.stopPropagation(); // Avoid triggering file selection
        setPhotoFile(null);
        setPhotoPreview('');
        setExistingPhotoUrl(''); // Inform backend we want to clear the photo url
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            // If the user cleared the photo, we explicitly send 'remove'
            // or let backend know that photo_url should be null/empty
            // We append photoFile if a new file is uploaded
            const submitData = {
                ...data,
                // If photoPreview is empty, user clicked Remove Photo. We pass photo_url as empty string to wipe it.
                // Otherwise if no new photo file was selected, we don't need to append photoFile (backend will keep old one).
                photo_url: photoPreview ? existingPhotoUrl : '',
                photo: photoFile
            };

            const response = await studentService.updateStudent(id, submitData);
            toast.success(response.message || 'Student updated successfully');
            navigate(`/students/${id}`);
        } catch (error) {
            // Map server validation field errors to react-hook-form setError
            if (error.fieldErrors && Array.isArray(error.fieldErrors)) {
                error.fieldErrors.forEach((err) => {
                    if (err.field) {
                        setError(err.field, { type: 'server', message: err.message });
                    }
                });
            }
            toast.error(error.message || 'Failed to update student details');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loadingStudent) {
        return (
            <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                <svg className="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ width: '40px', height: '40px', margin: '0 auto 12px' }}>
                    <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="8" />
                </svg>
                <p>Loading profile details...</p>
            </div>
        );
    }

    return (
        <div className="add-student-container">
            <div className="add-student-header">
                <button
                    type="button"
                    className="btn-back"
                    onClick={() => navigate(-1)}
                    aria-label="Go back to previous page"
                >
                    <FiArrowLeft /> Back
                </button>
                {admissionNumber && (
                    <div>
                        <span className="form-label" style={{ marginRight: '8px' }}>Admission Number:</span>
                        <span className="admission-chip">{admissionNumber}</span>
                    </div>
                )}
            </div>

            <div className="add-student-card">
                <form className="student-form" onSubmit={handleSubmit(onSubmit)}>
                    {/* Left Column: Photo Upload */}
                    <div className="photo-upload-section">
                        <span className="form-label" style={{ marginBottom: '12px', display: 'block' }}>
                            Profile Photo
                        </span>

                        <div
                            className="photo-preview-wrapper"
                            onClick={triggerFileSelect}
                            title="Click to update photo"
                        >
                            {photoPreview ? (
                                <img src={photoPreview} alt="Preview" className="photo-preview-image" />
                            ) : (
                                <div className="photo-placeholder">
                                    <FiCamera />
                                    <span>Upload Photo</span>
                                </div>
                            )}
                            <div className="photo-upload-overlay">
                                <span>Change</span>
                            </div>
                        </div>

                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handlePhotoChange}
                            accept="image/*"
                            style={{ display: 'none' }}
                        />

                        {photoPreview && (
                            <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                onClick={handleRemovePhoto}
                                style={{ padding: '4px 8px', fontSize: '0.75rem', marginTop: '4px' }}
                            >
                                <FiTrash2 /> Remove Photo
                            </button>
                        )}

                        <p className="photo-upload-info" style={{ marginTop: '12px' }}>
                            Accepts JPG, PNG, GIF.<br />
                            Max size: 5MB
                        </p>
                    </div>

                    {/* Right Column: Form Inputs */}
                    <div className="form-fields">
                        <div className="form-fields-grid">

                            {/* Full Name */}
                            <div className="form-group">
                                <label htmlFor="name" className="form-label">Full Name *</label>
                                <div className="input-icon-wrapper">
                                    <FiUser className="input-icon" />
                                    <input
                                        id="name"
                                        type="text"
                                        className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                        placeholder="e.g. John Doe"
                                        {...register('name', {
                                            required: 'Full name is required',
                                            minLength: { value: 2, message: 'Name must be at least 2 characters' },
                                            maxLength: { value: 100, message: 'Name cannot exceed 100 characters' },
                                            pattern: {
                                                value: /^[a-zA-Z\s.'-]+$/,
                                                message: 'Name can only contain letters, spaces, and punctuation (. \' -)'
                                            }
                                        })}
                                    />
                                </div>
                                {errors.name && <span className="error-message">{errors.name.message}</span>}
                            </div>

                            {/* Email Address */}
                            <div className="form-group">
                                <label htmlFor="email" className="form-label">Email Address *</label>
                                <div className="input-icon-wrapper">
                                    <FiMail className="input-icon" />
                                    <input
                                        id="email"
                                        type="email"
                                        className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                                        placeholder="e.g. john.doe@example.com"
                                        {...register('email', {
                                            required: 'Email address is required',
                                            pattern: {
                                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                message: 'Invalid email address'
                                            }
                                        })}
                                    />
                                </div>
                                {errors.email && <span className="error-message">{errors.email.message}</span>}
                            </div>

                            {/* Mobile Number */}
                            <div className="form-group">
                                <label htmlFor="mobile_number" className="form-label">Mobile Number *</label>
                                <div className="input-icon-wrapper">
                                    <FiPhone className="input-icon" />
                                    <input
                                        id="mobile_number"
                                        type="tel"
                                        className={`form-control ${errors.mobile_number ? 'is-invalid' : ''}`}
                                        placeholder="10-digit number"
                                        {...register('mobile_number', {
                                            required: 'Mobile number is required',
                                            pattern: {
                                                value: /^[0-9]{10}$/,
                                                message: 'Mobile number must be exactly 10 digits'
                                            }
                                        })}
                                    />
                                </div>
                                {errors.mobile_number && <span className="error-message">{errors.mobile_number.message}</span>}
                            </div>

                            {/* Gender */}
                            <div className="form-group">
                                <label htmlFor="gender" className="form-label">Gender *</label>
                                <div className="input-icon-wrapper">
                                    <FiUser className="input-icon" />
                                    <select
                                        id="gender"
                                        className={`form-control ${errors.gender ? 'is-invalid' : ''}`}
                                        {...register('gender', { required: 'Gender selection is required' })}
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                {errors.gender && <span className="error-message">{errors.gender.message}</span>}
                            </div>

                            {/* Course */}
                            <div className="form-group">
                                <label htmlFor="course" className="form-label">Course *</label>
                                <div className="input-icon-wrapper">
                                    <FiBook className="input-icon" />
                                    <select
                                        id="course"
                                        className={`form-control ${errors.course ? 'is-invalid' : ''}`}
                                        {...register('course', { required: 'Course is required' })}
                                    >
                                        <option value="">Select Course</option>
                                        <option value="Computer Science">Computer Science</option>
                                        <option value="Electronics">Electronics</option>
                                        <option value="Mechanical">Mechanical</option>
                                        <option value="Civil">Civil</option>
                                        <option value="Electrical">Electrical</option>
                                        <option value="Chemical">Chemical</option>
                                        <option value="Information Technology">Information Technology</option>
                                    </select>
                                </div>
                                {errors.course && <span className="error-message">{errors.course.message}</span>}
                            </div>

                            {/* Year */}
                            <div className="form-group">
                                <label htmlFor="year" className="form-label">Academic Year *</label>
                                <div className="input-icon-wrapper">
                                    <FiCalendar className="input-icon" />
                                    <select
                                        id="year"
                                        className={`form-control ${errors.year ? 'is-invalid' : ''}`}
                                        {...register('year', { required: 'Academic year is required' })}
                                    >
                                        <option value="">Select Year</option>
                                        <option value="1">Year 1</option>
                                        <option value="2">Year 2</option>
                                        <option value="3">Year 3</option>
                                        <option value="4">Year 4</option>
                                        <option value="5">Year 5</option>
                                        <option value="6">Year 6</option>
                                    </select>
                                </div>
                                {errors.year && <span className="error-message">{errors.year.message}</span>}
                            </div>

                            {/* Date of Birth */}
                            <div className="form-group form-group-full">
                                <label htmlFor="date_of_birth" className="form-label">Date of Birth *</label>
                                <div className="input-icon-wrapper">
                                    <FiCalendar className="input-icon" />
                                    <input
                                        id="date_of_birth"
                                        type="date"
                                        min={minDate}
                                        max={maxDate}
                                        className={`form-control ${errors.date_of_birth ? 'is-invalid' : ''}`}
                                        {...register('date_of_birth', {
                                            required: 'Date of birth is required'
                                        })}
                                    />
                                </div>
                                {errors.date_of_birth && <span className="error-message">{errors.date_of_birth.message}</span>}
                            </div>

                            {/* Address */}
                            <div className="form-group form-group-full">
                                <label htmlFor="address" className="form-label">Residential Address *</label>
                                <div className="input-icon-wrapper">
                                    <FiMapPin className="input-icon" style={{ top: '15px' }} />
                                    <textarea
                                        id="address"
                                        className={`form-control ${errors.address ? 'is-invalid' : ''}`}
                                        placeholder="Full address details"
                                        {...register('address', {
                                            required: 'Address is required',
                                            minLength: { value: 5, message: 'Address must be at least 5 characters' },
                                            maxLength: { value: 500, message: 'Address cannot exceed 500 characters' }
                                        })}
                                    />
                                </div>
                                {errors.address && <span className="error-message">{errors.address.message}</span>}
                            </div>

                        </div>

                        {/* Submit Actions */}
                        <div className="form-actions">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => navigate(-1)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                            <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="8" />
                                        </svg>
                                        Saving...
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditStudent;
