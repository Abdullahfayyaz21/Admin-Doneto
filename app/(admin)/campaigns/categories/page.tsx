'use client';

export default function CategoriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
          Campaign Categories
        </h1>
        <p className="text-muted-foreground">
          Manage system-wide campaign categories and classifications.
        </p>
      </div>
      <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
        Category management content will go here.
      </div>
    </div>
  );
}
