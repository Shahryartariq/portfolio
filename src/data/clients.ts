export type Client = {
  slug: string;
  name: string;
  stack: string[];
  text: string;
  /** Public site, if there is one. Internal tools have none. */
  href?: string;
};

export const clients: Client[] = [
  {
    slug: "srb",
    name: "Shariyah Review Bureau",
    stack: ["Vue", "Rust (Actix)", "Microsoft Graph", "MongoDB"],
    text: "Secure legal workflows: REST APIs for structured document generation and digital signatures, fine-grained access control lists and PII protection in the admin and review screens. Deployed with Jenkins, Docker and Podman on DigitalOcean.",
    href: "https://shariyah.net/",
  },
  {
    slug: "lc",
    name: "LC Management",
    stack: ["Rust (Actix)", "PostgreSQL", "HTML/CSS"],
    text: "Letters of credit for a trade-finance team: issuing bank, currency and the rest of each LC in one place, and the trade documents printed as PDFs, from airway bills and bills of lading to beneficiary certificates.",
  },
  {
    slug: "icsi",
    name: "ICSI",
    stack: ["WordPress", "Elementor"],
    text: "Website for a fertility clinic in Islamabad and Multan, with a page for each treatment, success rates and an appointment request form.",
    href: "https://icsi.com.pk/",
  },
];
