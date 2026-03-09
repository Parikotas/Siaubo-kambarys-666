import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("reservations.db");

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    participants INTEGER NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS locks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    expiresAt DATETIME NOT NULL
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Clean up expired locks
  const cleanupLocks = () => {
    db.prepare("DELETE FROM locks WHERE expiresAt < datetime('now')").run();
  };

  // API Routes
  app.get("/api/availability", (req, res) => {
    cleanupLocks();
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: "Date is required" });

    const reserved = db.prepare("SELECT time FROM reservations WHERE date = ?").all(date) as { time: string }[];
    const locked = db.prepare("SELECT time FROM locks WHERE date = ?").all(date) as { time: string }[];

    const busyTimes = [...reserved.map(r => r.time), ...locked.map(l => l.time)];
    
    // Standard times for the escape room
    const allTimes = ["12:00", "14:00", "16:00", "18:00", "20:00", "22:00"];
    
    const availability = allTimes.map(time => ({
      time,
      available: !busyTimes.includes(time)
    }));

    res.json(availability);
  });

  app.get("/api/fully-booked-dates", (req, res) => {
    cleanupLocks();
    const allTimes = ["12:00", "14:00", "16:00", "18:00", "20:00", "22:00"];
    const count = allTimes.length;

    const bookedDates = db.prepare(`
      SELECT date FROM (
        SELECT date, COUNT(*) as count FROM (
          SELECT date, time FROM reservations
          UNION ALL
          SELECT date, time FROM locks
        ) GROUP BY date
      ) WHERE count >= ?
    `).all(count) as { date: string }[];

    res.json(bookedDates.map(d => d.date));
  });

  app.post("/api/lock", (req, res) => {
    cleanupLocks();
    const { date, time } = req.body;
    
    // Check if already reserved or locked
    const existingRes = db.prepare("SELECT id FROM reservations WHERE date = ? AND time = ?").get(date, time);
    const existingLock = db.prepare("SELECT id FROM locks WHERE date = ? AND time = ?").get(date, time);

    if (existingRes || existingLock) {
      return res.status(409).json({ error: "Time is no longer available" });
    }

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    db.prepare("INSERT INTO locks (date, time, expiresAt) VALUES (?, ?, ?)").run(date, time, expiresAt);

    res.json({ success: true, expiresAt });
  });

  app.post("/api/reserve", (req, res) => {
    const { date, time, firstName, lastName, email, phone, participants } = req.body;

    try {
      // Final check
      const existingRes = db.prepare("SELECT id FROM reservations WHERE date = ? AND time = ?").get(date, time);
      if (existingRes) {
        return res.status(409).json({ error: "Time is already reserved" });
      }

      // Insert reservation
      db.prepare(`
        INSERT INTO reservations (date, time, firstName, lastName, email, phone, participants)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(date, time, firstName, lastName, email, phone, participants);

      // Remove lock if exists
      db.prepare("DELETE FROM locks WHERE date = ? AND time = ?").run(date, time);

      // In a real app, you'd send emails here
      console.log(`Reservation confirmed for ${firstName} ${lastName} on ${date} at ${time}`);
      console.log(`Sending email to administrator and ${email}...`);

      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
