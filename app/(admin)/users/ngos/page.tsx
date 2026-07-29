'use client';

export default function NGOsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
          NGOs
        </h1>
        <p className="text-muted-foreground">
          Manage and review registered NGO profiles and their accreditation details.
        </p>
      </div>
      <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
        NGO list and management content will go here.
      </div>
    </div>
  );
}
