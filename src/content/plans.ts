export type Plan = {
  name: string;
  tag: string;
  desc: string;
  points: string[];
  featured?: boolean;
};

export const PLANS: Plan[] = [
  {
    name: "Beacon",
    tag: "Three features",
    desc: "A website with three features, or one serverless process, automation, or app. We keep it running for six months after launch.",
    points: [
      "Serverless process, automation, or app",
      "Or a website with three features",
      "Scoped and priced before we start",
      "Six months of servicing included",
    ],
  },
  {
    name: "Foundry",
    tag: "Six features",
    desc: "Automations or custom software, plus the apps and CRM that run the week. Six features, six months of servicing.",
    points: [
      "Automations or custom software",
      "Custom apps included",
      "Custom CRM, dashboards, and ops tools",
      "Six features, scoped before we start",
      "Six months of servicing included",
    ],
    featured: true,
  },
  {
    name: "Helix",
    tag: "Full custom",
    desc: "Built around whatever you need. We lock a set of features to your brief, then keep the whole system running for six months.",
    points: [
      "Custom software, apps, CRM, and automations",
      "A set of features scoped to your brief",
      "One system built around how you operate",
      "Hosting and monitoring",
      "Six months of servicing included",
    ],
  },
];
