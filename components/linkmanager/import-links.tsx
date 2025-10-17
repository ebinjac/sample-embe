'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/components/session-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { bulkImportLinks } from '@/lib/actions/linkmanager/bulk-import'
import { toast } from 'sonner'
import { Upload, FileText, Link, Code, File, CheckCircle, AlertCircle, Download } from 'lucide-react'
import { motion } from 'framer-motion'

interface ImportLinksProps {
  teamId: string
}

const fileIcons = {
  csv: <FileText className="h-4 w-4" />,
  markdown: <FileText className="h-4 w-4" />,
  html: <Code className="h-4 w-4" />,
  json: <File className="h-4 w-4" />
}

export function ImportLinks({ teamId }: ImportLinksProps) {
  const router = useRouter()
  const { session } = useSession()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileType, setFileType] = useState<'csv' | 'markdown' | 'html' | 'json'>('csv')
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    success: boolean
    message: string
    count?: number
    error?: string
  } | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setImportResult(null)
    }
  }, [])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0])
      setImportResult(null)
    }
  }, [])

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to import')
      return
    }

    setIsImporting(true)
    setImportResult(null)

    try {
      const content = await selectedFile.text()
      const result = await bulkImportLinks(teamId, content, fileType)
      
      setImportResult({
        success: result.success,
        message: result.message || (result.success ? 'Links imported successfully' : 'Failed to import links'),
        count: result.count,
        error: result.error
      })
      
      if (result.success) {
        toast.success(result.message || 'Links imported successfully')
      } else {
        toast.error(result.error || 'Failed to import links')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setImportResult({
        success: false,
        message: 'Import failed',
        error: errorMessage
      })
      toast.error('Import failed: ' + errorMessage)
    } finally {
      setIsImporting(false)
    }
  }

  const downloadSampleFile = (type: 'csv' | 'markdown' | 'html' | 'json') => {
    let content = ''
    let filename = ''
    let mimeType = ''

    switch (type) {
      case 'csv':
        content = `url,title,description,tags,isPrivate,isPinned
https://example.com,Example Site,This is an example site,"tag1;tag2",false,false
https://github.com,GitHub,Code repository,"development;code",false,true`
        filename = 'sample-links.csv'
        mimeType = 'text/csv'
        break
      case 'markdown':
        content = `# Sample Links

[Example Site](https://example.com) - This is an example site
[GitHub](https://github.com) - Code repository

[Direct Link](https://example.org)`
        filename = 'sample-links.md'
        mimeType = 'text/markdown'
        break
      case 'html':
        content = `<!DOCTYPE html>
<html>
<head><title>Sample Links</title></head>
<body>
  <h1>Sample Links</h1>
  <a href="https://example.com">Example Site</a>
  <a href="https://github.com">GitHub</a>
</body>
</html>`
        filename = 'sample-links.html'
        mimeType = 'text/html'
        break
      case 'json':
        content = `[
  {
    "url": "https://example.com",
    "title": "Example Site",
    "description": "This is an example site",
    "tags": ["tag1", "tag2"],
    "isPrivate": false,
    "isPinned": false
  },
  {
    "url": "https://github.com",
    "title": "GitHub",
    "description": "Code repository",
    "tags": ["development", "code"],
    "isPrivate": false,
    "isPinned": true
  }
]`
        filename = 'sample-links.json'
        mimeType = 'application/json'
        break
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Import Links</h1>
          <p className="text-muted-foreground">
            Import your existing links from CSV, Markdown, HTML, or JSON files
          </p>
        </div>

        <div className="grid gap-6">
          {/* File Upload Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Select File to Import
              </CardTitle>
              <CardDescription>
                Choose a file format and upload your links file
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* File Type Selection */}
              <div className="space-y-2">
                <Label htmlFor="file-type">File Format</Label>
                <Select value={fileType} onValueChange={(value: any) => setFileType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select file format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">
                      <div className="flex items-center gap-2">
                        {fileIcons.csv}
                        CSV (Comma Separated Values)
                      </div>
                    </SelectItem>
                    <SelectItem value="markdown">
                      <div className="flex items-center gap-2">
                        {fileIcons.markdown}
                        Markdown
                      </div>
                    </SelectItem>
                    <SelectItem value="html">
                      <div className="flex items-center gap-2">
                        {fileIcons.html}
                        HTML
                      </div>
                    </SelectItem>
                    <SelectItem value="json">
                      <div className="flex items-center gap-2">
                        {fileIcons.json}
                        JSON
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* File Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">
                    {selectedFile ? selectedFile.name : 'Drop your file here or click to browse'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Supports {fileType.toUpperCase()} files
                  </p>
                </div>
                <Input
                  type="file"
                  accept={fileType === 'markdown' ? '.md,.markdown' : `.${fileType}`}
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <Button variant="outline" className="mt-4">
                    Choose File
                  </Button>
                </Label>
              </div>

              {/* Sample File Download */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Need a sample file?</p>
                  <p className="text-sm text-muted-foreground">
                    Download a sample {fileType.toUpperCase()} file to see the expected format
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadSampleFile(fileType)}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Sample
                </Button>
              </div>

              <Separator />

              {/* Import Button */}
              <Button
                onClick={handleImport}
                disabled={!selectedFile || isImporting}
                className="w-full"
                size="lg"
              >
                {isImporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Import Links
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Import Result */}
          {importResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Alert className={importResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <div className="flex items-center gap-2">
                  {importResult.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription className={importResult.success ? 'text-green-800' : 'text-red-800'}>
                    <div className="font-medium">{importResult.message}</div>
                    {importResult.count && (
                      <div className="text-sm mt-1">
                        Successfully imported {importResult.count} links
                      </div>
                    )}
                    {importResult.error && (
                      <div className="text-sm mt-1">
                        Error: {importResult.error}
                      </div>
                    )}
                  </AlertDescription>
                </div>
              </Alert>

              {importResult.success && (
                <div className="mt-4 flex gap-2">
                  <Button onClick={() => router.push(`/tools/teams/${teamId}/linkio/all`)}>
                    View Imported Links
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setSelectedFile(null)
                    setImportResult(null)
                  }}>
                    Import More Links
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {/* Format Information */}
          <Card>
            <CardHeader>
              <CardTitle>File Format Information</CardTitle>
              <CardDescription>
                Learn about the supported file formats and their structure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={fileType} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="csv">CSV</TabsTrigger>
                  <TabsTrigger value="markdown">Markdown</TabsTrigger>
                  <TabsTrigger value="html">HTML</TabsTrigger>
                  <TabsTrigger value="json">JSON</TabsTrigger>
                </TabsList>
                
                <TabsContent value="csv" className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">CSV Format</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Comma-separated values with columns: url, title, description, tags, isPrivate, isPinned
                    </p>
                    <div className="bg-muted p-3 rounded-md text-sm font-mono">
                      url,title,description,tags,isPrivate,isPinned<br/>
                      https://example.com,Example Site,Description,"tag1;tag2",false,false
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="markdown" className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Markdown Format</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Links in markdown format: [title](url) or plain URLs
                    </p>
                    <div className="bg-muted p-3 rounded-md text-sm font-mono">
                      [Example Site](https://example.com)<br/>
                      [GitHub](https://github.com)<br/>
                      https://plain-url.com
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="html" className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">HTML Format</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Extracts links from anchor tags and meta refresh tags
                    </p>
                    <div className="bg-muted p-3 rounded-md text-sm font-mono">
                      {"<a href=\"https://example.com\">Example Site</a>"}<br/>
                      {"<a href=\"https://github.com\">GitHub</a>"}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="json" className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">JSON Format</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Array of objects with url, title, description, tags, isPrivate, isPinned
                    </p>
                    <div className="bg-muted p-3 rounded-md text-sm font-mono overflow-x-auto">
                      [&#123;<br/>
                      &nbsp;&nbsp;"url": "https://example.com",<br/>
                      &nbsp;&nbsp;"title": "Example Site",<br/>
                      &nbsp;&nbsp;"description": "Description",<br/>
                      &nbsp;&nbsp;"tags": ["tag1", "tag2"],<br/>
                      &nbsp;&nbsp;"isPrivate": false,<br/>
                      &nbsp;&nbsp;"isPinned": false<br/>
                      &#125;]
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  )
}