'use client'

import Image from 'next/image'
import { useState } from 'react'

const STORE = {
  farmatodo: { label: 'Farmatodo', color: 'text-farmatodo-green', dot: 'bg-farmatodo-green' },
  locatel:   { label: 'Locatel',   color: 'text-locatel-blue',    dot: 'bg-locatel-blue'    },
}

function PriceRow({ product, bcvRate, isCheapest, isOnlyStore }) {
  const { priceBs, fullPriceBs, discountLabel, store } = product
  const s = STORE[store]
  const isDiscounted = priceBs > 0 && fullPriceBs > 0 && priceBs < fullPriceBs
  const usdFinal = bcvRate && priceBs ? priceBs / bcvRate : null
  const usdFull  = bcvRate && fullPriceBs && isDiscounted ? fullPriceBs / bcvRate : null

  const fmtBs  = n => n?.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const fmtUsd = n => n?.toFixed(2)

  return (
    <div className={`flex items-center justify-between px-3 py-2.5 ${isCheapest ? 'bg-green-50' : ''}`}>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
        <span className={`text-xs font-semibold ${s.color}`}>{s.label}</span>
        {isCheapest && (
          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
            Mejor precio
          </span>
        )}
        {isOnlyStore && (
          <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
            Solo aquí
          </span>
        )}
        {discountLabel && (
          <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
            -{discountLabel}
          </span>
        )}
      </div>

      <div className="text-right shrink-0 ml-2">
        {isDiscounted && (
          <p className="text-xs text-gray-400 line-through">
            Bs {fmtBs(fullPriceBs)}
            {usdFull && <span className="ml-1">${fmtUsd(usdFull)}</span>}
          </p>
        )}
        <p className={`text-sm font-bold leading-tight ${isCheapest ? 'text-green-700' : isDiscounted ? 'text-red-600' : 'text-gray-800'}`}>
          Bs {fmtBs(priceBs)}
        </p>
        {usdFinal && (
          <p className={`text-xs font-semibold ${s.color}`}>${fmtUsd(usdFinal)}</p>
        )}
      </div>
    </div>
  )
}

export default function ComparisonCard({ group, bcvRate }) {
  const { ft, lt } = group
  const primary = ft || lt
  const hasBoth = !!(ft && lt)
  const [imgError, setImgError] = useState(false)

  const isFtCheaper = hasBoth && ft.priceBs <= lt.priceBs
  const isLtCheaper = hasBoth && lt.priceBs < ft.priceBs

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Product info */}
      <div className="flex gap-3 p-3">
        <div className="relative w-16 h-16 bg-gray-50 rounded-xl shrink-0">
          <Image
            src={imgError ? 'https://placehold.co/64x64?text=?' : primary.imageUrl}
            alt={primary.name}
            fill
            className="object-contain p-1 rounded-xl"
            onError={() => setImgError(true)}
            sizes="64px"
          />
        </div>
        <div className="min-w-0 flex flex-col justify-center">
          {primary.brand && (
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide truncate">
              {primary.brand}
            </p>
          )}
          <p className="text-sm text-gray-700 line-clamp-2 leading-snug">{primary.name}</p>
        </div>
      </div>

      {/* Price rows */}
      <div className="border-t border-gray-100 divide-y divide-gray-50">
        {ft && (
          <PriceRow
            product={ft}
            bcvRate={bcvRate}
            isCheapest={hasBoth && isFtCheaper}
            isOnlyStore={!hasBoth}
          />
        )}
        {lt && (
          <PriceRow
            product={lt}
            bcvRate={bcvRate}
            isCheapest={hasBoth && isLtCheaper}
            isOnlyStore={!hasBoth}
          />
        )}
      </div>
    </div>
  )
}
