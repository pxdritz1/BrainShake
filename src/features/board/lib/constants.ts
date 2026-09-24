import {
  ArrowRight,
  Circle,
  Diamond,
  Hexagon,
  Minus,
  Pentagon,
  Square,
  Star,
  Triangle
} from 'lucide-react'
import type { CanvasItem } from '../types'

export const seedObjects: CanvasItem[] = [
  {
    id: 'welcome',
    type: 'sticky',
    x: 190,
    y: 145,
    w: 250,
    h: 190,
    color: 'yellow',
    title: 'Start here',
    text: 'Write an idea, drop in a file, or use the toolbar to shape your thinking.'
  },
  {
    id: 'prompt',
    type: 'text',
    x: 535,
    y: 175,
    w: 280,
    h: 150,
    text: 'What are we trying to discover?\n\nStart with an open question and let the connections appear.'
  }
]

export const STICKY_COLORS = {
  yellow: '#fff0ad',
  pink: '#ffd9d1',
  blue: '#cfe9eb',
  green: '#d8ebc9',
  white: '#ffffff'
}

export const ACCENTS = [
  '#a8c9f0',
  '#a9ddb2',
  '#d4b0e8',
  '#f5c58a',
  '#f2aebc',
  '#f2a9a2',
  '#9adbd4',
  '#b7b6ee',
  '#a9dff0',
  '#f3df8d'
]

export const THEMES = [
  { id: 'light', label: 'Light' },
  { id: 'warm', label: 'Warm' },
  { id: 'mint', label: 'Mint' },
  { id: 'dark', label: 'Dark' },
  { id: 'oled', label: 'OLED' },
  { id: 'catppuccin', label: 'Lavender' },
  { id: 'gruvbox', label: 'Harvest' },
  { id: 'dracula', label: 'Night Orchid' },
  { id: 'nord', label: 'Arctic' }
]

export const SHAPES = [
  { id: 'square', label: 'Square', icon: Square },
  { id: 'circle', label: 'Circle', icon: Circle },
  { id: 'triangle', label: 'Triangle', icon: Triangle },
  { id: 'hexagon', label: 'Hexagon', icon: Hexagon },
  { id: 'diamond', label: 'Diamond', icon: Diamond },
  { id: 'pentagon', label: 'Pentagon', icon: Pentagon },
  { id: 'star', label: 'Star', icon: Star },
  { id: 'line', label: 'Straight line', icon: Minus },
  { id: 'arrow', label: 'Arrow', icon: ArrowRight }
]

export const STROKE_WIDTHS = [
  { value: 2, label: 'Fine' },
  { value: 4, label: 'Regular' },
  { value: 7, label: 'Bold' },
  { value: 11, label: 'Heavy' }
]

export const TOOL_SHORTCUTS = {
  v: 'select',
  h: 'hand',
  t: 'text',
  n: 'sticky',
  p: 'pen',
  e: 'eraser',
  l: 'connector'
}
