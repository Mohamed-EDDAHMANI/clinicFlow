import { apiFetch } from './client'

export const getAllProducts = () =>
  apiFetch('/product/getAll')

export const getProduct = (id) =>
  apiFetch(`/product/${id}`)

export const createProduct = (payload) =>
  apiFetch('/product/create', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
