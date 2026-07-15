import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export function startProductTour() {
  if (typeof window === "undefined") return;

  const driverObj = driver({
    showProgress: true,
    animate: true,
    overlayColor: "rgba(15, 23, 42, 0.65)", // Slate 900 background overlay
    popoverClass: "postedin-tour-popover",
    steps: [
      {
        element: "#nav-logo",
        popover: {
          title: "Welcome to PostedIn! 👋",
          description: "Your AI LinkedIn copilot. Let's take a quick 1-minute tour of your growth engine.",
          side: "bottom",
          align: "start"
        }
      },
      {
        element: "#tour-profile-edit",
        popover: {
          title: "✍️ Edit Developer Profile",
          description: "Click here to upload your resume PDF to instantly auto-fill and synchronize your entire professional profile!",
          side: "bottom"
        }
      },
      {
        element: "#generator-tab-header",
        popover: {
          title: "💡 Daily Content Generator",
          description: "Generate highly engaging, structured LinkedIn posts customized with your hooks and style presets.",
          side: "bottom"
        }
      },
      {
        element: "#tour-generate-post",
        popover: {
          title: "🚀 Generate Today's Draft",
          description: "Click here to generate a brand new LinkedIn post template using your current settings and chosen style presets.",
          side: "bottom"
        }
      },
      {
        element: "#case-study-tab-header",
        popover: {
          title: "🏢 Company Case Study Builder",
          description: "Write viral teardowns of companies (Zomato, Airbnb, Swiggy, Apple) focusing on Growth, Tech Stack, or Business Models, with Carousel slide templates!",
          side: "bottom"
        }
      },
      {
        element: "#tools-sidebar-panel",
        popover: {
          title: "🛠️ Creator Tools Suite",
          description: "Create PDF Carousels, audit your Profile SEO, track jobs/opportunities, and view your growth analytics dashboard here.",
          side: "right"
        }
      },
      {
        element: "#nav-blogs-btn",
        popover: {
          title: "📰 Tech Blog Reader & Curator",
          description: "Read live trending tech feeds, save favorites, write personal reviews/notes, and 1-click summarize them into LinkedIn draft posts!",
          side: "bottom"
        }
      },
      {
        element: "#nav-settings-btn",
        popover: {
          title: "⚙️ Reminder Settings",
          description: "Configure daily posting reminders, SMTP email credentials, and customize which tools show in your sidebar.",
          side: "bottom"
        }
      }
    ]
  });

  // Inject custom CSS styling for the driver popover to make it premium
  const styleId = "postedin-tour-styles";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.innerHTML = `
      .postedin-tour-popover {
        border-radius: 20px !important;
        padding: 18px !important;
        font-family: var(--font-outfit), sans-serif !important;
        border: 1px border #e2e8f0 !important;
        box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1) !important;
      }
      .postedin-tour-popover .driver-popover-title {
        font-size: 13.5px !important;
        font-weight: 850 !important;
        color: #0f172a !important;
        margin-bottom: 6px !important;
      }
      .postedin-tour-popover .driver-popover-description {
        font-size: 11px !important;
        font-weight: 600 !important;
        color: #475569 !important;
        line-height: 1.5 !important;
      }
      .postedin-tour-popover .driver-popover-footer button {
        font-size: 10px !important;
        font-weight: 700 !important;
        padding: 5px 12px !important;
        border-radius: 9999px !important;
        text-shadow: none !important;
        transition: all 0.2s !important;
      }
      .postedin-tour-popover .driver-popover-next-btn {
        background-color: #0A66C2 !important;
        color: white !important;
        border: none !important;
      }
      .postedin-tour-popover .driver-popover-next-btn:hover {
        background-color: #004182 !important;
      }
      .postedin-tour-popover .driver-popover-prev-btn {
        background-color: #f1f5f9 !important;
        color: #475569 !important;
        border: 1px border #cbd5e1 !important;
      }
    `;
    document.head.appendChild(style);
  }

  driverObj.drive();
}
