import Link from "next/link";
import { Car } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Car className="h-7 w-7" />
      </div>
      <h1 className="text-3xl font-bold">Page Not Found</h1>
      <p className="max-w-sm text-muted-foreground">
        The page you&rsquo;re looking for doesn&rsquo;t exist or may have been moved.
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/vehicles">Browse Vehicles</Link>
        </Button>
      </div>
    </div>
  );
}
