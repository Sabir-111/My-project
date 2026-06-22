export const parsePrice = (value) => {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const normalized = String(value).replace(',', '.').replace(/[^\d.]/g, '')
  const parsed = Number(normalized)

  return Number.isFinite(parsed) ? parsed : null
}

export const formatPrice = (value) => {
  const parsed = parsePrice(value)

  if (parsed === null) {
    return value ? `${value} ₼` : 'Qiymət qeyd olunmayıb'
  }

  return `${parsed.toLocaleString('az-AZ')} ₼`
}

export const formatDateTime = (value) => {
  if (!value) return ''

  return new Date(value).toLocaleString('az-AZ', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export const formatTime = (value) => {
  if (!value) return ''

  return new Date(value).toLocaleTimeString('az-AZ', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
