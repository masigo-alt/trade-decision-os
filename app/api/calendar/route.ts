import { NextResponse } from "next/server";
import { fetchCalendar } from "@/lib/market-data";

export const revalidate = 900;

export async function GET() {
  const events = await fetchCalendar();
  return NextResponse.json({ live: events.length > 0, events });
}
