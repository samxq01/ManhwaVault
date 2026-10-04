import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { backupService, type BackupData } from "@/services/backupService"
import { Download, Upload, FileJson, FileSpreadsheet, AlertTriangle, CheckCircle, Clock, Smartphone, ChevronRight } from "lucide-react"
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
    reader.onerror = () => setPreviewError("Failed to read file.")
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
      alert("Failed to import data. Please check console for details.")
    } finally {
      setIsImporting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, { 
      year: 'numeric', month: 'long', day: 'numeric' 
    })
  }

  return (
    <div className="px-6 md:px-12 py-10 max-w-4xl mx-auto min-h-screen">
      <header className="mb-12 border-b border-border pb-8">
        <span className="editorial-subheading text-accent">Preferences</span>
        <h1 className="editorial-heading mt-2">Settings & Data.</h1>
      </header>

      <div className="flex flex-col gap-12">
        
        {/* Backup Status */}
        <section>
          <h2 className="font-serif text-2xl mb-6">Backup Status</h2>
          <div className="flex items-center justify-between py-4 border-y border-border">
            <div className="flex items-center gap-4">
              <Clock size={16} className="text-muted-foreground" />
              <div>
                <span className="block text-sm font-medium">Last Backup</span>
                <span className="text-xs text-muted-foreground">{lastBackup ? formatDate(lastBackup) : "Never backed up"}</span>
              </div>
            </div>
            {lastBackup ? (
              <CheckCircle size={16} className="text-accent" />
            ) : (
              <AlertTriangle size={16} className="text-destructive" />
            )}
          </div>
        </section>

        {/* Data Management */}
        <section>
          <h2 className="font-serif text-2xl mb-6">Data Management</h2>
          
          <div className="flex flex-col border-t border-border">
            <button 
              onClick={handleExportJson} 
              disabled={isExporting}
              className="flex items-center justify-between py-5 border-b border-border group text-left hover:bg-surface-elevated/50 transition-colors px-2 -mx-2"
            >
              <div className="flex items-center gap-4">
                <FileJson size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                <div>
                  <span className="block text-sm font-medium">Export Full Backup (JSON)</span>
                  <span className="text-xs text-muted-foreground">Complete backup of all your data for restoration.</span>
                </div>
              </div>
              {isExporting ? <Loader2 size={16} className="animate-spin text-accent" /> : <Download size={16} className="text-muted-foreground group-hover:text-accent transition-colors" />}
            </button>

            <button 
              onClick={handleExportCsv} 
              disabled={isExportingCsv}
              className="flex items-center justify-between py-5 border-b border-border group text-left hover:bg-surface-elevated/50 transition-colors px-2 -mx-2"
            >
              <div className="flex items-center gap-4">
                <FileSpreadsheet size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                <div>
                  <span className="block text-sm font-medium">Export Library (CSV)</span>
                  <span className="text-xs text-muted-foreground">Spreadsheet format containing your library progress.</span>
                </div>
              </div>
              {isExportingCsv ? <Loader2 size={16} className="animate-spin text-accent" /> : <Download size={16} className="text-muted-foreground group-hover:text-accent transition-colors" />}
            </button>

            <div className="py-5 border-b border-border px-2 -mx-2">
              <input type="file" accept="application/json" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-between w-full group text-left hover:bg-surface-elevated/50 transition-colors mb-4"
              >
                <div className="flex items-center gap-4">
                  <Upload size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                  <div>
                    <span className="block text-sm font-medium">Import Backup</span>
                    <span className="text-xs text-muted-foreground">Restore your data from a JSON backup file.</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-muted-foreground group-hover:text-accent transition-colors" />
              </button>

              {importSuccess && (
                <div className="text-accent text-xs flex items-center gap-2 mb-4 bg-accent/10 p-2 rounded-sm">
                  <CheckCircle size={14} /> Successfully imported backup!
                </div>
              )}
              {previewError && (
                <div className="text-destructive text-xs flex items-center gap-2 mb-4 bg-destructive/10 p-2 rounded-sm">
                  <AlertTriangle size={14} /> {previewError}
                </div>
              )}

              {previewData && (
                <div className="bg-surface border border-border p-4 mt-2 text-sm">
                  <h4 className="font-serif text-lg mb-3">Backup Preview</h4>
                  <ul className="text-xs text-muted-foreground mb-6 space-y-1">
                    <li>Titles found: <strong className="text-foreground">{previewData.manhwa?.length || 0}</strong></li>
                    <li>History entries: <strong className="text-foreground">{previewData.reading_history?.length || 0}</strong></li>
                    <li>Tags: <strong className="text-foreground">{previewData.tags?.length || 0}</strong></li>
                  </ul>

                  <div className="space-y-4 mb-6">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input type="radio" name="importMode" className="mt-1 accent-accent" checked={importMode === 'merge'} onChange={() => setImportMode('merge')} />
                      <div>
                        <span className="block font-medium group-hover:text-accent transition-colors">Merge with existing data</span>
                        <span className="text-xs text-muted-foreground">Updates existing items and adds new ones. Safe.</span>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input type="radio" name="importMode" className="mt-1 accent-destructive" checked={importMode === 'replace'} onChange={() => setImportMode('replace')} />
                      <div>
                        <span className="block font-medium text-destructive group-hover:text-destructive/80 transition-colors">Replace existing data</span>
                        <span className="text-xs text-muted-foreground">Deletes current library before importing. Danger.</span>
                      </div>
                    </label>
                  </div>

                  <button 
                    onClick={handleImport} disabled={isImporting}
                    className={`w-full py-2 text-xs uppercase tracking-widest font-semibold transition-colors ${importMode === 'replace' ? 'bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/30' : 'bg-accent text-background hover:bg-accent/90'}`}
                  >
                    {isImporting ? "Importing..." : "Confirm Import"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* App Installation */}
        {!isStandalone && installPrompt && (
          <section>
            <h2 className="font-serif text-2xl mb-6">App Installation</h2>
            <div className="flex flex-col border-t border-border">
              <button 
                onClick={promptInstall}
                className="flex items-center justify-between py-5 border-b border-border group text-left hover:bg-surface-elevated/50 transition-colors px-2 -mx-2"
              >
                <div className="flex items-center gap-4">
                  <Smartphone size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                  <div>
                    <span className="block text-sm font-medium">Install ManhwaVault</span>
                    <span className="text-xs text-muted-foreground">Install on your device for quick offline access.</span>
                  </div>
                </div>
                <Download size={16} className="text-muted-foreground group-hover:text-accent transition-colors" />
              </button>
            </div>
          </section>
        )}

      </div>
    </div>
  )
}
