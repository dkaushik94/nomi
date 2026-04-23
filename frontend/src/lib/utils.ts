import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function fmt(n: number) {
  return '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

export function avatarHue(name: string): number {
  let h = 0
  for (const c of name) h = (h * 37 + c.charCodeAt(0)) % 360
  return h
}

export function relDate(d: string): string {
  const diff = Math.round((Date.now() - new Date(d).getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function groupByDate<T extends { transaction_date: string }>(arr: T[]): [string, T[]][] {
  const g: Record<string, T[]> = {}
  arr.forEach((t) => {
    const d = t.transaction_date
    if (!g[d]) g[d] = []
    g[d].push(t)
  })
  return Object.entries(g).sort((a, b) => b[0].localeCompare(a[0]))
}
