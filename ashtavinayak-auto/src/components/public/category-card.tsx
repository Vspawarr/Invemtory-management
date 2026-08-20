import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { AppImage } from "@/components/app-image";

export function CategoryCard({
  name,
  slug,
  count,
  imageUrl,
}: {
  name: string;
  slug: string;
  count: number;
  imageUrl?: string | null;
}) {
  return (
    <Link href={`/vehicles?category=${slug}`} className="group block">
      <Card className="overflow-hidden transition-shadow hover:shadow-lg">
        <div className="relative aspect-[16/10] w-full bg-muted">
          {imageUrl && (
            <AppImage src={imageUrl} alt={name} fill sizes="(max-width: 768px) 50vw, 33vw" className="object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 text-white">
            <h3 className="text-lg font-bold">{name}</h3>
            <p className="text-sm opacity-90">{count} available</p>
          </div>
        </div>
        <div className="flex items-center justify-between p-3 text-sm font-medium text-primary">
          Browse {name}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
      </Card>
    </Link>
  );
}
