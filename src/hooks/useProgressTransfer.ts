import { useCallback } from 'react'
import { exportProgress, getStorageStatus, importProgress, MAX_IMPORT_LENGTH } from '../utils/storage'
import type { Translator } from '../utils/i18n'
import { createTranslator } from '../utils/i18n'

export const useProgressTransfer = (setDataMessage: (message: string | null) => void, translate: Translator = createTranslator('en')) => {
  const handleExportProgress = useCallback(() => {
    const serialized = exportProgress()
    if (!serialized || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
      setDataMessage(getStorageStatus() === 'unavailable'
        ? translate('exportUnavailable')
        : translate('exportFailed'))
      return
    }
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([serialized], { type: 'application/json' }))
    link.download = `number-rush-progress-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(link.href)
    setDataMessage(translate('exportSuccess'))
  }, [setDataMessage, translate])

  const handleImportProgress = useCallback((file: File) => {
    if (file.size > MAX_IMPORT_LENGTH) {
      setDataMessage(translate('importTooLarge'))
      return
    }
    void file.text().then(serialized => {
      const result = importProgress(serialized)
      if (!result.ok) {
          setDataMessage(result.reason === 'unsupported'
            ? translate('importUnsupported')
          : result.reason === 'too-large'
            ? translate('importTooLarge')
            : translate('importFailed'))
        return
      }
      window.location.reload()
    }).catch(() => setDataMessage(translate('importFailed')))
  }, [setDataMessage, translate])

  return { handleExportProgress, handleImportProgress }
}
