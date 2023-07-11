export const getQueryBooleanValue = (value: string): boolean => {
  if (value === 'true') return true
  if (value === 'false') return false
  return Boolean(value)
}
