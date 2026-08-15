import { CreateFlyInForm } from "@/components/fly-ins/create-fly-in-form";

export const metadata = { title: "Create a Fly-In | The Ramp" };
export default function CreatePage() { return <section className="page-shell create-page"><div className="page-intro compact"><p className="eyebrow">HOST A GREAT DAY</p><h1>Start a <em>fly-in.</em></h1><p>Make the plan clear, invite the right people, and give pilots a reason to point the nose your way.</p><div className="create-aside"><span>01</span><p>Choose the airport and time.</p><span>02</span><p>Add a short ramp briefing.</p><span>03</span><p>Share the plan locally—in this demo, it stays in this browser.</p></div></div><CreateFlyInForm /></section>; }
