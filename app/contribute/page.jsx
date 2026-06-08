"use client";

import { useEffect, useRef, useState } from "react";

// Where the FastAPI intake service lives. Override at build time with
// NEXT_PUBLIC_INTAKE_API_URL; defaults to a local dev server.
const API = (process.env.NEXT_PUBLIC_INTAKE_API_URL || "http://localhost:8000").replace(/\/$/, "");

// Fallback taxonomy so the form still renders if /taxonomy can't be reached.
// The backend is the source of truth; this just keeps the page usable offline.
const FALLBACK = {
  categories: ["Agriculture", "Local Economics", "History", "Journalism", "Fiction",
    "Academic Paper", "Law & Policy", "Health", "Other"],
  languages: ["English", "Pidgin", "Hausa", "Yoruba", "Igbo",
    "Ebira", "Igala", "Nupe", "Jaba", "Multilingual Code-Switching", "Other"],
  regions: ["North-Central", "North-East", "North-West", "South-East",
    "South-South", "South-West", "Diaspora"],
  limits: { ".pdf": 52428800, ".docx": 26214400, ".txt": 5242880, ".md": 5242880 },
};

function extOf(name) {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i).toLowerCase();
}

function prettyBytes(n) {
  return n >= 1024 * 1024 ? `${Math.round(n / (1024 * 1024))} MB` : `${Math.round(n / 1024)} KB`;
}

// SHA-256 of the file, hex — for content-addressed keys + exact-duplicate dedup.
async function sha256Hex(file) {
  const buf = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function ContributePage() {
  const [tax, setTax] = useState(FALLBACK);
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState("");
  const [language, setLanguage] = useState("");
  const [region, setRegion] = useState("");
  const [email, setEmail] = useState("");
  const [license, setLicense] = useState(false);
  // status: idle | hashing | requesting | uploading | done | error
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/taxonomy`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setTax)
      .catch(() => {/* keep FALLBACK */});
  }, []);

  const busy = status === "hashing" || status === "requesting" || status === "uploading";
  const limits = tax.limits || FALLBACK.limits;
  const allowed = Object.keys(limits);

  // Open the OS file picker (drop zone is clickable / keyboard-activatable).
  function openPicker() {
    if (!busy) fileInputRef.current?.click();
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    if (busy) return;
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) setFile(dropped);
  }

  function localValidate() {
    if (!file) return "Choose a file to upload.";
    const ext = extOf(file.name);
    if (!allowed.includes(ext)) return `Unsupported type ${ext || "(none)"}. Allowed: ${allowed.join(", ")}.`;
    if (file.size > limits[ext]) return `${ext} files are capped at ${prettyBytes(limits[ext])}.`;
    if (!category || !language || !region) return "Please tag category, language, and region.";
    if (!license) return "Please confirm you have the right to share this file.";
    return null;
  }

  async function onSubmit(e) {
    e.preventDefault();
    const err = localValidate();
    if (err) { setStatus("error"); setMessage(err); return; }

    try {
      setStatus("hashing"); setMessage("Fingerprinting file…");
      const sha256 = await sha256Hex(file);

      setStatus("requesting"); setMessage("Requesting upload ticket…");
      const presignRes = await fetch(`${API}/uploads/presign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          content_type: file.type || null,
          size: file.size,
          sha256,
          category, language, region,
          contributor_email: email || null,
          license_accepted: license,
        }),
      });
      if (!presignRes.ok) {
        const body = await presignRes.json().catch(() => ({}));
        throw new Error(body.detail || `Upload request failed (${presignRes.status}).`);
      }
      const ticket = await presignRes.json();

      // Dry-run backend returns a stub ticket (no real bucket); skip the S3 POST
      // so the flow can be tested end-to-end without AWS.
      if (!ticket.fields?.["x-dry-run"]) {
        setStatus("uploading"); setMessage("Uploading to secure storage…");
        const form = new FormData();
        Object.entries(ticket.fields).forEach(([k, v]) => form.append(k, v));
        form.append("file", file);
        const s3Res = await fetch(ticket.url, { method: "POST", body: form });
        if (!s3Res.ok) throw new Error(`Storage upload failed (${s3Res.status}).`);
      }

      await fetch(`${API}/uploads/${ticket.upload_id}/complete`, { method: "POST" });

      setStatus("done");
      setMessage("Thank you — your submission was received and will be reviewed.");
      setFile(null); setCategory(""); setLanguage(""); setRegion(""); setEmail(""); setLicense(false);
      e.target.reset();
    } catch (err) {
      setStatus("error");
      setMessage(err.message || "Something went wrong. Please try again.");
    }
  }

  return (
    <div className="md intake">
      <h1>Contribute Data</h1>
      <p>
        Help build lokoLM&rsquo;s training corpus. Upload academic papers, journalism,
        local history, fiction, or other Nigerian-context text. Files go straight to
        secure storage — we never see them in transit — and personal information is
        stripped before any text enters the corpus.
      </p>

      <form className="intake-form" onSubmit={onSubmit}>
        <div className="intake-field">
          <span>File <em>({allowed.join(", ")})</em></span>
          <div
            className={`intake-drop${dragOver ? " is-over" : ""}${busy ? " is-disabled" : ""}`}
            role="button"
            tabIndex={busy ? -1 : 0}
            aria-disabled={busy}
            onClick={openPicker}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openPicker(); }
            }}
            onDragOver={(e) => { e.preventDefault(); if (!busy) setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            {/* Hidden native input — the styled zone above drives it. */}
            <input
              ref={fileInputRef}
              type="file"
              accept={allowed.join(",")}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={busy}
              hidden
            />
            {file ? (
              <div className="intake-drop-file">
                <strong>{file.name}</strong>
                <small className="intake-hint">{prettyBytes(file.size)} — click or drop to replace</small>
              </div>
            ) : (
              <div className="intake-drop-prompt">
                <span className="intake-drop-icon" aria-hidden="true">⬆</span>
                <span><strong>Drag &amp; drop</strong> a file here, or <span className="intake-drop-link">browse</span></span>
              </div>
            )}
          </div>
        </div>

        <div className="intake-row">
          <label className="intake-field">
            <span>Category</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)} disabled={busy}>
              <option value="">Select…</option>
              {tax.categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="intake-field">
            <span>Language / Dialect</span>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} disabled={busy}>
              <option value="">Select…</option>
              {tax.languages.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </label>
          <label className="intake-field">
            <span>Region</span>
            <select value={region} onChange={(e) => setRegion(e.target.value)} disabled={busy}>
              <option value="">Select…</option>
              {tax.regions.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
        </div>

        <label className="intake-field">
          <span>Email <em>(optional — for contributor credit)</em></span>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
          />
        </label>

        <label className="intake-check">
          <input
            type="checkbox"
            checked={license}
            onChange={(e) => setLicense(e.target.checked)}
            disabled={busy}
          />
          <span>
            I confirm I have the right to share this text for research and model
            training, and I understand personal information will be redacted.
          </span>
        </label>

        <button type="submit" className="intake-submit" disabled={busy}>
          {busy ? "Working…" : "Submit contribution"}
        </button>

        {message && (
          <p className={`intake-status intake-status-${status}`} role="status">
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
