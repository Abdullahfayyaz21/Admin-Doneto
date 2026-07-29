'use client';

export default function CampaignsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
          All Campaigns
        </h1>
        <p className="text-muted-foreground">
          Monitor and manage active and closed fundraising campaigns.
        </p>
      </div>
      <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
        Campaign management content will go here.
      </div>
    </div>
  );
}
