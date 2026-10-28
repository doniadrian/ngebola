import "server-only";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { venues } from "@/db/schema";

/** Direktori lapangan untuk pilihan di form match (difilter per format di klien). */
export const opsiLapangan = () =>
  db
    .select({ id: venues.id, name: venues.name, area: venues.area, forMini: venues.forMini, forFootball: venues.forFootball, pricePerHour: venues.pricePerHour, verified: venues.verified })
    .from(venues)
    .orderBy(asc(venues.name))
    .all();
