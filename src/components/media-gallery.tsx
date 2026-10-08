import { FileText } from "lucide-react";
import { MEDIA_KIND_LABEL } from "@/lib/labels";
import { T } from "@/i18n/client";

export function MediaGallery({ media }: { media: Array<{ id: string; url: string; kind: string; mimeType: string }> }) {
  if (media.length === 0)
    return (
      <p className="text-sm text-muted">
        <T k="farmer.noPhotos" />
      </p>
    );
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {media.map((m) => (
        <figure key={m.id} className="overflow-hidden rounded-xl bg-cream ring-1 ring-earth-100">
          {m.mimeType.startsWith("video/") ? (
            <video src={m.url} controls className="aspect-square w-full bg-black object-contain" preload="metadata" />
          ) : m.mimeType.startsWith("image/") ? (
            <a href={m.url} target="_blank" rel="noreferrer">
              <img src={m.url} alt={MEDIA_KIND_LABEL[m.kind] ?? m.kind} className="aspect-square w-full object-cover" loading="lazy" />
            </a>
          ) : (
            <a href={m.url} target="_blank" rel="noreferrer" className="grid aspect-square place-items-center text-earth-600">
              <FileText className="size-8" />
            </a>
          )}
          <figcaption className="px-2 py-1 text-[11px] font-medium text-muted">
            <T k={`labels.mediaKind.${m.kind}`} fallback={MEDIA_KIND_LABEL[m.kind] ?? m.kind} />
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
