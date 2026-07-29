'use client';

export default function DonorsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
          Donors
        </h1>
        <p className="text-muted-foreground">
          View registered donor profiles, history, and engagement.
        </p>
      </div>
      <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
        Donor list and management content will go here.
      </div>
    </div>
  );
}
