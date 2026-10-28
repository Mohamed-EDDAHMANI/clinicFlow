export const NETWORK_ERROR_MESSAGE = 'Le serveur est injoignable. Vérifiez votre connexion puis réessayez.'

const BACKEND_MESSAGES = {
  'Invalid email or password': 'Email ou mot de passe incorrect.',
  'Too many login attempts per second, please slow down': 'Trop de tentatives de connexion en même temps. Patientez un instant puis réessayez.',
  'Too many requests per second, please slow down': 'Trop de requêtes en même temps. Patientez un instant puis réessayez.',
  'Validation failed': 'Certaines informations sont invalides. Corrigez les champs indiqués.',
  'Access denied': "Vous n'avez pas les droits pour effectuer cette action.",
  'Patient not found': 'Ce patient est introuvable ou a été supprimé.',
  'Appointment not found': 'Ce rendez-vous est introuvable ou a été supprimé.',
  'User not found': 'Cet utilisateur est introuvable.',
  'cin already exists': 'Ce CIN est déjà utilisé par un autre patient.',
  'email already exists': 'Cette adresse email est déjà utilisée.',
  'Patient already has a confirmed appointment within 30 minutes':
    'Ce patient a déjà un rendez-vous confirmé dans les 30 minutes autour de cet horaire.',
}

const STATUS_MESSAGES = {
  400: 'Certaines informations sont invalides.',
  401: 'Votre session a expiré. Reconnectez-vous.',
  403: "Vous n'avez pas les droits pour effectuer cette action.",
  404: "L'élément demandé est introuvable.",
  409: 'Cette action entre en conflit avec des données existantes.',
  429: 'Trop de requêtes. Réessayez dans quelques minutes.',
}

const SERVER_ERROR_MESSAGE = 'Une erreur est survenue sur le serveur. Réessayez plus tard.'

const CONFLICT_FIELDS = {
  'cin already exists': 'cin',
  'email already exists': 'email',
}

export class ApiError extends Error {
  constructor(message, { status = 0, errors = [], field = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
    this.field = field
  }
}

export const toApiError = (status, body) => {
  const backendMessage = body?.message
  const message = BACKEND_MESSAGES[backendMessage] ?? STATUS_MESSAGES[status] ?? SERVER_ERROR_MESSAGE

  return new ApiError(message, {
    status,
    errors: body?.errors ?? [],
    field: CONFLICT_FIELDS[backendMessage] ?? null,
  })
}

export const networkError = () => new ApiError(NETWORK_ERROR_MESSAGE)

export const errorMessage = (error) =>
  error instanceof ApiError ? error.message : SERVER_ERROR_MESSAGE
