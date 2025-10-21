import React, { useState, useMemo } from 'react'
import { Search } from './icons/Search'

export default function DataTable({ columns, data }) {
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const out = q
      ? data.filter(row => Object.values(row).some(v => String(v).toLowerCase().includes(q)))
      : data.slice()

    if (sortBy) {
      out.sort((a, b) => {
        const av = a[sortBy], bv = b[sortBy]
        if (av === bv) return 0
        return av > bv ? (sortDir === 'asc' ? 1 : -1) : (sortDir === 'asc' ? -1 : 1)
      })
    }
    return out
  }, [data, query, sortBy, sortDir])

  const toggleSort = (key) => {
    if (sortBy !== key) {
      setSortBy(key); setSortDir('asc')
    } else {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    }
  }

  return (
    <div className="table-card">
      

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key} onClick={() => toggleSort(col.key)}>
                  <div className="th-content">
                    {col.label}
                    <span className="sort-indicator">
                      {sortBy === col.key ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={columns.length} className="empty-state">Nenhum registro encontrado</td></tr>
            ) : (
              filtered.map((row, idx) => (
                <tr key={idx}>
                  {columns.map(col => (
                    <td key={col.key}>{col.render ? col.render(row[col.key], row) : String(row[col.key])}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
