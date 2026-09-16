import { requireAdmin } from '@/lib/admin'
import { db, getCategories } from '@/lib/db'
import ProPostEditor from '@/app/admin/components/ProPostEditor'

export default async function NewPostPage(){
 await requireAdmin(); const categories=await getCategories(); const tags=await db.prepare(`SELECT id,name FROM tags WHERE deleted_at IS NULL ORDER BY name`).all<{id:string;name:string}>()
 return (
    <>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Publishing</p>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight">New post</h1>
        <p className="mt-1 text-sm text-muted-foreground">Draft, format and publish a new journal article.</p>
      </div>
      <ProPostEditor categories={categories} tags={tags.results} />
    </>
  )
}
