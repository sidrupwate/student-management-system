import api from './Api.js';

/**
 * Fetches a paginated, filterable, searchable list of students.
 * @param {Object} params
 * @param {string} [params.search] - matches name/admission_number/course
 * @param {string} [params.course] - filter by course
 * @param {number} [params.year] - filter by year
 * @param {string} [params.gender] - filter by gender
 * @param {number} [params.page]
 * @param {number} [params.limit]
 * @param {string} [params.sortBy]
 * @param {string} [params.order] - 'asc' | 'desc'
 */
async function getStudents(params = {}) {
    const response = await api.get('/students', { params });
    return response.data; // { success, data, pagination }
}

async function getStudentById(id) {
    const response = await api.get(`/students/${id}`);
    return response.data; // { success, data }
}

function buildStudentFormData(studentData) {
    const formData = new FormData();

    const { photo, ...fields } = studentData;

    Object.entries(fields).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
            formData.append(key, value);
        }
    });

    if (photo instanceof File) {
        formData.append('photo', photo);
    }

    return formData;
}

async function createStudent(studentData) {
    const formData = buildStudentFormData(studentData);

    const response = await api.post('/students', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data; // { success, message, data }
}

async function updateStudent(id, studentData) {
    const formData = buildStudentFormData(studentData);

    const response = await api.put(`/students/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data; // { success, message, data }
}

async function deleteStudent(id) {
    const response = await api.delete(`/students/${id}`);
    return response.data; // { success, message }
}

export default {
    getStudents,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent,
};