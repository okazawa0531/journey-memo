import { useState, useEffect } from 'react'
import { TravelRecord, Visit, getTravelRecord, saveTravelRecord } from '../api'
import { PREFECTURE_NAMES } from './PrefectureList'

interface Props {
  prefectureCode: string
  existingRecord: TravelRecord | null
  onSave: (record: TravelRecord) => void
  onClose: () => void
}

export default function PrefectureModal({ prefectureCode, existingRecord, onSave, onClose }: Props) {
  const [record, setRecord] = useState<TravelRecord>({
    prefectureCode,
    notes: '',
    visits: [],
  })
  const [newDate, setNewDate] = useState('')
  const [newDestination, setNewDestination] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  function normalize(data: TravelRecord): TravelRecord {
    return { ...data, visits: data.visits ?? [] }
  }

  useEffect(() => {
    if (existingRecord) {
      setRecord(normalize(existingRecord))
      setLoading(false)
    } else {
      getTravelRecord(prefectureCode)
        .then(data => {
          if (data) setRecord(normalize(data))
        })
        .finally(() => setLoading(false))
    }
  }, [prefectureCode, existingRecord])

  async function handleSave() {
    setSaving(true)
    try {
      await saveTravelRecord(record)
      onSave(record)
    } catch (_e) {
      alert('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  function addVisit() {
    if (!newDestination) return
    const newVisit: Visit = { date: newDate, destination: newDestination }
    setRecord(prev => ({
      ...prev,
      visits: [...prev.visits, newVisit].sort((a, b) => a.date.localeCompare(b.date)),
    }))
    setNewDate('')
    setNewDestination('')
  }

  function removeVisit(index: number) {
    setRecord(prev => ({ ...prev, visits: prev.visits.filter((_, i) => i !== index) }))
  }

  const prefName = PREFECTURE_NAMES[prefectureCode] || prefectureCode

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="bg-primary-700 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-lg font-bold">{prefName}</h2>
          <button onClick={onClose} className="text-primary-200 hover:text-white text-xl">&#x2715;</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* 訪問記録（日付＋行き先） */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">訪問記録</label>
              <div className="space-y-2 mb-3">
                <input
                  type="date"
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newDestination}
                    onChange={e => setNewDestination(e.target.value)}
                    placeholder="行き先（例：金閣寺、嵐山）"
                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                    onKeyDown={e => { if (e.key === 'Enter') addVisit() }}
                  />
                  <button
                    onClick={addVisit}
                    disabled={!newDestination}
                    className="bg-primary-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-primary-700 disabled:bg-primary-300"
                  >
                    追加
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                {record.visits.map((visit, i) => (
                  <div key={i} className="flex items-center justify-between bg-primary-50 px-3 py-2 rounded-lg text-sm">
                    <div>
                      {visit.date && <span className="text-gray-500 text-xs">{visit.date}</span>}
                      <span className={`text-gray-800 font-medium ${visit.date ? 'ml-2' : ''}`}>{visit.destination}</span>
                    </div>
                    <button onClick={() => removeVisit(i)} className="text-red-400 hover:text-red-600 ml-2">&#x2715;</button>
                  </div>
                ))}
                {record.visits.length === 0 && (
                  <p className="text-gray-400 text-xs text-center py-2">訪問記録がありません</p>
                )}
              </div>
            </div>

            {/* メモ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
              <textarea
                value={record.notes}
                onChange={e => setRecord(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
                rows={3}
                placeholder="旅行の感想、おすすめスポットなど..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg font-medium transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white py-2 rounded-lg font-medium transition-colors"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
