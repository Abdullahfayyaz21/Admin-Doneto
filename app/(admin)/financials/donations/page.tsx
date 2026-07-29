'use client';

export default function DonationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
          Donations
        </h1>
        <p className="text-muted-foreground">
          Track transaction history and payment processing logs.
        </p>
      </div>
      <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
        Donation transaction history content will go here.
      </div>
    </div>
  );
}
