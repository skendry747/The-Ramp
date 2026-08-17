"use client";

import { cancelFlyIn } from "@/app/fly-ins/actions";

export function CancelFlyInButton({ id }: { id: string }) {
  const action = cancelFlyIn.bind(null, id);
  return <form action={action} onSubmit={(event) => {
    if (!window.confirm("Cancel this fly-in? It will leave Discover, but its detail page and future event context will be preserved.")) event.preventDefault();
  }}><button className="cancel-event" type="submit">Cancel fly-in</button></form>;
}
