const PREFIX = 'ADM';
const PAD_LENGTH = 6;

async function generateAdmissionNumber(client) {
    const result = await client.query(
        `SELECT admission_number
     FROM students
     ORDER BY id DESC
     LIMIT 1
     FOR UPDATE`
    );

    if (result.rows.length === 0) {
        return `${PREFIX}${'1'.padStart(PAD_LENGTH, '0')}`;
    }

    const lastAdmissionNumber = result.rows[0].admission_number;
    const numericPart = parseInt(lastAdmissionNumber.replace(PREFIX, ''), 10);

    const nextNumber = numericPart + 1;
    const padded = String(nextNumber).padStart(PAD_LENGTH, '0');

    return `${PREFIX}${padded}`;
}

module.exports = generateAdmissionNumber;