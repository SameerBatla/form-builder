/** "1 field", "3 fields" */
export function pluralize(
  count: number,
  singular: string,
  plural = `${singular}s`,
): string {
  return `${count} ${count === 1 ? singular : plural}`
}

/** "512 B", "1.5 KB", "2.4 MB" */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }
  const kilobytes = bytes / 1024
  if (kilobytes < 1024) {
    return `${Number(kilobytes.toFixed(1))} KB`
  }
  return `${Number((kilobytes / 1024).toFixed(1))} MB`
}
