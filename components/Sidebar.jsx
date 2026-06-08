"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DOCS, EXTRA_LINKS } from "../lib/docs-meta.js";

// Drop a trailing slash (except for root) so "/training/" matches "/training".
function normalize(path) {
  if (!path) return "/";
  return path !== "/" && path.endsWith("/") ? path.slice(0, -1) : path;
}

export default function Sidebar() {
  const current = normalize(usePathname());
  const [open, setOpen] = useState(false);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [current]);

  return (
    <>
      {/* Mobile top bar (hidden on desktop) */}
      <header className="topbar">
        <button
          type="button"
          className="menu-btn"
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
        <div className="topbar-brand">
          <img src="/logo.png" alt="" className="brand-logo" width={24} height={24} />
          loko<span>LM</span>
        </div>
      </header>

      {/* Backdrop behind the open drawer (mobile only) */}
      <div
        className={`nav-backdrop ${open ? "open" : ""}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      <nav className={open ? "open" : ""}>
        <div className="brand">
          <img src="/logo.png" alt="lokoLM logo" className="brand-logo" width={28} height={28} />
          <span className="brand-name">loko<span>LM</span></span>
        </div>
        <div className="tag">decoder-only transformer</div>
        <div className="doc-switch">
          {DOCS.map((doc) => {
            const href = normalize(doc.href);
            const active =
              href === "/" ? current === "/" : current === href || current.startsWith(href + "/");
            return (
              <Link
                key={doc.slug}
                href={doc.href}
                className={active ? "active" : ""}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                {doc.label}
              </Link>
            );
          })}
        </div>
        <div className="doc-switch doc-switch-extra">
          {EXTRA_LINKS.map((link) => {
            const href = normalize(link.href);
            const active = current === href || current.startsWith(href + "/");
            return (
              <Link
                key={link.slug}
                href={link.href}
                className={active ? "active" : ""}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
