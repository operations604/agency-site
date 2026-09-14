export type Step = {
  title: string;
  desc: string;
  at: number;
};

export const STEPS: Step[] = [
  {
    title: "The call",
    desc: "You walk us through the week. We find the work that shouldn't be done by hand.",
    at: 0,
  },
  {
    title: "The deep dive",
    desc: "We sit with the people who do the work and watch how the week actually runs.",
    at: 0.2,
  },
  {
    title: "The plan",
    desc: "Fixed scope, fixed price, written down. Then we start.",
    at: 0.4,
  },
  {
    title: "The build",
    desc: "On your real data, in your real tools. Nothing mocked up.",
    at: 0.6,
  },
  {
    title: "Your review",
    desc: "You see it running and shape it with us. Changes land while you watch.",
    at: 0.8,
  },
  {
    title: "Live",
    desc: "Launch, training, handoff. We keep it running from there.",
    at: 1,
  },
];
