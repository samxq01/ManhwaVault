import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { backupService, type BackupData } from "@/services/backupService"
import { Download, Upload, FileJson, FileSpreadsheet, AlertTriangle, CheckCircle, Clock, Smartphone } from "lucide-react"
import { useInstallPrompt } from "@/hooks/useInstallPrompt"

export function Settings() {
  const { user } = useAuth()
  const [lastBackup, setLastBackup] = useState<string | null>(null)
  const { installPrompt, promptInstall, isStandalone } = useInstallPrompt()
  
  const [isExporting, setIsExporting] = useState(false)
  const [isExportingCsv, setIsExportingCsv] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewData, setPreviewData] = useState<BackupData | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('merge')
  const [isImporting, setIsImporting] = useState(false)
  const [importSuccess, setImportSuccess] = useState(false)

  useEffect(() => {
    if (user) {
      backupService.getLastBackupDate(user.id).then(date => {
        if (date) setLastBackup(date)
      })
    }
  }, [user])

  const handleExportJson = async () => {
    if (!user) return
    setIsExporting(true)
    try {
      const data = await backupService.exportData(user.id)
      const jsonStr = JSON.stringify(data, null, 2)
      
      const blob = new Blob([jsonStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      const dateStr = new Date().toISOString().split('T')[0]
      a.download = `manhwavault-backup-${dateStr}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      const now = new Date().toISOString()
      await backupService.updateLastBackupDate(user.id, now)
      setLastBackup(now)
    } catch (err) {
      console.error("Export failed", err)
      alert("Failed to export backup. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportCsv = async () => {
    if (!user) return
    setIsExportingCsv(true)
    try {
      const csvStr = await backupService.exportCsv(user.id)
      if (!csvStr) {
        alert("No library data to export.")
        return
      }
      
      const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      const dateStr = new Date().toISOString().split('T')[0]
      a.download = `manhwavault-library-${dateStr}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("CSV Export failed", err)
      alert("Failed to export CSV. Please try again.")
    } finally {
      setIsExportingCsv(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setPreviewData(null)
    setPreviewError(null)
    setImportSuccess(false)

    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        const parsed = JSON.parse(content) as BackupData
        
        if (!parsed.manhwa || !parsed.reading_history) {
          setPreviewError("Invalid backup format. Missing required data.")
          return
        }
        
        setPreviewData(parsed)
      } catch (err) {
        setPreviewError("Failed to parse JSON file. Ensure it is a valid backup.")
      }
    }
    reader.onerror = () => {
      setPreviewError("Failed to read file.")
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!user || !previewData) return
    
    if (importMode === 'replace') {
      const confirmed = window.confirm(
        "WARNING: This will delete ALL your existing data and replace it with the backup. This action cannot be undone!\n\nAre you absolutely sure?"
      )
      if (!confirmed) return
    }

    setIsImporting(true)
    try {
      await backupService.importData(user.id, previewData, importMode)
      setImportSuccess(true)
      
      setPreviewData(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
    } catch (err) {
      console.error("Import failed", err)
      alert("Failed to import data. Please check console for details.")
    } finally {
      setIsImporting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  return (
    <div className="page settings-page">
      <section className="page-title-row">
        <div>
          <h1>Settings</h1>
          <p>Manage your account preferences and backups.</p>
        </div>
      </section>

      <div className="settings-grid grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        
        {/* App Installation */}
        {!isStandalone && (
          <section className="panel col-span-1 md:col-span-2">
            <div className="section-heading mb-4 border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <Smartphone className="text-cyan-400" />
                <div>
                  <h2>Install App</h2>
                  <p>Install ManhwaVault on your device for offline access.</p>
                </div>
              </div>
            </div>
            <div>
              {installPrompt ? (
                <button className="button button-primary" onClick={promptInstall}>
                  Install ManhwaVault
                </button>
              ) : (
                <div className="text-sm text-muted bg-surface-2 p-4 rounded-lg border border-border">
                  App installation is currently unavailable. Your browser might not support it, or you may need to interact with the app more first.
                </div>
              )}
            </div>
          </section>
        )}

        {/* Backup Status */}
        <section className="panel col-span-1 md:col-span-2">
          <div className="section-heading mb-4 border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <Clock className="text-violet-400" />
              <div>
                <h2>Backup Status</h2>
                <p>Keep your data safe by exporting it regularly.</p>
              </div>
            </div>
          </div>
          <div>
            {lastBackup ? (
              <div className="flex items-center gap-2 text-green-400 bg-green-500/10 border border-green-500/20 p-4 rounded-lg">
                <CheckCircle size={18} className="shrink-0" />
                <span className="font-medium text-sm">Last backup: {formatDate(lastBackup)}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-orange-400 bg-orange-500/10 border border-orange-500/20 p-4 rounded-lg">
                <AlertTriangle size={18} className="shrink-0" />
                <span className="font-medium text-sm">⚠️ No backup created yet.</span>
              </div>
            )}
          </div>
        </section>

        {/* Export Section */}
        <section className="panel">
          <div className="section-heading mb-4 border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <Download className="text-amber-400" />
              <div>
                <h2>Export Data</h2>
                <p>Download a copy of your library and history.</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <button 
                onClick={handleExportJson} 
                disabled={isExporting} 
                className="button button-secondary w-full flex justify-center py-2.5 h-auto"
              >
                <FileJson size={16} className="mr-2" />
                {isExporting ? "Exporting..." : "Export Backup (JSON)"}
              </button>
              <p className="text-[11px] text-muted text-center">Complete backup of all your ManhwaVault data. Use this for restoring.</p>
            </div>

            <div className="space-y-2 pt-4 border-t border-border">
              <button 
                onClick={handleExportCsv} 
                disabled={isExportingCsv} 
                className="button button-secondary w-full flex justify-center py-2.5 h-auto"
              >
                <FileSpreadsheet size={16} className="mr-2" />
                {isExportingCsv ? "Exporting..." : "Export Library (CSV)"}
              </button>
              <p className="text-[11px] text-muted text-center">Spreadsheet format containing just your library titles and progress.</p>
            </div>
          </div>
        </section>

        {/* Import Section */}
        <section className="panel">
          <div className="section-heading mb-4 border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <Upload className="text-blue-400" />
              <div>
                <h2>Import Backup</h2>
                <p>Restore your data from a JSON backup file.</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            {importSuccess && (
              <div className="flex items-center gap-2 text-green-400 bg-green-500/10 border border-green-500/20 p-3 rounded-lg text-sm mb-4">
                <CheckCircle size={16} className="shrink-0" />
                Successfully imported backup!
              </div>
            )}

            <div className="space-y-2">
              <input
                type="file"
                accept="application/json"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="button button-secondary w-full flex justify-center py-2.5 h-auto"
              >
                Select Backup File
              </button>
            </div>

            {previewError && (
              <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex items-start gap-2">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                {previewError}
              </div>
            )}

            {previewData && (
              <div className="bg-surface-2 p-4 rounded-lg space-y-4 border border-border">
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-white">Backup Preview</h4>
                  <ul className="text-xs space-y-1 text-muted">
                    <li>Titles found: <span className="font-medium text-white">{previewData.manhwa?.length || 0}</span></li>
                    <li>History entries: <span className="font-medium text-white">{previewData.reading_history?.length || 0}</span></li>
                    <li>Tags: <span className="font-medium text-white">{previewData.tags?.length || 0}</span></li>
                  </ul>
                </div>
                
                <div className="space-y-3 pt-3 border-t border-border">
                  <h4 className="font-semibold text-sm text-white">Import Mode</h4>
                  
                  <div className="flex items-start space-x-3">
                    <input 
                      type="radio" 
                      id="merge" 
                      name="importMode" 
                      className="mt-0.5"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                    />
                    <label htmlFor="merge" className="text-xs leading-tight cursor-pointer">
                      <span className="font-bold text-white block mb-0.5">Merge with existing data</span>
                      <span className="text-muted">Updates existing items and adds new ones. Safe.</span>
                    </label>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <input 
                      type="radio" 
                      id="replace" 
                      name="importMode" 
                      className="mt-0.5"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                    />
                    <label htmlFor="replace" className="text-xs leading-tight cursor-pointer">
                      <span className="font-bold text-red-400 block mb-0.5">Replace existing data</span>
                      <span className="text-muted">Deletes current library before importing.</span>
                    </label>
                  </div>
                </div>

                <button 
                  onClick={handleImport}
                  disabled={isImporting}
                  className={`w-full py-2.5 rounded-md font-bold text-sm transition-colors ${importMode === 'replace' ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30' : 'button-primary'}`}
                >
                  {isImporting ? "Importing..." : "Import this backup?"}
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
