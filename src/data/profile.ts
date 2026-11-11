export const profile = {
  name: "Muhammad Shehryar Tariq",
  shortName: "Shehryar",
  initials: "MST",
  role: "Full-stack engineer",
  location: "Islamabad, Pakistan",
  email: "shahryartariq57@gmail.com",
  siteUrl: process.env.SITE_URL ?? "https://shehryartariq.vercel.app",
  lede:
    "I build web apps in TypeScript and Rust: Bitcoin wallet tools, auth systems, document workflows for banks and legal teams. Everything I ship has tests, CI and a live URL.",
  links: {
    github: "https://github.com/Shahryartariq",
    linkedin: "https://www.linkedin.com/in/muhammadshehryartariq/",
    x: "https://x.com/M_Shehryartariq",
  },
} as const;

export const about = {
  paragraphs: [
    "I started writing software at the University of Sargodha, where my final-year project was an e-voting system on a blockchain. I went on to an MS in Cyber Security at FAST NUCES, Islamabad, and finished with a gold medal and a thesis on smart contracts for secure federated learning.",
    "Since then I have built legal and trade-finance tools in Rust and Vue, Web3 frontends for Substrate and Bitcoin, and a Next.js monorepo used by several teams. On the side I have finished more than 100 freelance projects on Fiverr and Upwork.",
    "Security is the thread through all of it. I like access control that is hard to get wrong, inputs that are validated at the edge, and deploys that are boring.",
  ],
  education: [
    {
      degree: "MS in Cyber Security",
      school: "FAST NUCES, Islamabad",
      years: "2022 to 2024",
      note: "Gold medal. Thesis: Smart contract for secure federated learning.",
    },
    {
      degree: "BS in Software Engineering",
      school: "University of Sargodha",
      years: "2018 to 2022",
      note: "Silver medal. Final-year project: public and private e-voting on a blockchain.",
    },
  ],
  certifications: [
    "Next.js 15 & React: The Complete Guide (Udemy)",
    "Git and GitHub (Google)",
    "DevOps and Jenkins Fundamentals (LearnKartS)",
  ],
  community: [
    "Director Projects, FAST Blockchain Society",
    "Member, FAST Cyber Security Society",
  ],
  stack: [
    { group: "Languages", items: ["TypeScript", "JavaScript", "Rust", "Python", "C++", "Bash"] },
    { group: "Frontend", items: ["React", "Next.js", "Vue", "Tailwind CSS", "shadcn/ui"] },
    { group: "Backend", items: ["Node.js", "Actix Web", "Django", "Better Auth", "REST", "gRPC"] },
    { group: "Data", items: ["PostgreSQL", "MongoDB", "Drizzle", "Prisma", "Supabase", "Firebase"] },
    { group: "Web3", items: ["Bitcoin (PSBT, BIP-322, Ordinals)", "Substrate", "Solidity", "ethers.js"] },
    { group: "Ops", items: ["Docker", "Podman", "Jenkins", "GitHub Actions", "Vercel", "DigitalOcean"] },
  ],
};
