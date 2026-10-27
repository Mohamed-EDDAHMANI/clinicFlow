import appointmentService from '../services/appointmentService.js';
import { sendSuccess } from '../utils/apiResponse.js';

const createAppointment = async (req, res) => {
    const appointment = await appointmentService.create(req.body, req.user.id);
    sendSuccess(res, appointment, 'Appointment created successfully', 201);
};

const getAppointments = async (req, res) => {
    const appointments = await appointmentService.getAll(req.query);
    sendSuccess(res, appointments, 'Appointments fetched successfully');
};

const updateAppointmentStatus = async (req, res) => {
    const appointment = await appointmentService.updateStatus(req.params.id, req.body.status, req.user.id);
    sendSuccess(res, appointment, 'Appointment status updated successfully');
};

export default {
    createAppointment,
    getAppointments,
    updateAppointmentStatus
};
