import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <div className="max-w-md w-full border border-border bg-card rounded-xl text-center p-8 space-y-4 shadow-sm">
        <Compass className="w-12 h-12 text-muted-foreground mx-auto" />
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-foreground">Page Not Found</h2>
          <p className="text-sm text-muted-foreground">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-xl text-sm font-semibold bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-5 transition-colors"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
