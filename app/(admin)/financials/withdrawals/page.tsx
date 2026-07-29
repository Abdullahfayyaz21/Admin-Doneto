'use client';

export default function WithdrawalRequestsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
          Withdrawal Requests
        </h1>
        <p className="text-muted-foreground">
          Review and approve disbursement/payout withdrawal requests from NGOs.
        </p>
      </div>
      <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
        Withdrawal requests processing list will go here.
      </div>
    </div>
  );
}
