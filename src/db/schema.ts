// Skema lengkap (docs/PLAN.md bagian 2). Portabel ke Postgres: id text UUID, waktu timestamp_ms,
// boolean, enum = text + daftar di enums.ts, tanpa JSON, tanpa fitur khusus SQLite. Nama kolom DB snake_case.
import { sql } from "drizzle-orm";
import { index, integer, primaryKey, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import * as E from "./enums";

const id = () => text().primaryKey().$defaultFn(() => crypto.randomUUID());
const waktu = () => integer({ mode: "timestamp_ms" });
const dibuat = () => waktu().notNull().$defaultFn(() => new Date());
const bool = () => integer({ mode: "boolean" });

// ── Akun & keamanan ──────────────────────────────────────────────────────────

export const users = sqliteTable("users", {
  id: id(),
  email: text().notNull().unique(), // selalu huruf kecil
  passwordHash: text(),
  role: text({ enum: E.PERAN }).notNull(),
  name: text().notNull(),
  birthDate: text(), // YYYY-MM-DD
  // Persetujuan Syarat Layanan & Kebijakan Privasi (UU PDP): waktu dan versi dokumen yang disetujui.
  consentAt: waktu(),
  consentVersion: text(),
  status: text({ enum: E.STATUS_AKUN }).notNull().default("aktif"),
  createdAt: dibuat(),
  updatedAt: dibuat(),
  deletedAt: waktu(),
});

export const sessions = sqliteTable("sessions", {
  id: id(),
  tokenHash: text().notNull().unique(),
  userId: text().notNull().references(() => users.id),
  createdAt: dibuat(),
  expiresAt: waktu().notNull(),
  userAgent: text(),
}, (t) => [index("sessions_user_idx").on(t.userId)]);

export const passwordResetTokens = sqliteTable("password_reset_tokens", {
  id: id(),
  userId: text().notNull().references(() => users.id),
  tokenHash: text().notNull().unique(),
  expiresAt: waktu().notNull(),
  usedAt: waktu(),
  createdAt: dibuat(),
});

export const rateLimitEvents = sqliteTable("rate_limit_events", {
  id: id(),
  bucket: text().notNull(),
  createdAt: dibuat(),
}, (t) => [index("rate_limit_bucket_idx").on(t.bucket, t.createdAt)]);

// ── Club, pemain, skuad ──────────────────────────────────────────────────────

export const clubs = sqliteTable("clubs", {
  id: id(),
  adminUserId: text().notNull().unique().references(() => users.id),
  slug: text().notNull().unique(),
  name: text().notNull(),
  nameKey: text().notNull(), // nama dinormalkan untuk cek unik per kota
  city: text().notNull().default("Pekanbaru"),
  area: text({ enum: E.AREA }).notNull(),
  foundedYear: integer(),
  level: text({ enum: E.LEVEL }).notNull(),
  description: text(),
  contactPhone: text(), // hanya untuk Admin platform (PLAN.md pertanyaan 10)
  logoPath: text(),
  crestColor: text().notNull().default("#123b2c"),
  initials: text().notNull(),
  jerseyHome: text().notNull().default("#123b2c"),
  jerseyAway: text().notNull().default("#fbf8f1"),
  registrationStatus: text({ enum: E.STATUS_REGISTRASI }).notNull().default("diajukan"),
  rejectionReason: text(),
  reviewedBy: text().references(() => users.id),
  reviewedAt: waktu(),
  suspendedAt: waktu(),
  suspensionReason: text(),
  squadCode: text().notNull().unique(),
  createdAt: dibuat(),
  updatedAt: dibuat(),
}, (t) => [uniqueIndex("clubs_city_name_key").on(t.city, t.nameKey)]);

export const clubPhotos = sqliteTable("club_photos", {
  id: id(),
  clubId: text().notNull().references(() => clubs.id),
  path: text().notNull(),
  sortOrder: integer().notNull().default(0),
  createdAt: dibuat(),
});

export const players = sqliteTable("players", {
  userId: text().primaryKey().references(() => users.id),
  photoPath: text(),
  position: text({ enum: E.POSISI }),
  dominantFoot: text({ enum: E.KAKI }),
  area: text({ enum: E.AREA }),
  avatarSeed: text().notNull(),
  updatedAt: dibuat(),
});

export const squadMemberships = sqliteTable("squad_memberships", {
  id: id(),
  playerUserId: text().notNull().references(() => users.id),
  clubId: text().notNull().references(() => clubs.id),
  status: text({ enum: E.STATUS_SKUAD }).notNull(),
  via: text({ enum: E.VIA_SKUAD }).notNull(),
  decidedBy: text().references(() => users.id),
  createdAt: dibuat(),
  decidedAt: waktu(),
  endedAt: waktu(),
  endedBy: text({ enum: E.PENGAKHIR_SKUAD }),
}, (t) => [
  // Satu club aktif per pemain (P-02).
  uniqueIndex("squad_satu_aktif").on(t.playerUserId).where(sql`status = 'aktif'`),
  index("squad_club_idx").on(t.clubId, t.status),
]);

export const squadInvites = sqliteTable("squad_invites", {
  id: id(),
  clubId: text().notNull().references(() => clubs.id),
  tokenHash: text().notNull().unique(),
  createdBy: text().notNull().references(() => users.id),
  expiresAt: waktu().notNull(),
  revokedAt: waktu(),
  createdAt: dibuat(),
});

// ── Lapangan ────────────────────────────────────────────────────────────────

export const venues = sqliteTable("venues", {
  id: id(),
  name: text().notNull(),
  address: text().notNull(),
  area: text({ enum: E.AREA }).notNull(),
  lat: real(),
  lng: real(),
  surface: text({ enum: E.PERMUKAAN }).notNull(),
  forFootball: bool().notNull().default(false),
  forMini: bool().notNull().default(false),
  pricePerHour: integer(), // Rupiah
  openHours: text(),
  facilities: text(),
  contact: text(),
  verified: bool().notNull().default(false),
  managedBy: text().references(() => users.id),
  createdAt: dibuat(),
  updatedAt: dibuat(),
});

export const venuePhotos = sqliteTable("venue_photos", {
  id: id(),
  venueId: text().notNull().references(() => venues.id),
  path: text().notNull(),
  sortOrder: integer().notNull().default(0),
});

export const venueSlots = sqliteTable("venue_slots", {
  id: id(),
  venueId: text().notNull().references(() => venues.id),
  dayOfWeek: integer().notNull(), // 0 = Minggu
  startTime: text().notNull(), // HH:mm WIB
  endTime: text().notNull(),
  note: text(),
});

// ── Match ───────────────────────────────────────────────────────────────────

export const matches = sqliteTable("matches", {
  id: id(),
  type: text({ enum: E.TIPE_MATCH }).notNull(),
  format: text({ enum: E.FORMAT }).notNull(),
  status: text({ enum: E.STATUS_MATCH }).notNull().default("draf"),
  creatorClubId: text().notNull().references(() => clubs.id),
  opponentClubId: text().references(() => clubs.id),
  area: text({ enum: E.AREA }).notNull(),
  level: text({ enum: E.LEVEL }).notNull(),
  feeTotal: integer(), // Rupiah, total biaya lapangan
  notes: text(),
  scheduledAt: waktu(), // kick-off terpilih
  venueId: text().references(() => venues.id),
  manualVenueName: text(),
  manualVenueAddress: text(),
  negotiationRound: integer().notNull().default(0),
  responseDeadline: waktu(),
  scorerClubId: text().references(() => clubs.id),
  startedAt: waktu(),
  endedAt: waktu(),
  cancelledByClubId: text().references(() => clubs.id),
  cancelReason: text({ enum: E.ALASAN_BATAL }),
  cancelNote: text(),
  lateCancel: bool().notNull().default(false),
  postponedAt: waktu(),
  rescheduleDeadline: waktu(),
  woWinnerClubId: text().references(() => clubs.id),
  // Skor resmi setelah status Selesai (konfirmasi, tenggat 48 jam, atau keputusan sengketa).
  finalCreatorScore: integer(),
  finalOpponentScore: integer(),
  rematchOf: text(),
  excludedFromRating: bool().notNull().default(false),
  createdBy: text().notNull().references(() => users.id),
  createdAt: dibuat(),
  updatedAt: dibuat(),
}, (t) => [
  index("matches_status_idx").on(t.status),
  index("matches_creator_idx").on(t.creatorClubId),
  index("matches_opponent_idx").on(t.opponentClubId),
]);

export const scheduleProposals = sqliteTable("schedule_proposals", {
  id: id(),
  matchId: text().notNull().references(() => matches.id),
  round: integer().notNull().default(0),
  proposedByClubId: text().notNull().references(() => clubs.id),
  startsAt: waktu().notNull(),
  venueId: text().references(() => venues.id),
  manualVenueName: text(),
  manualVenueAddress: text(),
  feeTotal: integer(),
  status: text({ enum: E.STATUS_USULAN }).notNull().default("menunggu"),
  createdAt: dibuat(),
}, (t) => [index("proposals_match_idx").on(t.matchId)]);

export const matchChangeRequests = sqliteTable("match_change_requests", {
  id: id(),
  matchId: text().notNull().references(() => matches.id),
  kind: text({ enum: E.JENIS_PERUBAHAN }).notNull(),
  requestedByClubId: text().notNull().references(() => clubs.id),
  fromValue: text(),
  toValue: text(),
  reason: text(),
  status: text({ enum: E.STATUS_PERUBAHAN }).notNull().default("menunggu"),
  decidedBy: text().references(() => users.id),
  createdAt: dibuat(),
  decidedAt: waktu(),
});

export const matchReadiness = sqliteTable("match_readiness", {
  matchId: text().notNull().references(() => matches.id),
  clubId: text().notNull().references(() => clubs.id),
  playersReady: integer().notNull().default(0),
  manualOverride: bool().notNull().default(false),
  isReady: bool().notNull().default(false),
  updatedAt: dibuat(),
  updatedBy: text().references(() => users.id),
}, (t) => [primaryKey({ columns: [t.matchId, t.clubId] })]);

export const rsvps = sqliteTable("rsvps", {
  matchId: text().notNull().references(() => matches.id),
  playerUserId: text().notNull().references(() => users.id),
  clubId: text().notNull().references(() => clubs.id),
  answer: text({ enum: E.JAWABAN_RSVP }).notNull(),
  updatedAt: dibuat(),
}, (t) => [primaryKey({ columns: [t.matchId, t.playerUserId] })]);

export const checkins = sqliteTable("checkins", {
  matchId: text().notNull().references(() => matches.id),
  clubId: text().notNull().references(() => clubs.id),
  checkedInAt: waktu().notNull(),
  lat: real(),
  lng: real(),
  byUserId: text().notNull().references(() => users.id),
}, (t) => [primaryKey({ columns: [t.matchId, t.clubId] })]);

export const scoreEntries = sqliteTable("score_entries", {
  id: id(),
  matchId: text().notNull().references(() => matches.id),
  half: integer().notNull(),
  creatorScore: integer().notNull(),
  opponentScore: integer().notNull(),
  event: text({ enum: E.EVENT_SKOR }).notNull(),
  recordedBy: text().notNull().references(() => users.id),
  clientEntryId: text().notNull().unique(), // idempotensi sinkron offline
  recordedAt: waktu().notNull(), // jam perangkat
  syncedAt: dibuat(),
  conflict: bool().notNull().default(false),
}, (t) => [index("score_match_idx").on(t.matchId)]);

export const resultConfirmations = sqliteTable("result_confirmations", {
  id: id(),
  matchId: text().notNull().unique().references(() => matches.id),
  proposerClubId: text().notNull().references(() => clubs.id),
  creatorScore: integer().notNull(),
  opponentScore: integer().notNull(),
  proposedAt: waktu().notNull(),
  deadline: waktu().notNull(),
  response: text({ enum: E.RESPON_HASIL }),
  counterCreatorScore: integer(),
  counterOpponentScore: integer(),
  respondedAt: waktu(),
  remindersSent: integer().notNull().default(0),
});

export const disputes = sqliteTable("disputes", {
  id: id(),
  matchId: text().notNull().unique().references(() => matches.id),
  openedAt: waktu().notNull(),
  evidenceDeadline: waktu().notNull(),
  decision: text({ enum: E.KEPUTUSAN_SENGKETA }),
  finalCreatorScore: integer(),
  finalOpponentScore: integer(),
  reason: text(),
  decidedBy: text().references(() => users.id),
  decidedAt: waktu(),
});

export const disputeEvidence = sqliteTable("dispute_evidence", {
  id: id(),
  disputeId: text().notNull().references(() => disputes.id),
  clubId: text().notNull().references(() => clubs.id),
  note: text(),
  url: text(), // tautan, bukan unggahan (PLAN.md butir 8)
  createdAt: dibuat(),
});

export const reviews = sqliteTable("reviews", {
  id: id(),
  matchId: text().notNull().references(() => matches.id),
  reviewerClubId: text().notNull().references(() => clubs.id),
  reviewedClubId: text().notNull().references(() => clubs.id),
  sportsmanship: integer().notNull(),
  tidiness: integer().notNull(),
  comment: text(),
  excluded: bool().notNull().default(false),
  createdAt: dibuat(),
}, (t) => [uniqueIndex("reviews_match_reviewer").on(t.matchId, t.reviewerClubId)]);

export const clubRatings = sqliteTable("club_ratings", {
  clubId: text().notNull().references(() => clubs.id),
  format: text({ enum: E.FORMAT }).notNull(),
  rating: integer().notNull().default(1200),
  confirmedMatches: integer().notNull().default(0),
}, (t) => [primaryKey({ columns: [t.clubId, t.format] })]);

export const ratingHistory = sqliteTable("rating_history", {
  id: id(),
  clubId: text().notNull().references(() => clubs.id),
  format: text({ enum: E.FORMAT }).notNull(),
  matchId: text().notNull().references(() => matches.id),
  ratingBefore: integer().notNull(),
  ratingAfter: integer().notNull(),
  delta: integer().notNull(),
  createdAt: dibuat(),
});

// ── Komunikasi, notifikasi, platform ────────────────────────────────────────

export const chatMessages = sqliteTable("chat_messages", {
  id: id(),
  matchId: text().notNull().references(() => matches.id),
  senderUserId: text().references(() => users.id), // null = pesan sistem
  kind: text({ enum: E.JENIS_PESAN }).notNull(),
  body: text().notNull(),
  lat: real(),
  lng: real(),
  hiddenByModerator: bool().notNull().default(false),
  createdAt: dibuat(),
}, (t) => [index("chat_match_idx").on(t.matchId, t.createdAt)]);

export const clubBlocks = sqliteTable("club_blocks", {
  blockerClubId: text().notNull().references(() => clubs.id),
  blockedClubId: text().notNull().references(() => clubs.id),
  createdAt: dibuat(),
}, (t) => [primaryKey({ columns: [t.blockerClubId, t.blockedClubId] })]);

export const reports = sqliteTable("reports", {
  id: id(),
  reporterUserId: text().notNull().references(() => users.id),
  targetType: text({ enum: E.TARGET_LAPORAN }).notNull(),
  targetId: text().notNull(),
  reason: text().notNull(),
  status: text({ enum: E.STATUS_LAPORAN }).notNull().default("terbuka"),
  resolvedBy: text().references(() => users.id),
  resolution: text(),
  createdAt: dibuat(),
  resolvedAt: waktu(),
});

export const notifications = sqliteTable("notifications", {
  id: id(),
  userId: text().notNull().references(() => users.id),
  trigger: text().notNull(),
  title: text().notNull(),
  body: text(),
  url: text(),
  readAt: waktu(),
  createdAt: dibuat(),
}, (t) => [index("notifications_user_idx").on(t.userId, t.createdAt)]);

export const notificationDeliveries = sqliteTable("notification_deliveries", {
  id: id(),
  notificationId: text().notNull().references(() => notifications.id),
  channel: text({ enum: E.KANAL }).notNull(),
  status: text({ enum: E.STATUS_KIRIM }).notNull().default("menunggu"),
  error: text(),
  sentAt: waktu(),
});

export const pushSubscriptions = sqliteTable("push_subscriptions", {
  id: id(),
  userId: text().notNull().references(() => users.id),
  sessionId: text().notNull().references(() => sessions.id),
  endpoint: text().notNull().unique(),
  p256dh: text().notNull(),
  auth: text().notNull(),
  createdAt: dibuat(),
});

export const notificationPrefs = sqliteTable("notification_prefs", {
  userId: text().primaryKey().references(() => users.id),
  pushEnabled: bool().notNull().default(true),
  quietStart: text(), // HH:mm WIB
  quietEnd: text(),
  muteReminders: bool().notNull().default(false),
});

export const reminderLog = sqliteTable("reminder_log", {
  matchId: text().notNull().references(() => matches.id),
  userId: text().notNull().references(() => users.id),
  kind: text({ enum: E.JENIS_PENGINGAT }).notNull(),
  sentAt: dibuat(),
}, (t) => [primaryKey({ columns: [t.matchId, t.userId, t.kind] })]);

export const moderationFlags = sqliteTable("moderation_flags", {
  id: id(),
  kind: text({ enum: E.JENIS_FLAG }).notNull(),
  clubId: text().references(() => clubs.id),
  otherClubId: text().references(() => clubs.id),
  matchId: text().references(() => matches.id),
  detail: text(),
  status: text({ enum: E.STATUS_FLAG }).notNull().default("terbuka"),
  resolvedBy: text().references(() => users.id),
  createdAt: dibuat(),
  resolvedAt: waktu(),
});

export const auditLogs = sqliteTable("audit_logs", {
  id: id(),
  actorUserId: text().references(() => users.id),
  action: text().notNull(),
  targetType: text().notNull(),
  targetId: text(),
  reason: text(),
  detail: text(),
  createdAt: dibuat(),
}, (t) => [index("audit_created_idx").on(t.createdAt)]);

export const platformSettings = sqliteTable("platform_settings", {
  key: text().primaryKey(),
  value: text().notNull(),
  updatedBy: text().references(() => users.id),
  updatedAt: dibuat(),
});
