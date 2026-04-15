import React, { useEffect, useRef, useState } from 'react'

export default function Carousel({ interval = 3000 }) {
  const images = [
    // Adicionar imagens
  ]

  const [index, setIndex] = useState(0)
  const timer = useRef(null)

  useEffect(() => {
    timer.current = setInterval(() => {
      setIndex(i => (i + 1) % images.length)
    }, interval)
    return () => clearInterval(timer.current)
  }, [images.length, interval])

  if (!images.length) return null

  return (
    <div className="carousel">
      {images.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={`slide-${i}`}
          className={'slide' + (i === index ? ' active' : '')}
          draggable={false}
        />
      ))}
      <div className="carousel-dots">
        {images.map((_, i) => (
          <button
            key={i}
            aria-label={`Ir para slide ${i + 1}`}
            className={'dot' + (i === index ? ' active' : '')}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </div>
  )
}
