import { Card } from '@ukride/shared/ui/Card';

/** A placeholder until the admin shell and its sign-in arrive in step 0.8. */
export default function AdminHomePage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-14 pb-16 sm:px-6">
      <Card className="rise">
        <div className="space-y-3">
          <h1 className="text-3xl leading-tight font-semibold tracking-tight">UkRide admin</h1>
          <p className="text-base leading-relaxed text-ink-muted">
            The admin panel is being set up. Staff sign-in and the fleet and pricing screens move
            here next.
          </p>
        </div>
      </Card>
    </main>
  );
}
