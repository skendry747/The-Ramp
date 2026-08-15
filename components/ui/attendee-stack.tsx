type AttendeeStackProps = {
  names: string[];
  total: number;
  className?: string;
};

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

export function AttendeeStack({ names, total, className = "" }: AttendeeStackProps) {
  const visibleNames = names.slice(0, 3);
  return <div className={`attendee-stack ${className}`} aria-label={`${total} pilots attending`}>
    <div className="avatar-stack" aria-hidden="true">
      {visibleNames.map((name) => <span className="mini-avatar" key={name}>{initials(name)}</span>)}
    </div>
    <span><b>{total}</b> pilots going</span>
  </div>;
}
