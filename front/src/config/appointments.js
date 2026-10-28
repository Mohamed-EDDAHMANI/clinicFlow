const REASON_ICONS = [
  { pattern: /tension|bilan|cardi/i, icon: 'monitor_heart' },
  { pattern: /douleur|articul|bless/i, icon: 'healing' },
  { pattern: /pédiatr|enfant|bébé/i, icon: 'child_care' },
]

export const reasonIcon = (reason = '') =>
  REASON_ICONS.find(({ pattern }) => pattern.test(reason))?.icon ?? 'stethoscope'

export const APPOINTMENT_STATUS = {
  pending: {
    label: 'En attente',
    plural: 'En attente',
    icon: 'pending',
    badge: 'bg-surface-container text-tertiary',
    bar: 'bg-tertiary-container',
    avatar: 'bg-primary-fixed text-on-primary-fixed',
    figure: 'text-tertiary',
  },
  confirmed: {
    label: 'Confirmé',
    plural: 'Confirmés',
    icon: 'check_circle',
    filled: true,
    badge: 'bg-secondary-container text-on-secondary-container',
    bar: 'bg-secondary',
    avatar: 'bg-secondary-container text-on-secondary-container',
    figure: 'text-secondary',
  },
  cancelled: {
    label: 'Annulé',
    plural: 'Annulés',
    icon: 'cancel',
    badge: 'bg-error-container text-on-error-container',
    bar: 'bg-error',
    avatar: 'bg-surface-variant text-on-surface',
    figure: 'text-error',
  },
}
