import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readFileSync, writeFileSync, chmodSync } from "node:fs";
import {
  randomBytes,
  createCipheriv,
  createDecipheriv,
  createHash,
} from "node:crypto";
import path from "node:path";

export const hash = (value) => createHash("sha256").update(value).digest("hex");

export function createStore(dataDir) {
  mkdirSync(dataDir, { recursive: true, mode: 0o700 });
  chmodSync(dataDir, 0o700);
  const keyPath = path.join(dataDir, "token.key");
  try {
    writeFileSync(keyPath, randomBytes(32), { flag: "wx", mode: 0o600 });
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
  }
  chmodSync(keyPath, 0o600);
  const key = readFileSync(keyPath);
  if (key.length !== 32) throw new Error("Invalid token encryption key.");
  const dbPath = path.join(dataDir, "sortify.sqlite");
  const db = new DatabaseSync(dbPath);
  chmodSync(dbPath, 0o600);
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY, payload TEXT NOT NULL, expires INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS listens (
      user_id TEXT NOT NULL, id TEXT NOT NULL, payload TEXT NOT NULL,
      timestamp TEXT NOT NULL, PRIMARY KEY (user_id, id)
    );
    CREATE INDEX IF NOT EXISTS listens_by_user ON listens(user_id, timestamp);
  `);
  function encrypt(value) {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    const body = Buffer.concat([
      cipher.update(JSON.stringify(value)),
      cipher.final(),
    ]);
    return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64");
  }
  function decrypt(value) {
    const bytes = Buffer.from(value, "base64");
    const cipher = createDecipheriv("aes-256-gcm", key, bytes.subarray(0, 12));
    cipher.setAuthTag(bytes.subarray(12, 28));
    return JSON.parse(
      Buffer.concat([cipher.update(bytes.subarray(28)), cipher.final()]),
    );
  }
  return {
    getSession(id) {
      const row = db
        .prepare("SELECT payload, expires FROM sessions WHERE id = ?")
        .get(hash(id));
      if (!row || row.expires <= Date.now()) return null;
      return decrypt(row.payload);
    },
    putSession(id, session) {
      db.prepare("INSERT OR REPLACE INTO sessions VALUES (?, ?, ?)").run(
        hash(id),
        encrypt(session),
        session.expires,
      );
    },
    deleteSession(id) {
      db.prepare("DELETE FROM sessions WHERE id = ?").run(hash(id));
    },
    prune() {
      db.prepare("DELETE FROM sessions WHERE expires <= ?").run(Date.now());
    },
    addListen(userId, listen) {
      db.prepare("INSERT OR IGNORE INTO listens VALUES (?, ?, ?, ?)").run(
        userId,
        listen.id,
        JSON.stringify(listen),
        listen.timestamp,
      );
      return JSON.parse(
        db
          .prepare("SELECT payload FROM listens WHERE user_id = ? AND id = ?")
          .get(userId, listen.id).payload,
      );
    },
    getListens(userId) {
      return db
        .prepare(
          "SELECT payload FROM listens WHERE user_id = ? ORDER BY timestamp, id",
        )
        .all(userId)
        .map((row) => JSON.parse(row.payload));
    },
    close() {
      db.close();
    },
  };
}
