export const APPOINTMENT_STATUS = {
  pending: {
    label: 'En attente',
    plural: 'En attente',
    chip: 'chip-warn',
    event: 'ev-pending',
    dot: 'var(--warn-dot)',
  },
  confirmed: {
    label: 'Confirmé',
    plural: 'Confirmés',
    chip: 'chip-ok',
    event: 'ev-confirmed',
    dot: 'var(--brand-500)',
  },
  cancelled: {
    label: 'Annulé',
    plural: 'Annulés',
    chip: 'chip-danger',
    event: 'ev-cancelled',
    dot: 'var(--danger)',
  },
}

export const APPOINTMENT_WINDOW_MINUTES = 30

export const REASON_SUGGESTIONS = [
  'Consultation générale',
  'Suivi médical',
  'Bilan annuel',
  'Contrôle tension artérielle',
  'Suivi diabète',
  'Vaccination',
  'Certificat médical',
  'Urgence',
]
