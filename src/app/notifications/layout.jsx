// Server component wrapper — provides metadata for the notifications route
// (page.jsx is "use client" so can't export metadata directly)

export const metadata = {
  title: "Notifications",
  description:
    "View your PostedIn notifications — streak alerts, post reminders, and LinkedIn activity updates.",
  robots: { index: false, follow: false }, // private page, no public indexing
};

export default function NotificationsLayout({ children }) {
  return children;
}
