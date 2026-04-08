import React, { useState } from 'react'

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

// 各都道府県のSVGパスデータ (viewBox="0 0 800 900")
// 地理的位置を考慮した近似パスデータ
const PREFECTURE_PATHS: Record<string, string> = {
  // 北海道 - 大きく右上
  '01': 'M 480,20 L 540,15 L 600,25 L 650,40 L 680,60 L 700,90 L 710,120 L 700,150 L 680,165 L 660,170 L 640,160 L 620,145 L 600,140 L 580,150 L 560,155 L 540,150 L 520,140 L 500,130 L 485,115 L 470,100 L 460,80 L 455,60 L 460,40 Z',
  // 青森
  '02': 'M 540,180 L 570,170 L 600,175 L 620,185 L 625,200 L 615,215 L 595,220 L 570,215 L 550,205 L 535,195 Z',
  // 岩手
  '03': 'M 580,215 L 610,215 L 635,225 L 645,245 L 640,270 L 625,285 L 605,290 L 585,280 L 572,260 L 570,240 Z',
  // 宮城
  '04': 'M 555,270 L 580,265 L 600,275 L 610,290 L 605,310 L 585,320 L 560,315 L 545,300 L 545,282 Z',
  // 秋田
  '05': 'M 520,200 L 545,195 L 560,210 L 565,235 L 555,258 L 535,268 L 512,260 L 498,243 L 498,222 Z',
  // 山形
  '06': 'M 518,265 L 542,258 L 558,270 L 558,292 L 545,310 L 525,318 L 507,310 L 500,292 L 505,274 Z',
  // 福島
  '07': 'M 505,315 L 535,312 L 558,318 L 568,335 L 562,355 L 542,365 L 515,360 L 498,347 L 496,330 Z',
  // 茨城
  '08': 'M 570,340 L 595,338 L 612,350 L 615,370 L 605,385 L 585,390 L 565,380 L 558,362 Z',
  // 栃木
  '09': 'M 538,322 L 562,320 L 572,335 L 568,355 L 550,363 L 530,358 L 520,342 Z',
  // 群馬
  '10': 'M 508,318 L 530,316 L 542,330 L 538,350 L 520,358 L 500,350 L 492,335 Z',
  // 埼玉
  '11': 'M 522,358 L 544,355 L 557,367 L 553,383 L 535,390 L 516,385 L 508,371 Z',
  // 千葉
  '12': 'M 560,368 L 585,365 L 605,378 L 612,400 L 605,420 L 585,428 L 562,420 L 550,405 L 552,385 Z',
  // 東京
  '13': 'M 533,383 L 552,380 L 562,393 L 555,408 L 537,412 L 523,402 L 520,390 Z',
  // 神奈川
  '14': 'M 525,408 L 548,405 L 562,418 L 558,435 L 540,442 L 520,438 L 512,424 Z',
  // 新潟
  '15': 'M 440,270 L 470,258 L 495,260 L 508,275 L 510,300 L 502,320 L 482,328 L 460,322 L 442,308 L 432,288 Z',
  // 富山
  '16': 'M 422,320 L 445,315 L 460,325 L 462,342 L 450,355 L 430,358 L 415,345 L 412,330 Z',
  // 石川
  '17': 'M 395,300 L 418,295 L 430,308 L 432,328 L 420,342 L 400,345 L 382,332 L 380,315 Z',
  // 福井
  '18': 'M 390,348 L 412,343 L 422,355 L 420,372 L 405,380 L 385,375 L 375,360 Z',
  // 山梨
  '19': 'M 498,358 L 518,355 L 530,368 L 527,385 L 510,393 L 492,387 L 485,372 Z',
  // 長野
  '20': 'M 455,325 L 485,320 L 505,332 L 510,355 L 500,378 L 478,387 L 455,380 L 438,363 L 435,342 Z',
  // 岐阜
  '21': 'M 415,355 L 445,348 L 462,360 L 465,382 L 452,398 L 428,405 L 405,397 L 392,380 L 393,362 Z',
  // 静岡
  '22': 'M 478,390 L 505,385 L 525,398 L 528,418 L 515,432 L 492,438 L 468,430 L 455,415 L 458,398 Z',
  // 愛知
  '23': 'M 432,398 L 458,393 L 472,408 L 468,428 L 448,437 L 425,432 L 410,418 L 412,403 Z',
  // 三重
  '24': 'M 398,395 L 422,390 L 435,405 L 432,428 L 415,440 L 392,438 L 377,425 L 378,408 Z',
  // 滋賀
  '25': 'M 373,368 L 395,363 L 407,376 L 405,395 L 388,403 L 368,398 L 358,384 Z',
  // 京都
  '26': 'M 345,355 L 370,350 L 383,363 L 382,382 L 365,390 L 343,385 L 332,370 Z',
  // 大阪
  '27': 'M 348,388 L 368,385 L 378,397 L 373,413 L 355,418 L 338,412 L 332,398 Z',
  // 兵庫
  '28': 'M 310,360 L 340,352 L 358,363 L 360,382 L 345,394 L 320,397 L 300,385 L 292,370 Z',
  // 奈良
  '29': 'M 355,398 L 378,395 L 388,410 L 383,428 L 363,435 L 342,428 L 335,413 Z',
  // 和歌山
  '30': 'M 342,430 L 365,425 L 378,440 L 373,460 L 352,468 L 330,460 L 322,443 Z',
  // 鳥取
  '31': 'M 288,348 L 315,342 L 330,353 L 328,370 L 310,378 L 285,372 L 275,358 Z',
  // 島根
  '32': 'M 250,340 L 280,334 L 296,345 L 295,362 L 277,370 L 250,365 L 235,353 Z',
  // 岡山
  '33': 'M 285,368 L 312,363 L 325,376 L 322,394 L 303,402 L 278,397 L 267,383 Z',
  // 広島
  '34': 'M 248,362 L 275,357 L 290,370 L 287,389 L 268,398 L 242,393 L 228,378 Z',
  // 山口
  '35': 'M 208,368 L 238,362 L 252,375 L 248,395 L 228,403 L 200,397 L 187,382 Z',
  // 徳島
  '36': 'M 318,400 L 342,396 L 355,410 L 350,428 L 330,435 L 308,428 L 298,412 Z',
  // 香川
  '37': 'M 292,385 L 317,380 L 330,392 L 326,408 L 306,413 L 283,407 L 275,394 Z',
  // 愛媛
  '38': 'M 260,395 L 285,390 L 298,403 L 295,422 L 274,430 L 250,424 L 238,410 Z',
  // 高知
  '39': 'M 265,428 L 295,422 L 315,435 L 312,456 L 290,465 L 262,458 L 248,443 Z',
  // 福岡
  '40': 'M 175,378 L 205,372 L 220,383 L 217,402 L 196,410 L 170,405 L 158,390 Z',
  // 佐賀
  '41': 'M 150,393 L 173,388 L 185,400 L 182,417 L 162,424 L 140,418 L 130,404 Z',
  // 長崎
  '42': 'M 118,398 L 143,393 L 157,407 L 153,426 L 131,433 L 107,427 L 96,412 Z',
  // 熊本
  '43': 'M 158,408 L 185,403 L 200,417 L 197,438 L 175,447 L 148,441 L 135,426 Z',
  // 大分
  '44': 'M 198,388 L 225,382 L 240,395 L 237,415 L 216,423 L 190,418 L 178,403 Z',
  // 宮崎
  '45': 'M 200,420 L 225,415 L 240,430 L 237,453 L 215,462 L 188,455 L 175,440 Z',
  // 鹿児島
  '46': 'M 178,450 L 205,445 L 220,460 L 215,483 L 193,492 L 166,484 L 152,468 Z',
  // 沖縄 - 右下インセット表示
  '47': 'M 620,780 L 655,775 L 670,788 L 665,805 L 642,812 L 615,805 L 605,790 Z',
}

export default function JapanMap({ visitedPrefectures, onPrefectureClick }: Props) {
  const [tooltip, setTooltip] = useState<{ name: string; x: number; y: number } | null>(null)

  function getPathColor(code: string, isHovered: boolean): string {
    const visited = visitedPrefectures.has(code)
    if (visited) {
      return isHovered ? '#ea580c' : '#f97316'
    }
    return isHovered ? '#dcfce7' : '#ffffff'
  }

  function handleMouseEnter(e: React.MouseEvent<SVGPathElement>, code: string) {
    const rect = (e.currentTarget.closest('svg') as SVGSVGElement).getBoundingClientRect()
    const svgX = e.clientX - rect.left
    const svgY = e.clientY - rect.top
    setTooltip({ name: PREFECTURE_NAMES[code], x: svgX, y: svgY - 30 })
    e.currentTarget.setAttribute('data-hovered', 'true')
    e.currentTarget.setAttribute('fill', getPathColor(code, true))
  }

  function handleMouseLeave(e: React.MouseEvent<SVGPathElement>, code: string) {
    setTooltip(null)
    e.currentTarget.removeAttribute('data-hovered')
    e.currentTarget.setAttribute('fill', getPathColor(code, false))
  }

  function handleMouseMove(e: React.MouseEvent<SVGPathElement>) {
    if (tooltip) {
      const rect = (e.currentTarget.closest('svg') as SVGSVGElement).getBoundingClientRect()
      const svgX = e.clientX - rect.left
      const svgY = e.clientY - rect.top
      setTooltip(prev => prev ? { ...prev, x: svgX, y: svgY - 30 } : null)
    }
  }

  return (
    <div className="relative w-full">
      <svg
        viewBox="0 0 800 900"
        className="w-full h-auto max-h-[70vh]"
        style={{ touchAction: 'manipulation' }}
      >
        {/* 背景 */}
        <rect width="800" height="900" fill="#e0f2fe" rx="8" />

        {/* 沖縄インセット枠 */}
        <rect x="598" y="768" width="85" height="52" fill="#dbeafe" stroke="#93c5fd" strokeWidth="1" rx="4" />
        <text x="640" y="762" textAnchor="middle" fontSize="8" fill="#6b7280">沖縄</text>

        {/* 都道府県パス */}
        {Object.entries(PREFECTURE_PATHS).map(([code, pathData]) => (
          <path
            key={code}
            d={pathData}
            fill={getPathColor(code, false)}
            stroke="#9ca3af"
            strokeWidth="0.8"
            className="cursor-pointer transition-colors duration-150"
            onClick={() => onPrefectureClick(code)}
            onMouseEnter={e => handleMouseEnter(e, code)}
            onMouseLeave={e => handleMouseLeave(e, code)}
            onMouseMove={handleMouseMove}
          >
            <title>{PREFECTURE_NAMES[code]}</title>
          </path>
        ))}

        {/* 都道府県名ラベル（主要な都道府県） */}
        <text x="580" y="100" textAnchor="middle" fontSize="9" fill="#374151" pointerEvents="none">北海道</text>
        <text x="590" y="200" textAnchor="middle" fontSize="7" fill="#374151" pointerEvents="none">青森</text>
        <text x="610" y="258" textAnchor="middle" fontSize="7" fill="#374151" pointerEvents="none">岩手</text>
        <text x="578" y="297" textAnchor="middle" fontSize="7" fill="#374151" pointerEvents="none">宮城</text>
        <text x="528" y="235" textAnchor="middle" fontSize="7" fill="#374151" pointerEvents="none">秋田</text>
        <text x="530" y="292" textAnchor="middle" fontSize="7" fill="#374151" pointerEvents="none">山形</text>
        <text x="530" y="340" textAnchor="middle" fontSize="7" fill="#374151" pointerEvents="none">福島</text>
        <text x="585" y="365" textAnchor="middle" fontSize="7" fill="#374151" pointerEvents="none">茨城</text>
        <text x="547" y="343" textAnchor="middle" fontSize="7" fill="#374151" pointerEvents="none">栃木</text>
        <text x="517" y="338" textAnchor="middle" fontSize="7" fill="#374151" pointerEvents="none">群馬</text>
        <text x="535" y="375" textAnchor="middle" fontSize="7" fill="#374151" pointerEvents="none">埼玉</text>
        <text x="582" y="397" textAnchor="middle" fontSize="7" fill="#374151" pointerEvents="none">千葉</text>
        <text x="540" y="398" textAnchor="middle" fontSize="7" fill="#374151" pointerEvents="none">東京</text>
        <text x="537" y="425" textAnchor="middle" fontSize="7" fill="#374151" pointerEvents="none">神奈川</text>
        <text x="472" y="295" textAnchor="middle" fontSize="7" fill="#374151" pointerEvents="none">新潟</text>
        <text x="438" y="338" textAnchor="middle" fontSize="7" fill="#374151" pointerEvents="none">富山</text>
        <text x="407" y="322" textAnchor="middle" fontSize="7" fill="#374151" pointerEvents="none">石川</text>
        <text x="400" y="363" textAnchor="middle" fontSize="7" fill="#374151" pointerEvents="none">福井</text>
        <text x="508" y="375" textAnchor="middle" fontSize="7" fill="#374151" pointerEvents="none">山梨</text>
        <text x="473" y="355" textAnchor="middle" fontSize="7" fill="#374151" pointerEvents="none">長野</text>
        <text x="430" y="378" textAnchor="middle" fontSize="7" fill="#374151" pointerEvents="none">岐阜</text>
        <text x="492" y="415" textAnchor="middle" fontSize="7" fill="#374151" pointerEvents="none">静岡</text>
        <text x="448" y="418" textAnchor="middle" fontSize="7" fill="#374151" pointerEvents="none">愛知</text>
        <text x="408" y="418" textAnchor="middle" fontSize="7" fill="#374151" pointerEvents="none">三重</text>
        <text x="383" y="385" textAnchor="middle" fontSize="7" fill="#374151" pointerEvents="none">滋賀</text>
        <text x="358" y="370" textAnchor="middle" fontSize="7" fill="#374151" pointerEvents="none">京都</text>
        <text x="357" y="402" textAnchor="middle" fontSize="7" fill="#374151" pointerEvents="none">大阪</text>
        <text x="328" y="376" textAnchor="middle" fontSize="7" fill="#374151" pointerEvents="none">兵庫</text>
        <text x="363" y="418" textAnchor="middle" fontSize="7" fill="#374151" pointerEvents="none">奈良</text>
        <text x="352" y="447" textAnchor="middle" fontSize="7" fill="#374151" pointerEvents="none">和歌山</text>
        <text x="303" y="362" textAnchor="middle" fontSize="7" fill="#374151" pointerEvents="none">鳥取</text>
        <text x="266" y="352" textAnchor="middle" fontSize="7" fill="#374151" pointerEvents="none">島根</text>
        <text x="298" y="383" textAnchor="middle" fontSize="7" fill="#374151" pointerEvents="none">岡山</text>
        <text x="262" y="378" textAnchor="middle" fontSize="7" fill="#374151" pointerEvents="none">広島</text>
        <text x="222" y="383" textAnchor="middle" fontSize="7" fill="#374151" pointerEvents="none">山口</text>
        <text x="328" y="418" textAnchor="middle" fontSize="7" fill="#374151" pointerEvents="none">徳島</text>
        <text x="303" y="398" textAnchor="middle" fontSize="7" fill="#374151" pointerEvents="none">香川</text>
        <text x="270" y="413" textAnchor="middle" fontSize="7" fill="#374151" pointerEvents="none">愛媛</text>
        <text x="282" y="445" textAnchor="middle" fontSize="7" fill="#374151" pointerEvents="none">高知</text>
        <text x="190" y="393" textAnchor="middle" fontSize="7" fill="#374151" pointerEvents="none">福岡</text>
        <text x="160" y="408" textAnchor="middle" fontSize="7" fill="#374151" pointerEvents="none">佐賀</text>
        <text x="132" y="413" textAnchor="middle" fontSize="7" fill="#374151" pointerEvents="none">長崎</text>
        <text x="170" y="428" textAnchor="middle" fontSize="7" fill="#374151" pointerEvents="none">熊本</text>
        <text x="215" y="403" textAnchor="middle" fontSize="7" fill="#374151" pointerEvents="none">大分</text>
        <text x="210" y="440" textAnchor="middle" fontSize="7" fill="#374151" pointerEvents="none">宮崎</text>
        <text x="188" y="470" textAnchor="middle" fontSize="7" fill="#374151" pointerEvents="none">鹿児島</text>
        <text x="638" y="798" textAnchor="middle" fontSize="7" fill="#374151" pointerEvents="none">沖縄</text>

        {/* ツールチップ */}
        {tooltip && (
          <g>
            <rect
              x={tooltip.x - 30}
              y={tooltip.y - 14}
              width="60"
              height="18"
              fill="rgba(0,0,0,0.75)"
              rx="4"
            />
            <text
              x={tooltip.x}
              y={tooltip.y}
              textAnchor="middle"
              fontSize="10"
              fill="white"
              pointerEvents="none"
            >
              {tooltip.name}
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}
