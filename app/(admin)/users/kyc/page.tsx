'use client';

export default function KYCRequestsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
          KYC Requests
        </h1>
        <p className="text-muted-foreground">
          Review and approve verification requests for NGOs and organizations.
        </p>
      </div>
      <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
        KYC verification request queue will go here.
      </div>
    </div>
  );
}
