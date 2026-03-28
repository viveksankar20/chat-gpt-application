import React from 'react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Compare, MessageSquare } from 'lucide-react'

interface CompareToggleProps {
  isCompareMode: boolean
  onToggle: () => void
  disabled?: boolean
}

export function CompareToggle({ isCompareMode, onToggle, disabled }: CompareToggleProps) {
  return (
    <Button
      variant={isCompareMode ? 'default' : 'outline'}
      size="sm"
      onClick={onToggle}
      disabled={disabled}
      className="flex items-center gap-2"
    >
      {isCompareMode ? (
        <>
          <Compare className="w-4 h-4" />
          Compare Mode
          <Badge variant="secondary" className="ml-1 text-xs">
            3 Models
          </Badge>
        </>
      ) : (
        <>
          <MessageSquare className="w-4 h-4" />
          Chat Mode
        </>
      )}
    </Button>
  )
}
