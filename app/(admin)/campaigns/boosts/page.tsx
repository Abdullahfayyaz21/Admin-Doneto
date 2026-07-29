'use client';

export default function BoostRequestsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
          Boost Requests
        </h1>
        <p className="text-muted-foreground">
          Manage and review promotion/boosting request applications for campaigns.
        </p>
      </div>
      <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
        Boost request applications queue will go here.
      </div>
    </div>
  );
}
