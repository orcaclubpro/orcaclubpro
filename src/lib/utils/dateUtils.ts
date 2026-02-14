export const formatDate = (date: string | Date | null | undefined) => {
  if (!date) return 'Not set'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

export const formatDateTime = (date: string | Date | null | undefined) => {
  if (!date) return 'Not set'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date))
}

export const isOverdue = (dueDate: string | Date | null | undefined) => {
  if (!dueDate) return false
  return new Date(dueDate) < new Date()
}

export const getDaysUntil = (date: string | Date | null | undefined) => {
  if (!date) return null
  const target = new Date(date).getTime()
  const now = Date.now()
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24))
}

export const formatCurrency = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}
