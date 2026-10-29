import { getPatients } from '../api/patientService'

const EXPORT_PAGE_SIZE = 100

const HEADERS = ['Nom complet', 'CIN', 'Téléphone', 'Date de naissance', 'Adresse', 'Ajouté le']

const toCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`

export const exportPatients = async (search = '') => {
  const patients = []
  let page = 1
  let totalPages

  do {
    const result = await getPatients({ search, page, limit: EXPORT_PAGE_SIZE })
    patients.push(...result.patients)
    totalPages = result.meta.totalPages
    page += 1
  } while (page <= totalPages)

  const rows = [
    HEADERS,
    ...patients.map((patient) => [
      patient.full_name,
      patient.cin,
      patient.phone,
      patient.birth_date,
      patient.address,
      patient.created_at.slice(0, 10),
    ]),
  ]
  const csv = rows.map((row) => row.map(toCell).join(';')).join('\n')
  const url = URL.createObjectURL(new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'patients-clinicflow.csv'
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)

  return patients.length
}
