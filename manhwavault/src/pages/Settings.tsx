import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { backupService, type BackupData } from "@/services/backupService"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Upload, FileJson, FileSpreadsheet, AlertTriangle, CheckCircle, Clock } from "lucide-react"

export function Settings() {
  const { user } = useAuth()
  const [lastBackup, setLastBackup] = useState<string | null>(null)
  
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
    <div className="p-4 md:p-10 max-w-4xl mx-auto space-y-6 md:space-y-8">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground mt-1">Manage your data, backups, and preferences.</p>
      </header>

      <div className="grid gap-6">
        
        {/* Backup Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Backup Status
            </CardTitle>
            <CardDescription>Keep your data safe by exporting it regularly.</CardDescription>
          </CardHeader>
          <CardContent>
            {lastBackup ? (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-500/10 p-4 rounded-lg">
                <CheckCircle className="h-5 w-5 shrink-0" />
                <span className="font-medium">Last backup: {formatDate(lastBackup)}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 bg-orange-500/10 p-4 rounded-lg">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <span className="font-medium">⚠️ No backup created yet.</span>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Export Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Data
              </CardTitle>
              <CardDescription>Download a copy of your library and history.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Button 
                  onClick={handleExportJson} 
                  disabled={isExporting} 
                  className="w-full justify-start"
                >
                  <FileJson className="mr-2 h-4 w-4" />
                  {isExporting ? "Exporting..." : "Export Backup (JSON)"}
                </Button>
                <p className="text-xs text-muted-foreground">Complete backup of all your ManhwaVault data. Use this for restoring.</p>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <Button 
                  variant="outline"
                  onClick={handleExportCsv} 
                  disabled={isExportingCsv} 
                  className="w-full justify-start"
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  {isExportingCsv ? "Exporting..." : "Export Library (CSV)"}
                </Button>
                <p className="text-xs text-muted-foreground">Spreadsheet format containing just your library titles and progress.</p>
              </div>
            </CardContent>
          </Card>

          {/* Import Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Import Backup
              </CardTitle>
              <CardDescription>Restore your data from a JSON backup file.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {importSuccess && (
                <div className="flex items-center gap-2 text-green-600 bg-green-500/10 p-3 rounded-lg text-sm mb-4">
                  <CheckCircle className="h-4 w-4 shrink-0" />
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
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  Select Backup File
                </Button>
              </div>

              {previewError && (
                <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  {previewError}
                </div>
              )}

              {previewData && (
                <div className="bg-accent/50 p-4 rounded-lg space-y-4 border">
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Backup Preview</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>Titles found: <span className="font-medium text-foreground">{previewData.manhwa?.length || 0}</span></li>
                      <li>History entries: <span className="font-medium text-foreground">{previewData.reading_history?.length || 0}</span></li>
                      <li>Tags: <span className="font-medium text-foreground">{previewData.tags?.length || 0}</span></li>
                    </ul>
                  </div>
                  
                  <div className="space-y-3 pt-3 border-t">
                    <h4 className="font-semibold text-sm">Import Mode</h4>
                    
                    <div className="flex items-start space-x-2">
                      <input 
                        type="radio" 
                        id="merge" 
                        name="importMode" 
                        className="mt-1"
                        checked={importMode === 'merge'}
                        onChange={() => setImportMode('merge')}
                      />
                      <label htmlFor="merge" className="text-sm leading-tight cursor-pointer">
                        <span className="font-medium block">Merge with existing data</span>
                        <span className="text-muted-foreground text-xs">Updates existing items and adds new ones. Safe.</span>
                      </label>
                    </div>
                    
                    <div className="flex items-start space-x-2">
                      <input 
                        type="radio" 
                        id="replace" 
                        name="importMode" 
                        className="mt-1"
                        checked={importMode === 'replace'}
                        onChange={() => setImportMode('replace')}
                      />
                      <label htmlFor="replace" className="text-sm leading-tight cursor-pointer">
                        <span className="font-medium text-destructive block">Replace existing data</span>
                        <span className="text-muted-foreground text-xs">Deletes current library before importing.</span>
                      </label>
                    </div>
                  </div>

                  <Button 
                    onClick={handleImport}
                    disabled={isImporting}
                    variant={importMode === 'replace' ? 'destructive' : 'default'}
                    className="w-full mt-4"
                  >
                    {isImporting ? "Importing..." : "Import this backup?"}
                  </Button>
                </div>
              )}

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
