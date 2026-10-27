import { z } from 'zod';
import db from '../config/db.js';
import { ROLES } from '../config/permissions.js';
import { CLINIC_TIMEZONE } from '../config/clinic.js';
import userModel from '../models/userModel.js';
import patientModel from '../models/patientModel.js';
import userService from '../services/userService.js';
import patientService from '../services/patientService.js';
import appointmentService from '../services/appointmentService.js';
import { name, email, password } from '../validations/authValidation.js';
import staffData from './data/staff.json' with { type: 'json' };
import patientsData from './data/patients.json' with { type: 'json' };
import appointmentsData from './data/appointments.json' with { type: 'json' };

const APPOINTMENTS_PER_PATIENT = 2;

const adminSchema = z.object({
    ADMIN_NAME: name,
    ADMIN_EMAIL: email,
    ADMIN_PASSWORD: password,
});

const getUserId = async (userEmail) => (await userModel.findOne(userEmail)).id;

const clinicDate = async (dayOffset, time) => {
    const { rows: [row] } = await db.query(
        `SELECT (((NOW() AT TIME ZONE $1)::date + $2::int) + $3::time) AT TIME ZONE $1 AS date`,
        [CLINIC_TIMEZONE, dayOffset, time]
    );
    return row.date;
};

const seedAdmin = async () => {
    const result = adminSchema.safeParse(process.env);

    if (!result.success) {
        const issues = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
        throw new Error(`Invalid admin variables in .env: ${issues.join(', ')}`);
    }

    const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = result.data;

    if (await userModel.findOne(ADMIN_EMAIL)) {
        console.log(`Admin already exists: ${ADMIN_EMAIL}`);
    } else {
        await userModel.createUser({ name: ADMIN_NAME, email: ADMIN_EMAIL, password: ADMIN_PASSWORD, role: ROLES.ADMIN });
        console.log(`Admin created: ${ADMIN_EMAIL}`);
    }

    return getUserId(ADMIN_EMAIL);
};

const seedStaff = async (adminId) => {
    for (const staff of staffData) {
        if (await userModel.findOne(staff.email)) {
            console.log(`Staff already exists: ${staff.email}`);
            continue;
        }

        await userService.create({ name: staff.full_name, email: staff.email, password: staff.password, role: ROLES.STAFF }, adminId);
        console.log(`Staff created: ${staff.email}`);
    }

    return Promise.all(staffData.map((staff) => getUserId(staff.email)));
};

const staffForPatient = (staffIds, index) => staffIds[index % staffIds.length];

const seedPatients = async (staffIds) => {
    for (const [index, patient] of patientsData.entries()) {
        await patientService.create(patient, staffForPatient(staffIds, index));
        console.log(`Patient created: ${patient.cin}`);
    }
};

const seedAppointments = async (staffIds) => {
    const { patients } = await patientModel.findAll({ search: '', limit: patientsData.length, offset: 0 });
    const patientIds = new Map(patients.map((patient) => [patient.cin, patient.id]));

    for (const [index, appointment] of appointmentsData.entries()) {
        const patientIndex = Math.floor(index / APPOINTMENTS_PER_PATIENT);
        const { cin } = patientsData[patientIndex];
        const { day_offset, time, ...data } = appointment;
        const appointmentDate = await clinicDate(day_offset, time);

        await appointmentService.create(
            { ...data, patient_id: patientIds.get(cin), appointment_date: appointmentDate },
            staffForPatient(staffIds, patientIndex)
        );
        console.log(`Appointment created: ${cin} ${appointmentDate.toISOString()} (${data.status})`);
    }
};

const hasPatients = async () => {
    const { total } = await patientModel.findAll({ search: '', limit: 1, offset: 0 });
    return total > 0;
};

try {
    const adminId = await seedAdmin();
    const staffIds = await seedStaff(adminId);

    if (await hasPatients()) {
        console.log('Patients already exist, skipping patients and appointments');
    } else {
        await seedPatients(staffIds);
        await seedAppointments(staffIds);
    }
} catch (error) {
    console.error('Seed failed:', error);
    process.exitCode = 1;
} finally {
    await db.end();
}
