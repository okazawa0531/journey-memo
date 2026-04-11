const API_URL = import.meta.env.VITE_API_URL || '/api'

function getToken(): string {
  return sessionStorage.getItem('token') || ''
}

async function authedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers)
  headers.set('Authorization', `Bearer ${getToken()}`)
  return fetch(url, { ...options, headers })
}

export async function login(password: string): Promise<string> {
  const res = await fetch(`${API_URL}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  if (!res.ok) throw new Error('認証失敗')
  const data = await res.json()
  return data.token
}

export interface Visit {
  date: string
  destination: string
}

export interface Photo {
  key: string
  visitDestination?: string
}

export interface TravelRecord {
  prefectureCode: string
  notes: string
  visits: Visit[]
  photos?: Photo[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeRecord(raw: any): TravelRecord {
  return {
    prefectureCode: raw.prefectureCode,
    notes: raw.notes || '',
    visits: raw.visits ?? [],
    photos: (raw.photos ?? []).map((p: string | Photo) =>
      typeof p === 'string' ? { key: p } : p
    ),
  }
}

export async function getTravelRecord(prefectureCode: string): Promise<TravelRecord | null> {
  const res = await authedFetch(`${API_URL}/travels/${prefectureCode}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error('取得失敗')
  return normalizeRecord(await res.json())
}

export async function getAllTravelRecords(): Promise<TravelRecord[]> {
  const res = await authedFetch(`${API_URL}/travels`)
  if (!res.ok) throw new Error('取得失敗')
  const data = await res.json()
  return data.map(normalizeRecord)
}

export async function getPhotoUploadUrl(prefectureCode: string, contentType: string): Promise<{ uploadUrl: string; key: string }> {
  const res = await authedFetch(`${API_URL}/photos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefectureCode, contentType }),
  })
  if (!res.ok) throw new Error('アップロードURL取得失敗')
  return res.json()
}

export async function deletePhoto(key: string): Promise<void> {
  const res = await authedFetch(`${API_URL}/photos`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key }),
  })
  if (!res.ok) throw new Error('写真削除失敗')
}

export async function saveTravelRecord(record: TravelRecord): Promise<void> {
  const res = await authedFetch(`${API_URL}/travels/${record.prefectureCode}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
  })
  if (!res.ok) throw new Error('保存失敗')
}
