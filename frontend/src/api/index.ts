const API_URL = import.meta.env.VITE_API_URL || '/api'

function getToken(): string {
  return sessionStorage.getItem('token') || ''
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

export interface TravelRecord {
  prefectureCode: string
  notes: string
  visits: Visit[]
  photos?: string[]
}

export async function getTravelRecord(prefectureCode: string): Promise<TravelRecord | null> {
  const res = await fetch(`${API_URL}/travels/${prefectureCode}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  })
  if (res.status === 404) return null
  if (!res.ok) throw new Error('取得失敗')
  return res.json()
}

export async function getAllTravelRecords(): Promise<TravelRecord[]> {
  const res = await fetch(`${API_URL}/travels`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  })
  if (!res.ok) throw new Error('取得失敗')
  return res.json()
}

export async function getPhotoUploadUrl(prefectureCode: string, contentType: string): Promise<{ uploadUrl: string; key: string }> {
  const res = await fetch(`${API_URL}/photos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ prefectureCode, contentType }),
  })
  if (!res.ok) throw new Error('アップロードURL取得失敗')
  return res.json()
}

export async function deletePhoto(key: string): Promise<void> {
  const res = await fetch(`${API_URL}/photos`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ key }),
  })
  if (!res.ok) throw new Error('写真削除失敗')
}

export async function saveTravelRecord(record: TravelRecord): Promise<void> {
  const res = await fetch(`${API_URL}/travels/${record.prefectureCode}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(record),
  })
  if (!res.ok) throw new Error('保存失敗')
}
