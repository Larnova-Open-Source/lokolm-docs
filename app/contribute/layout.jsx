// Server component wrapper so we can set page metadata; the form itself is a
// client component (page.jsx).
export const metadata = {
  title: "lokoLM — Contribute Data",
  description:
    "Upload text, PDFs, and documents to help build the lokoLM training corpus.",
};

export default function ContributeLayout({ children }) {
  return children;
}
