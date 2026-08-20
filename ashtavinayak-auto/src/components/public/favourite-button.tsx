"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toggleFavourite } from "@/actions/favourites";

export function FavouriteButton({
  vehicleId,
  initialFavourited,
}: {
  vehicleId: string;
  initialFavourited: boolean;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [favourited, setFavourited] = useState(initialFavourited);
  const [isPending, startTransition] = useTransition();

  const onClick = () => {
    if (status !== "authenticated" || !session?.user) {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }
    startTransition(async () => {
      const result = await toggleFavourite(vehicleId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setFavourited(result.data.favourited);
      toast.success(result.data.favourited ? "Saved to favourites." : "Removed from favourites.");
    });
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={onClick}
      disabled={isPending}
      aria-pressed={favourited}
      aria-label={favourited ? "Remove from favourites" : "Save to favourites"}
      title={favourited ? "Remove from favourites" : "Save to favourites"}
    >
      <Heart className={cn("h-4 w-4", favourited && "fill-accent text-accent")} />
    </Button>
  );
}
