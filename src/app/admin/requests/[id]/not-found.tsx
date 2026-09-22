import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export default function RequestNotFound() {
  return (
    <div className="max-w-2xl mx-auto pt-10">
      <EmptyState
        title="Request Not Found"
        description="The request you are looking for does not exist or has been removed."
        action={
          <Link href="/admin/requests" passHref>
            <Button>Back to Requests</Button>
          </Link>
        }
      />
    </div>
  );
}
