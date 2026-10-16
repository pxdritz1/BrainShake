import { CoffeeIcon } from '@/components/icons/CoffeeIcon'
import { GithubIcon } from '@/components/icons/GithubIcon'

export function SidebarFooter() {
  return (
    <div className="sidebar-links">
      <a
        className="sidebar-link"
        href="https://github.com/pxdritz1/BrainShake"
        target="_blank"
        rel="noreferrer"
        title="Open GitHub repository"
      >
        <GithubIcon size={16} />
        <span>Source</span>
      </a>
      <a
        className="sidebar-link"
        href="https://ko-fi.com/pxdritz1"
        target="_blank"
        rel="noreferrer"
        title="Support on Ko-fi"
      >
        <CoffeeIcon size={16} />
        <span>Ko-fi</span>
      </a>
    </div>
  )
}
