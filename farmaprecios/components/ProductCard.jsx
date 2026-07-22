'use client'

import Image from 'next/image'
import { useState } from 'react'

const STORE = {
  farmatodo: { label: 'FTD', dotColor: 'bg-locatel-blue',    textColor: 'text-locatel-blue',    priceColor: 'text-locatel-blue'    },
  locatel:   { label: 'LCT', dotColor: 'bg-farmatodo-green', textColor: 'text-farmatodo-green', priceColor: 'text-farmatodo-green' },
}

export default function ProductCard({ product, bcvRate }) {
  const { name, brand, imageUrl, priceBs, fullPriceBs, discountLabel, requiresPrescription, store } = product
  const [imgError, setImgError] = useState(!imageUrl)

  const isDiscounted = priceBs > 0 && fullPriceBs > 0 && priceBs < fullPriceBs
  const usdFinal = bcvRate && priceBs ? priceBs / bcvRate : null
  const usdFull  = bcvRate && fullPriceBs && isDiscounted ? fullPriceBs / bcvRate : null

  const formatBs  = n => n?.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const formatUsd = n => n?.toFixed(2)

  const s = STORE[store]

  return (
    <div className="bg-white rounded-2xl shadow-sm flex flex-col overflow-hidden border border-gray-100">
      {/* Image */}
      <div className="relative bg-gray-50 aspect-square">
        <Image
          src={imgError ? 'https://placehold.co/200x200?text=Sin+imagen' : imageUrl}
          alt={name}
          fill
          className="object-contain p-3"
          onError={() => setImgError(true)}
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
        />
        {discountLabel && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow z-10">
            -{discountLabel}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col flex-1 gap-1">
        {s && (
          <div className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dotColor}`} />
            <span className={`text-xs font-semibold uppercase tracking-wide ${s.textColor}`}>{s.label}</span>
          </div>
        )}

        {brand && (
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide truncate">{brand}</p>
        )}
        <p className="text-xs text-gray-700 line-clamp-3 leading-snug flex-1">{name}</p>

        {/* Prices */}
        <div className="mt-2">
          {isDiscounted && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="line-through">Bs {formatBs(fullPriceBs)}</span>
              {usdFull && <span className="line-through">${formatUsd(usdFull)}</span>}
            </div>
          )}
          <p className={`font-bold text-base leading-tight ${isDiscounted ? 'text-red-600' : 'text-gray-800'}`}>
            Bs {formatBs(priceBs)}
          </p>
          {usdFinal && (
            <p className={`font-bold text-sm ${s?.priceColor ?? 'text-gray-600'}`}>
              ${formatUsd(usdFinal)}
            </p>
          )}
        </div>

        {requiresPrescription && (
          <span className="self-start text-xs bg-orange-50 text-orange-500 border border-orange-200 px-2 py-0.5 rounded-full mt-1">
            Requiere receta
          </span>
        )}
      </div>
    </div>
  )
}
