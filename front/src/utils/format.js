const longDate = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
})

const shortDate = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

const clockTime =new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' })

const count = new Intl.NumberFormat('fr-FR')

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1)

export const formatLongDate = (isoDate) => capitalize(longDate.format(new Date(`${isoDate}T00:00:00Z`)))

export const formatShortDate = (isoDate) => shortDate.format(new Date(`${isoDate}T00:00:00Z`))

export const ageFrom = (isoDate) => {
  const [year, month, day] = isoDate.split('-').map(Number)
  const now = new Date()
  const hadBirthday = now.getMonth() + 1 > month || (now.getMonth() + 1 === month && now.getDate() >= day)
  return now.getFullYear() - year - (hadBirthday ? 0 : 1)
}

export const formatClockTime =(date) => clockTime.format(date)

export const formatCount = (value) => count.format(value)

const nameParts = (fullName) => (fullName ?? '').trim().split(/\s+/).filter(Boolean)

export const initials = (fullName) =>
  nameParts(fullName)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')

export const firstName = (fullName) => nameParts(fullName)[0] ?? ''

export const plural = (value, singular, pluralForm = `${singular}s`) =>
  `${formatCount(value)} ${value > 1 ? pluralForm : singular}`
