import MediaLibrary from '@/app/admin/components/MediaLibrary'

export default function MediaPage() {
  return (
    <>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Media library</p>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight">Media</h1>
        <p className="mt-1 text-sm text-muted-foreground">Upload, browse, rename and remove images stored in R2. Deleted items move to Trash.</p>
      </div>
      <MediaLibrary mode="page" />
    </>
  )
}
