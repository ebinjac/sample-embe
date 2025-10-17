import { Metadata } from 'next'
import { ImportLinks } from '@/components/linkmanager/import-links'

export const metadata: Metadata = {
  title: 'Import Links',
  description: 'Import links from CSV, Markdown, HTML, or JSON files',
}

export default function ImportPage({
  params,
}: {
  params: { teamId: string }
}) {
  return <ImportLinks teamId={params.teamId} />
}