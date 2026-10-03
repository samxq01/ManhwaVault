export const getCoverColorClass = (title: string): string => {
  if (!title) return 'cover-slate'
  
  // Specific overrides to match the screenshots perfectly
  const t = title.toLowerCase()
  if (t.includes('nano machine')) return 'cover-violet'
  if (t.includes('lookism')) return 'cover-amber'
  if (t.includes('eleceed')) return 'cover-blue'
  if (t.includes('solo leveling')) return 'cover-red'
  if (t.includes('omniscient reader')) return 'cover-teal'
  if (t.includes('the boxer')) return 'cover-slate'
  
  const colors = ['cover-blue', 'cover-violet', 'cover-amber', 'cover-red', 'cover-teal', 'cover-slate']
  
  let hash = 0
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  return colors[Math.abs(hash) % colors.length]
}
