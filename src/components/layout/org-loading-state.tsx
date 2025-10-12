import { Loader2 } from "lucide-react";

export function OrgLoadingState() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
      </div>
    </div>
  );
}

export function OrgNotSelectedState() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
