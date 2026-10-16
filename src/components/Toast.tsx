import { Check } from '@/components/icons/PaperIcons'

export function Toast({ message }: { message: string }) {
  return (
    <div className="toast">
      <Check size={14} /> {message}
    </div>
  )
}
