import type { ApiResponse } from '../types'
import { mockRequest } from './mock'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'
const API_URL = import.meta.env.VITE_API_URL as string | undefined

async function remoteRequest<T>(
  action: string,
  payload: Record<string, unknown> = {},
): Promise<T> {
  if (!API_URL) {
    throw new Error('Falta VITE_API_URL. Configurala en .env o usá VITE_USE_MOCK=true.')
  }

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, ...payload }),
    redirect: 'follow',
  })

  if (!res.ok) {
    throw new Error(`Error de red (${res.status})`)
  }

  const json = (await res.json()) as ApiResponse<T>
  if (!json.ok) {
    throw new Error(json.error ?? 'Error en la API')
  }
  return json.data as T
}

export async function api<T = unknown>(
  action: string,
  payload: Record<string, unknown> = {},
): Promise<T> {
  if (USE_MOCK) {
    return (await mockRequest(action, payload)) as T
  }
  return remoteRequest<T>(action, payload)
}
