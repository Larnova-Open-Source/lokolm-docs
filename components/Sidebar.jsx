"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DOCS } from "../lib/docs-meta.js";

// Drop a trailing slash (except for root) so "/training/" matches "/training".
function normalize(path) {
  if (!path) return "/";
  return path !== "/" && path.endsWith("/") ? path.slice(0, -1) : path;
}

export default function Sidebar() {
  const current = normalize(usePathname());

  return (
    <nav>
      <div className="brand">
        loko<span>LM</span>
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
            >
              {doc.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
