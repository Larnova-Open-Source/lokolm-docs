// Documentation set — pure metadata, safe to import in client components.
// Add a Markdown file under content/ and an entry here, and it appears in the nav.
export const DOCS = [
  { slug: "overview", label: "Overview",     href: "/",         file: "overview.md" },
  { slug: "training",  label: "Training", href: "/training",  file: "training.md"  },
  { slug: "colab",     label: "Train on Colab", href: "/colab",   file: "colab.md"     },
  { slug: "inference", label: "Inference",    href: "/inference", file: "inference.md" },
  { slug: "roadmap",   label: "Roadmap (v2)", href: "/roadmap",   file: "roadmap.md"   },
];

export const HOME_SLUG = "overview";

// Standalone app routes that are NOT Markdown docs (they have their own page.jsx
// under app/). Listed separately so the [slug] route's generateStaticParams never
// tries to render them as Markdown, while the sidebar still links to them.
export const EXTRA_LINKS = [
  { slug: "contribute", label: "Contribute Data", href: "/contribute" },
];
