import { AlertTriangle, Trash2 } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to continue?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" title="">
      <div className="p-6 text-center">
        <div className={`mx-auto mb-4 w-14 h-14 rounded-full flex items-center justify-center ${
          variant === 'danger' 
            ? 'bg-red-100 dark:bg-red-900/30' 
            : 'bg-yellow-100 dark:bg-yellow-900/30'
        }`}>
          {variant === 'danger' ? (
            <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
          )}
        </div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button 
            variant={variant === 'danger' ? 'danger' : 'primary'} 
            onClick={onConfirm} 
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
