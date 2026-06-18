// Chandan's developer profile — drives personalization across the app.
export const profile = {
  name: "Chandan Kushwaha",
  headline: "Full Stack Developer | React · Next.js · Node.js · Web3 · MongoDB",
  location: "Jalandhar, Punjab, India",
  email: "ck425789@gmail.com",
  initials: "CK",
  stack: ["React", "Next.js", "Node.js", "MongoDB", "Web3", "Blockchain", "ICP", "TypeScript"],
  achievements: [
    "Built BlockseBlock — scaled from scratch to 10,000+ users",
    "Reduced API latency by 60%",
    "Shipped SipnPlay and LearnBlockseBlock",
    "15,000+ users served across projects",
    "10,000+ participants in competitions organized",
  ],
  projects: ["BlockseBlock", "SipnPlay", "LearnBlockseBlock"],
};

// Topic rotation by day of week (0 = Sunday ... 6 = Saturday).
export const topicRotation = {
  0: { topic: "Motivation/Reflection", example: "What hiring managers actually look for in a Full Stack portfolio" },
  1: { topic: "Career/Journey", example: "2 years ago I wrote my first API. Today it handles 15,000 users/month" },
  2: { topic: "Tech Deep Dive", example: "Why I switched from REST to WebSockets — and got 35% more engagement" },
  3: { topic: "Project Story", example: "How I built BlockseBlock from scratch to 10,000 users" },
  4: { topic: "Coding Tip", example: "This one React pattern cut my re-renders by 50%" },
  5: { topic: "Web3/Blockchain", example: "What building on ICP blockchain taught me about decentralization" },
  6: { topic: "Tools & Workflow", example: "My dev setup that ships faster — Docker + CI/CD + Vercel" },
};

export function getTodayTopic(date = new Date()) {
  return topicRotation[date.getDay()];
}
