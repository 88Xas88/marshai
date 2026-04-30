import { AdminShell } from '@/components/admin/AdminShell'
import { ArticleEditor } from '@/components/admin/ArticleEditor'

export default function NewArticlePage() {
  return (
    <AdminShell>
      <ArticleEditor />
    </AdminShell>
  )
}
