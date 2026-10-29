import { CLINIC_TIMEZONE } from '../config/clinic'

const isoDay = new Intl.DateTimeFormat('en-CA', { timeZone: CLINIC_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' })
const clinicClock = new Intl.DateTimeFormat('en-GB', { timeZone: CLINIC_TIMEZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
const longDate = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
const shortDate = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
const weekdayShort = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', timeZone: 'UTC' })
const monthShort = new Intl.DateTimeFormat('fr-FR', { month: 'short', timeZone: 'UTC' })
const rangeDate = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
const timestampDate = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: CLINIC_TIMEZONE })
const count = new Intl.NumberFormat('fr-FR')

const toUtcDate = (isoDate) => new Date(`${isoDate}T00:00:00Z`)

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1)

export const clinicToday = () => isoDay.format(new Date())

export const toMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export const clinicNowMinutes = () => toMinutes(clinicClock.format(new Date()))

export const formatClockTime = (date) => clinicClock.format(date)

export const addDays = (isoDate, days) => {
  const date = toUtcDate(isoDate)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export const startOfWeek = (isoDate) => {
  const day = toUtcDate(isoDate).getUTCDay()
  return addDays(isoDate, day === 0 ? -6 : 1 - day)
}

export const isoWeekNumber = (isoDate) => {
  const thursday = toUtcDate(addDays(startOfWeek(isoDate), 3))
  const yearStart = Date.UTC(thursday.getUTCFullYear(), 0, 1)
  return Math.floor((thursday - yearStart) / 86400000 / 7) + 1
}

export const dayOfMonth = (isoDate) => toUtcDate(isoDate).getUTCDate()

export const formatLongDate = (isoDate) => capitalize(longDate.format(toUtcDate(isoDate)))

export const formatShortDate = (isoDate) => shortDate.format(toUtcDate(isoDate))

export const formatWeekday = (isoDate) => weekdayShort.format(toUtcDate(isoDate)).replace('.', '')

export const formatMonth = (isoDate) => monthShort.format(toUtcDate(isoDate)).replace('.', '')

export const formatDateRange = (start, end) => rangeDate.formatRange(toUtcDate(start), toUtcDate(end))

export const formatTimestamp = (value) => timestampDate.format(new Date(value))

export const ageFrom = (isoDate) => {
  const [year, month, day] = isoDate.split('-').map(Number)
  const [nowYear, nowMonth, nowDay] = clinicToday().split('-').map(Number)
  const hadBirthday = nowMonth > month || (nowMonth === month && nowDay >= day)
  return nowYear - year - (hadBirthday ? 0 : 1)
}

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

export const greeting = () => (clinicNowMinutes() >= 18 * 60 ? 'Bonsoir' : 'Bonjour')

export const isPast = (isoDate, time) => {
  const today = clinicToday()
  if (isoDate !== today) return isoDate < today
  return toMinutes(time) < clinicNowMinutes()
}
