import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PrefectureList from '../components/PrefectureList'
import PrefectureModal from '../components/PrefectureModal'
import { getAllTravelRecords, TravelRecord } from '../api'

export default function TravelPage() {
  const navigate = useNavigate()
  const [records, setRecords] = useState<Record<string, TravelRecord>>({})
  const [selectedPrefecture, setSelectedPrefecture] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllTravelRecords()
      .then(data => {
        const map: Record<string, TravelRecord> = {}
        data.forEach(r => { map[r.prefectureCode] = r })
        setRecords(map)
      })
      .finally(() => setLoading(false))
  }, [])

  function handleLogout() {
    sessionStorage.removeItem('token')
    navigate('/login')
  }

  function handleRecordSaved(record: TravelRecord) {
    setRecords(prev => ({ ...prev, [record.prefectureCode]: record }))
    setSelectedPrefecture(null)
  }

  const visitedCount = Object.values(records).filter(r => r.visits && r.visits.length > 0).length

  return (
    <div className="min-h-screen bg-primary-50">
      <header className="bg-primary-700 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🗾</span>
          <h1 className="text-lg font-bold">旅行メモ</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-primary-200">
            {visitedCount} / 47 都道府県
          </span>
          <button
            onClick={handleLogout}
            className="text-sm bg-primary-600 hover:bg-primary-500 px-3 py-1 rounded-lg transition-colors"
          >
            ログアウト
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <p className="text-center text-sm text-gray-500 mb-4">
            都道府県をクリックして旅行記録を追加・編集できます
          </p>
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-600 border-t-transparent"></div>
            </div>
          ) : (
            <PrefectureList
              visitedPrefectures={new Set(Object.values(records).filter(r => r.visits && r.visits.length > 0).map(r => r.prefectureCode))}
              onPrefectureClick={setSelectedPrefecture}
            />
          )}
        </div>

        <div className="mt-4 flex gap-4 justify-center text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-400 border border-gray-300"></div>
            <span>訪問済み</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-white border border-gray-300"></div>
            <span>未訪問</span>
          </div>
        </div>
      </main>

      {selectedPrefecture && (
        <PrefectureModal
          prefectureCode={selectedPrefecture}
          existingRecord={records[selectedPrefecture] || null}
          onSave={handleRecordSaved}
          onClose={() => setSelectedPrefecture(null)}
        />
      )}
    </div>
  )
}
