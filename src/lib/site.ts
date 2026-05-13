export const SITE_TITLE = 'Cathedral, The Decentralized Super Computer'

export function pageTitle(...parts: string[]): string {
  return [...parts, SITE_TITLE].join(' · ')
}
