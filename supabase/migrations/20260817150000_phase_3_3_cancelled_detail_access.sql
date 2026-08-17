-- Direct links remain useful after cancellation/completion. Discovery continues to
-- use discoverable_fly_ins, which exposes only public, scheduled events.
drop policy if exists "Public can read scheduled fly-ins" on public.fly_ins;

create policy "Public can read link-addressable fly-ins"
on public.fly_ins for select
to public
using (
  visibility in ('public', 'unlisted')
  and status in ('scheduled', 'cancelled', 'completed')
);
