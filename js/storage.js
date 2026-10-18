/**
 * CTDSTN Certificate Verification - Data Storage Layer
 *
 * IMPORTANT (DEMO ONLY): All data is persisted in browser localStorage.
 * This is a frontend-only demonstration. Anyone with access to the browser
 * can read, modify, or delete the data. Do NOT use localStorage for real
 * certificate records or authentication in production. Use a secure backend
 * with hashed passwords, authorization middleware, and a real database.
 */

const STORAGE_KEYS = {
  CERTIFICATES: "ctdstn_certificates",
  ANALYTICS: "ctdstn_analytics",
};

const DEMO_ADMIN = { username: "admin", password: "admin123" };

const SEED_CERTIFICATES = [
  {
    id: "CERT-1001",
    certificateNumber: "CTDSTN-2024-1001",
    name: "Alice Johnson",
    course: "Advanced Web Development",
    institution: "CTDSTN Institute",
    issueDate: "2024-01-15",
    expiryDate: "2025-01-15",
    status: "active",
    grade: "A+",
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z",
  },
  {
    id: "CERT-1002",
    certificateNumber: "CTDSTN-2024-1002",
    name: "Bob Smith",
    course: "Data Science Fundamentals",
    institution: "CTDSTN Institute",
    issueDate: "2024-03-10",
    expiryDate: "2025-03-10",
    status: "active",
    grade: "A",
    createdAt: "2024-03-10T10:30:00Z",
    updatedAt: "2024-03-10T10:30:00Z",
  },
  {
    id: "CERT-1003",
    certificateNumber: "CTDSTN-2023-1003",
    name: "Carol Lee",
    course: "Cybersecurity Essentials",
    institution: "CTDSTN Institute",
    issueDate: "2023-06-20",
    expiryDate: "2024-06-20",
    status: "expired",
    grade: "B+",
    createdAt: "2023-06-20T11:00:00Z",
    updatedAt: "2023-06-20T11:00:00Z",
  },
  {
    id: "CERT-1004",
    certificateNumber: "CTDSTN-2024-1004",
    name: "David Kim",
    course: "Project Management Professional",
    institution: "CTDSTN Institute",
    issueDate: "2024-02-05",
    expiryDate: "2025-02-05",
    status: "revoked",
    grade: "C",
    createdAt: "2024-02-05T14:00:00Z",
    updatedAt: "2024-02-05T14:00:00Z",
  },
  {
    id: "CERT-1005",
    certificateNumber: "CTDSTN-2024-1005",
    name: "Eva Martinez",
    course: "Digital Marketing",
    institution: "CTDSTN Institute",
    issueDate: "2024-05-12",
    expiryDate: "2025-05-12",
    status: "active",
    grade: "A-",
    createdAt: "2024-05-12T16:45:00Z",
    updatedAt: "2024-05-12T16:45:00Z",
  },
];

let localStorageAvailable = true;

function _safeRead(key, def) {
  try {
    if (!localStorageAvailable) return def;
    const raw = localStorage.getItem(key);
    return raw === null ? def : JSON.parse(raw);
  } catch (e) {
    localStorageAvailable = false;
    console.warn("localStorage read failed, falling back to memory:", e);
    return def;
  }
}

function _safeWrite(key, value) {
  try {
    if (!localStorageAvailable) return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    localStorageAvailable = false;
    console.warn("localStorage write failed, falling back to memory:", e);
  }
}

// In-memory fallback if localStorage is unavailable
let memoryCertificates = null;
let memoryAnalytics = null;

function _read(key, def) {
  if (key === STORAGE_KEYS.CERTIFICATES) {
    if (memoryCertificates !== null) return memoryCertificates.slice();
    const val = _safeRead(key, def);
    memoryCertificates = val === def ? [] : val;
    return memoryCertificates.slice();
  }
  if (key === STORAGE_KEYS.ANALYTICS) {
    if (memoryAnalytics !== null) return memoryAnalytics;
    const val = _safeRead(key, def);
    memoryAnalytics = val;
    return val;
  }
  return _safeRead(key, def);
}

function _write(key, value) {
  if (key === STORAGE_KEYS.CERTIFICATES) {
    memoryCertificates = value.slice();
  }
  if (key === STORAGE_KEYS.ANALYTICS) {
    memoryAnalytics = value;
  }
  _safeWrite(key, value);
}

function _ensureSeeded() {
  try {
    // Check raw localStorage directly (before memory-fallback conversion)
    const rawCerts = _safeRead(STORAGE_KEYS.CERTIFICATES, null);
    if (rawCerts === null) {
      _write(STORAGE_KEYS.CERTIFICATES, SEED_CERTIFICATES);
    }
    const rawAnalytics = _safeRead(STORAGE_KEYS.ANALYTICS, null);
    if (rawAnalytics === null) {
      _write(STORAGE_KEYS.ANALYTICS, {
        visits: 0,
        verifications: { total: 0, success: 0, failed: 0 },
        daily: [],
      });
    }
  } catch (e) {
    console.error("Storage seeding failed:", e);
  }
}

// Initialize storage on load (never throws)
_ensureSeeded();

const storage = {
  DEMO_ADMIN,
  localStorageAvailable() {
    return localStorageAvailable;
  },

  getCertificates() {
    try {
      return _read(STORAGE_KEYS.CERTIFICATES, []).slice();
    } catch (e) {
      console.error("getCertificates failed:", e);
      return [];
    }
  },

  saveCertificates(list) {
    try {
      _write(STORAGE_KEYS.CERTIFICATES, list);
    } catch (e) {
      console.error("saveCertificates failed:", e);
    }
  },

  findCertificate(number) {
    try {
      const list = this.getCertificates();
      const norm = String(number).trim().toUpperCase();
      return (
        list.find((c) => String(c.certificateNumber).trim().toUpperCase() === norm) ||
        null
      );
    } catch (e) {
      console.error("findCertificate failed:", e);
      return null;
    }
  },

  addCertificate(data) {
    try {
      const list = this.getCertificates();
      const exists = list.some(
        (c) =>
          String(c.certificateNumber).trim().toUpperCase() ===
          String(data.certificateNumber).trim().toUpperCase()
      );
      if (exists) {
        return { ok: false, error: "Duplicate certificate number" };
      }
      const now = new Date().toISOString();
      const cert = {
        id: "CERT-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
        certificateNumber: data.certificateNumber.trim(),
        name: data.name.trim(),
        course: data.course.trim(),
        institution: data.institution.trim(),
        issueDate: data.issueDate,
        expiryDate: data.expiryDate,
        status: data.status || "active",
        grade: (data.grade || "").trim(),
        createdAt: now,
        updatedAt: now,
      };
      list.push(cert);
      this.saveCertificates(list);
      return { ok: true, certificate: cert };
    } catch (e) {
      console.error("addCertificate failed:", e);
      return { ok: false, error: "Storage error" };
    }
  },

  updateCertificate(id, data) {
    try {
      const list = this.getCertificates();
      const idx = list.findIndex((c) => c.id === id);
      if (idx === -1) {
        return { ok: false, error: "Not found" };
      }
      const dup = list.some(
        (c) =>
          c.id !== id &&
          String(c.certificateNumber).trim().toUpperCase() ===
            String(data.certificateNumber).trim().toUpperCase()
      );
      if (dup) {
        return { ok: false, error: "Duplicate certificate number" };
      }
      const now = new Date().toISOString();
      list[idx] = { ...list[idx], ...data, updatedAt: now, id: list[idx].id };
      this.saveCertificates(list);
      return { ok: true, certificate: list[idx] };
    } catch (e) {
      console.error("updateCertificate failed:", e);
      return { ok: false, error: "Storage error" };
    }
  },

  deleteCertificate(id) {
    try {
      const list = this.getCertificates();
      const filtered = list.filter((c) => c.id !== id);
      if (filtered.length === list.length) {
        return { ok: false, error: "Not found" };
      }
      this.saveCertificates(filtered);
      return { ok: true };
    } catch (e) {
      console.error("deleteCertificate failed:", e);
      return { ok: false, error: "Storage error" };
    }
  },

  /* Analytics */
  getAnalytics() {
    try {
      return _read(STORAGE_KEYS.ANALYTICS, {
        visits: 0,
        verifications: { total: 0, success: 0, failed: 0 },
        daily: [],
      });
    } catch (e) {
      console.error("getAnalytics failed:", e);
      return {
        visits: 0,
        verifications: { total: 0, success: 0, failed: 0 },
        daily: [],
      };
    }
  },

  saveAnalytics(a) {
    try {
      _write(STORAGE_KEYS.ANALYTICS, a);
    } catch (e) {
      console.error("saveAnalytics failed:", e);
    }
  },

  recordVisit() {
    try {
      const a = this.getAnalytics();
      a.visits += 1;
      const today = new Date().toISOString().slice(0, 10);
      let day = a.daily.find((d) => d.date === today);
      if (!day) {
        day = { date: today, visits: 0, success: 0, failed: 0 };
        a.daily.push(day);
      }
      day.visits += 1;
      this.saveAnalytics(a);
      return a;
    } catch (e) {
      console.error("recordVisit failed:", e);
      return this.getAnalytics();
    }
  },

  recordVerification(success) {
    try {
      const a = this.getAnalytics();
      a.verifications.total += 1;
      if (success) {
        a.verifications.success += 1;
      } else {
        a.verifications.failed += 1;
      }
      const today = new Date().toISOString().slice(0, 10);
      let day = a.daily.find((d) => d.date === today);
      if (!day) {
        day = { date: today, visits: 0, success: 0, failed: 0 };
        a.daily.push(day);
      }
      if (success) {
        day.success += 1;
      } else {
        day.failed += 1;
      }
      this.saveAnalytics(a);
      return a;
    } catch (e) {
      console.error("recordVerification failed:", e);
      return this.getAnalytics();
    }
  },

  getDashboardStats() {
    try {
      const certs = this.getCertificates();
      const now = new Date();
      const active = certs.filter(
        (c) => c.status === "active" && (!c.expiryDate || new Date(c.expiryDate) >= now)
      ).length;
      const a = this.getAnalytics();
      return {
        total: certs.length,
        active,
        attempts: a.verifications.total,
        visits: a.visits,
      };
    } catch (e) {
      console.error("getDashboardStats failed:", e);
      return { total: 0, active: 0, attempts: 0, visits: 0 };
    }
  },

  exportCertificates() {
    return this.getCertificates();
  },

  importCertificates(list) {
    try {
      const current = this.getCertificates();
      const results = { imported: 0, skipped: [], errors: [] };
      const now = new Date().toISOString();

      for (const item of list) {
        if (!item.certificateNumber || !item.name) {
          results.errors.push(item.certificateNumber || "(unknown)");
          continue;
        }
        const exists = current.some(
          (c) =>
            String(c.certificateNumber).trim().toUpperCase() ===
            String(item.certificateNumber).trim().toUpperCase()
        );
        if (exists) {
          results.skipped.push(item.certificateNumber);
          continue;
        }
        current.push({
          id: "CERT-" + Date.now() + "-" + Math.floor(Math.random() * 10000),
          certificateNumber: String(item.certificateNumber).trim(),
          name: String(item.name).trim(),
          course: String(item.course || "").trim(),
          institution: String(item.institution || "").trim(),
          issueDate: item.issueDate || "",
          expiryDate: item.expiryDate || "",
          status: item.status || "active",
          grade: String(item.grade || "").trim(),
          createdAt: now,
          updatedAt: now,
        });
        results.imported++;
      }

      this.saveCertificates(current);
      return results;
    } catch (e) {
      console.error("importCertificates failed:", e);
      return { imported: 0, skipped: [], errors: ["Storage error"] };
    }
  },

  resetAll() {
    try {
      localStorage.removeItem(STORAGE_KEYS.CERTIFICATES);
      localStorage.removeItem(STORAGE_KEYS.ANALYTICS);
      memoryCertificates = null;
      memoryAnalytics = null;
      _ensureSeeded();
    } catch (e) {
      console.error("resetAll failed:", e);
    }
  },
};
