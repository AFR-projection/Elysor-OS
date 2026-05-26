"use client";



import {

  Download,

  FileSpreadsheet,

  FileText,

  Film,

  ImageIcon,

} from "lucide-react";

import { dedupeGeneratedMedia, type GeneratedMediaItem } from "@/types/media";

import { cn } from "@/lib/utils";



export function GeneratedMediaGallery({

  items,

  className,

}: {

  items: GeneratedMediaItem[];

  className?: string;

}) {

  const unique = dedupeGeneratedMedia(items);

  if (unique.length === 0) return null;



  return (

    <div className={cn("space-y-3", className)}>

      {unique.map((item) => (

        <GeneratedMediaCard key={item.id} item={item} />

      ))}

    </div>

  );

}



function formatLabel(format?: string): string {

  if (!format) return "FILE";

  return format.toUpperCase();

}



function GeneratedMediaCard({ item }: { item: GeneratedMediaItem }) {

  const isDocument = item.kind === "document";



  return (

    <div className="overflow-hidden rounded-2xl bg-white/[0.03] ring-1 ring-white/10">

      <div className="flex items-center justify-between gap-2 border-b border-white/6 px-3 py-2">

        <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">

          {item.kind === "video" ? (

            <Film className="size-3.5 shrink-0 text-violet-300" />

          ) : item.kind === "document" ? (

            item.format === "xlsx" || item.format === "csv" ? (

              <FileSpreadsheet className="size-3.5 shrink-0 text-emerald-300" />

            ) : (

              <FileText className="size-3.5 shrink-0 text-amber-300" />

            )

          ) : (

            <ImageIcon className="size-3.5 shrink-0 text-cyan-300" />

          )}

          <span className="truncate font-medium text-foreground/85">

            {item.title ?? item.name}

          </span>

          {isDocument && (

            <span className="shrink-0 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-amber-200">

              {formatLabel(item.format)}

            </span>

          )}

        </div>

        <a

          href={item.url}

          download={item.name}

          className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-cyan-500/10 px-2.5 py-1 text-[10px] font-medium text-cyan-200 ring-1 ring-cyan-400/20 transition-colors hover:bg-cyan-500/15"

        >

          <Download className="size-3" />

          Download

        </a>

      </div>



      {item.kind === "image" ? (

        // eslint-disable-next-line @next/next/no-img-element

        <img

          src={item.url}

          alt={item.prompt ?? item.name}

          className="max-h-[min(70vh,520px)] w-full object-contain bg-black/20"

        />

      ) : item.kind === "video" ? (

        <video

          src={item.url}

          controls

          playsInline

          className="max-h-[min(70vh,520px)] w-full bg-black/30"

        />

      ) : (

        <div className="space-y-2 px-4 py-5">

          <p className="text-sm font-medium text-foreground/90">

            {item.title ?? "Dokumen siap diunduh"}

          </p>

          <p className="text-xs text-muted-foreground/80">

            {item.name} · {(item.size / 1024).toFixed(1)} KB

          </p>

          <p className="text-[11px] leading-relaxed text-muted-foreground/70">

            File tersimpan di PAIOS workspace. Klik Download untuk simpan ke

            perangkat kamu.

          </p>

        </div>

      )}



      {(item.model || item.prompt) && item.kind !== "document" ? (

        <div className="space-y-1 px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground/80">

          {item.model ? (

            <p>

              <span className="font-medium text-violet-300/90">Model: </span>

              {item.model}

            </p>

          ) : null}

          {item.prompt ? (

            <p className="line-clamp-3">

              <span className="font-medium text-cyan-300/90">Prompt: </span>

              {item.prompt}

            </p>

          ) : null}

        </div>

      ) : null}

    </div>

  );

}


