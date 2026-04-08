interface Props {
  visitedPrefectures: Set<string>
  onPrefectureClick: (code: string) => void
}

export const PREFECTURE_NAMES: Record<string, string> = {
  '01': '北海道',
  '02': '青森',
  '03': '岩手',
  '04': '宮城',
  '05': '秋田',
  '06': '山形',
  '07': '福島',
  '08': '茨城',
  '09': '栃木',
  '10': '群馬',
  '11': '埼玉',
  '12': '千葉',
  '13': '東京',
  '14': '神奈川',
  '15': '新潟',
  '16': '富山',
  '17': '石川',
  '18': '福井',
  '19': '山梨',
  '20': '長野',
  '21': '岐阜',
  '22': '静岡',
  '23': '愛知',
  '24': '三重',
  '25': '滋賀',
  '26': '京都',
  '27': '大阪',
  '28': '兵庫',
  '29': '奈良',
  '30': '和歌山',
  '31': '鳥取',
  '32': '島根',
  '33': '岡山',
  '34': '広島',
  '35': '山口',
  '36': '徳島',
  '37': '香川',
  '38': '愛媛',
  '39': '高知',
  '40': '福岡',
  '41': '佐賀',
  '42': '長崎',
  '43': '熊本',
  '44': '大分',
  '45': '宮崎',
  '46': '鹿児島',
  '47': '沖縄',
}

const PREFECTURE_REGIONS: { region: string; codes: string[] }[] = [
  { region: '北海道・東北', codes: ['01', '02', '03', '04', '05', '06', '07'] },
  { region: '関東', codes: ['08', '09', '10', '11', '12', '13', '14'] },
  { region: '中部', codes: ['15', '16', '17', '18', '19', '20', '21', '22', '23'] },
  { region: '近畿', codes: ['24', '25', '26', '27', '28', '29', '30'] },
  { region: '中国', codes: ['31', '32', '33', '34', '35'] },
  { region: '四国', codes: ['36', '37', '38', '39'] },
  { region: '九州・沖縄', codes: ['40', '41', '42', '43', '44', '45', '46', '47'] },
]

export default function PrefectureList({ visitedPrefectures, onPrefectureClick }: Props) {
  return (
    <div className="space-y-6">
      {PREFECTURE_REGIONS.map(({ region, codes }) => (
        <div key={region}>
          <h3 className="text-sm font-semibold text-primary-700 mb-2 border-b border-primary-100 pb-1">
            {region}
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {codes.map(code => {
              const visited = visitedPrefectures.has(code)
              return (
                <button
                  key={code}
                  onClick={() => onPrefectureClick(code)}
                  className={`
                    py-2 px-3 rounded-lg text-sm font-medium text-left transition-all
                    border shadow-sm hover:shadow-md active:scale-95
                    ${visited
                      ? 'bg-orange-400 border-orange-500 text-white hover:bg-orange-500'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-primary-50 hover:border-primary-300'
                    }
                  `}
                >
                  {PREFECTURE_NAMES[code]}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
