import { useCallback } from 'react'
import { exportProgress, getStorageStatus, importProgress, MAX_IMPORT_LENGTH } from '../utils/storage'

export const useProgressTransfer = (setDataMessage: (message: string | null) => void) => {
  const handleExportProgress = useCallback(() => {
    const serialized = exportProgress()
    if (!serialized || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
      setDataMessage(getStorageStatus() === 'unavailable'
        ? 'Progress could not be exported because storage is unavailable on this device.'
        : 'Progress could not be exported on this device.')
      return
    }
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([serialized], { type: 'application/json' }))
    link.download = `number-rush-progress-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(link.href)
    setDataMessage('Progress exported successfully.')
  }, [setDataMessage])

  const handleImportProgress = useCallback((file: File) => {
    if (file.size > MAX_IMPORT_LENGTH) {
      setDataMessage('Progress file is too large to import.')
      return
    }
    void file.text().then(serialized => {
      const result = importProgress(serialized)
      if (!result.ok) {
        setDataMessage(result.reason === 'unsupported'
          ? 'This progress file is from an unsupported version.'
          : result.reason === 'too-large'
            ? 'Progress file is too large to import.'
            : 'Progress file could not be imported.')
        return
      }
      window.location.reload()
    }).catch(() => setDataMessage('Progress file could not be imported.'))
  }, [setDataMessage])

  return { handleExportProgress, handleImportProgress }
}
