import { Skeleton } from "@/components/ui/skeleton";

export default function RequestDetailLoading() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-8">
      <div>
        <Skeleton className="h-4 w-32" />
      </div>

      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-border rounded-lg p-6 bg-surface">
             <Skeleton className="h-6 w-32 mb-6" />
             <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
             </div>
             <Skeleton className="h-24 w-full mt-6" />
          </div>
          
          <div className="border border-border rounded-lg p-6 bg-surface">
             <Skeleton className="h-6 w-32 mb-6" />
             <div className="space-y-4">
               <Skeleton className="h-12 w-full" />
               <Skeleton className="h-12 w-full" />
               <Skeleton className="h-12 w-full" />
             </div>
          </div>
        </div>

        <div className="space-y-6">
           <div className="border border-border rounded-lg p-6 bg-surface">
             <Skeleton className="h-6 w-40 mb-6" />
             <Skeleton className="h-16 w-full mb-6" />
             <Skeleton className="h-24 w-full" />
           </div>
        </div>
      </div>
    </div>
  );
}
