import { apiFetch } from './client'

export const getDashboardStats = async () => (await apiFetch('/dashboard/stats')).data
