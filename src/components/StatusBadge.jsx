import React from 'react'
import { FileCheck } from './icons/FileCheck'
import { AlertCircle } from './icons/AlertCircle'
import { Loader } from './icons/Loader'

export default function StatusBadge({ status }) {
  const config = {
    sucesso: { label: 'Sucesso', icon: FileCheck, className: 'success' },
    erro: { label: 'Erro', icon: AlertCircle, className: 'error' },
    processando: { label: 'Processando', icon: Loader, className: 'processing' }
  }

  const { label, icon: Icon, className } = config[status] || config.sucesso

  return (
    <div className={`status-badge ${className}`}>
      <Icon size={16} />
      <span>{label}</span>
    </div>
  )
}
