/**
 * In-memory session store scoped to the Node.js process.
 * For production, swap this with Redis or a DB.
 */

import { DesignSession } from "./types";

const sessions = new Map<string, DesignSession>();

export function saveSession(session: DesignSession) {
  sessions.set(session.id, session);
}

export function getSession(id: string): DesignSession | undefined {
  return sessions.get(id);
}
