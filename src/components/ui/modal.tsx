import * as React from "react"
import { X, MoreVertical } from "lucide-react"
import { cn } from "@/lib/utils"

interface ModalAction {
  label: string
  onClick: () => void
  icon?: React.ReactNode
  variant?: 'default' | 'danger'
  disabled?: boolean
  separator?: boolean // Tilføjer separator efter denne action
}

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string | React.ReactNode
  children: React.ReactNode
  className?: string
  actions?: ModalAction[]
  footerActions?: React.ReactNode // New prop for fixed footer actions
  showCreatedDate?: boolean // New prop to show created date under title
  createdDate?: string // The creation date to display
}

export function Modal({ isOpen, onClose, title, children, className, actions, footerActions, showCreatedDate, createdDate }: ModalProps) {
  const [showActionsMenu, setShowActionsMenu] = React.useState(false)
  const [mouseDownOutside, setMouseDownOutside] = React.useState(false)
  
  // Handle escape key and click outside for actions menu
  React.useEffect(() => {
    const handleClickOutside = () => {
      setShowActionsMenu(false)
    }

    if (showActionsMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showActionsMenu])

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/10 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          setMouseDownOutside(true)
        }
      }}
      onMouseUp={(e) => {
        if (e.target === e.currentTarget && mouseDownOutside) {
          onClose()
        }
        setMouseDownOutside(false)
      }}
      onMouseLeave={() => {
        setMouseDownOutside(false)
      }}
      onClick={(e) => {
        // Prevent the old onClick behavior
        e.preventDefault()
      }}
    >
      <div 
        className={cn(
          "bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex-1 mr-4">
            {typeof title === 'string' ? (
              <h3 className="text-xl font-bold text-gray-900">
                {title}
              </h3>
            ) : (
              <div className="text-xl font-bold text-gray-900">
                {title}
              </div>
            )}
            {/* Created date under title */}
            {showCreatedDate && createdDate && (
              <p className="text-sm text-gray-500 mt-1">
                Oprettet: {createdDate}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Actions menu */}
            {actions && actions.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowActionsMenu(!showActionsMenu)}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <MoreVertical className="h-5 w-5 text-gray-600" />
                </button>
                
                {showActionsMenu && (
                  <div className="absolute right-0 top-10 z-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[180px]">
                    {actions.map((action, index) => (
                      <React.Fragment key={index}>
                        <button
                          onClick={() => {
                            action.onClick();
                            setShowActionsMenu(false);
                          }}
                          disabled={action.disabled}
                          className={cn(
                            "w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors",
                            action.variant === 'danger' && "text-red-600 hover:bg-red-50",
                            action.disabled && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          {action.icon}
                          {action.label}
                        </button>
                        {action.separator && (
                          <hr className="my-1 border-gray-100" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
        
        {/* Modal Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>

        {/* Fixed Footer */}
        {footerActions && (
          <div className="flex-shrink-0 border-t border-gray-200 p-4 bg-gray-50 h-16 sm:h-20 flex items-center justify-center">
            {footerActions}
          </div>
        )}
      </div>
    </div>
  )
}
