import toast from 'react-hot-toast'

export const showSuccess = (message: string) =>
  toast.success(message, {
    duration: 3000,
    style: { background: '#0F172A', color: '#fff', borderRadius: '8px', fontSize: '14px' },
    iconTheme: { primary: '#10B981', secondary: '#fff' },
  })

export const showError = (message: string) =>
  toast.error(message, {
    duration: 4000,
    style: { background: '#0F172A', color: '#fff', borderRadius: '8px', fontSize: '14px' },
    iconTheme: { primary: '#EF4444', secondary: '#fff' },
  })

export const showLoading = (message: string) =>
  toast.loading(message, {
    style: { background: '#0F172A', color: '#fff', borderRadius: '8px', fontSize: '14px' },
  })

export const dismissToast = (id: string) => toast.dismiss(id)

export const getApiErrorMessage = (error: any): string => {
  const detail = error?.response?.data?.detail
  if (!detail) return error?.message || 'An unexpected error occurred'
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) return detail.map((e: any) => e.msg).join(', ')
  return 'An unexpected error occurred'
}
