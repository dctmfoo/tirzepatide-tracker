import { Pencil, Calendar, User, ArrowUpDown, Scale } from 'lucide-react';

type ProfileCardProps = {
  name: string;
  email: string;
  age: number | null;
  gender: string | null;
  height: string;
  startWeight: string;
  onEdit: () => void;
};

export function ProfileCard({
  name,
  email,
  age,
  gender,
  height,
  startWeight,
  onEdit,
}: ProfileCardProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <section className="rounded-[1.25rem] bg-card p-5 shadow-sm">
      {/* Profile Header with Avatar */}
      <div className="mb-5 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-violet-600">
          <span className="font-display text-xl font-bold text-white">{initials}</span>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold tracking-tight text-card-foreground">{name}</h2>
          <p className="mt-0.5 truncate text-[0.9375rem] text-muted-foreground">{email}</p>
        </div>
        <button
          onClick={onEdit}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/70 text-muted-foreground transition-colors hover:bg-secondary"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </div>

      {/* Profile Details Grid with Icons */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border/40 bg-secondary/50 p-3">
          <div className="mb-1 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-[0.75rem] text-muted-foreground">Age</p>
          </div>
          <p className="font-display text-lg font-bold text-card-foreground">
            {age ?? 'Not set'}
          </p>
        </div>
        <div className="rounded-2xl border border-border/40 bg-secondary/50 p-3">
          <div className="mb-1 flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-[0.75rem] text-muted-foreground">Gender</p>
          </div>
          <p className="font-display text-lg font-bold capitalize text-card-foreground">
            {gender ?? 'Not set'}
          </p>
        </div>
        <div className="rounded-2xl border border-border/40 bg-secondary/50 p-3">
          <div className="mb-1 flex items-center gap-1.5">
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-[0.75rem] text-muted-foreground">Height</p>
          </div>
          <p className="font-display text-lg font-bold text-card-foreground">{height}</p>
        </div>
        <div className="rounded-2xl border border-border/40 bg-secondary/50 p-3">
          <div className="mb-1 flex items-center gap-1.5">
            <Scale className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-[0.75rem] text-muted-foreground">Start Weight</p>
          </div>
          <p className="font-display text-lg font-bold text-card-foreground">{startWeight}</p>
        </div>
      </div>
    </section>
  );
}
