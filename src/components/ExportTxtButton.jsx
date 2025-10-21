import React from 'react'
import { Download } from './icons/Download'

export default function ExportTxtButton({ filename = 'export.txt', rows }) {
  const handleExport = () => {
    const lines = rows.map(r => Object.values(r).join(';'))
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button className="btn-export" onClick={handleExport}>
      <Download size={18} />
      <span>Exportar TXT</span>
    </button>
  )
}
