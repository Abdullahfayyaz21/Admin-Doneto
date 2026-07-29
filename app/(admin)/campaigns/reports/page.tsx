'use client';

export default function ReportedCampaignsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
          Reported Campaigns
        </h1>
        <p className="text-muted-foreground">
          Review campaigns reported by system users for guidelines violations.
        </p>
      </div>
      <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
        Reported campaigns list and moderator actions will go here.
      </div>
    </div>
  );
}
