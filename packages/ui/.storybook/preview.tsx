import React from "react";
import type { Preview } from "@storybook/react";
import "../src/styles/globals.css";

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: "dark",
      values: [
        { name: "dark", value: "#060a12" },
        { name: "light", value: "#f3f6fa" },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  globalTypes: {
    theme: {
      name: "Theme",
      description: "Global color theme for AgentShield-X components",
      defaultValue: "dark",
      toolbar: {
        icon: "circlehollow",
        items: [
          { value: "dark", icon: "moon", title: "Dark Theme (#060a12)" },
          { value: "light", icon: "sun", title: "Light Theme (#f3f6fa)" },
        ],
      },
    },
  },
  decorators: [
    (Story: any, context: any) => {
      const theme = context.globals.theme || "dark";
      const isDark = theme === "dark";

      React.useEffect(() => {
        const root = document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(theme);
        root.setAttribute("data-theme", theme);
      }, [theme]);

      return (
        <div
          className={`${theme} p-6 min-h-screen transition-colors duration-150`}
          style={{
            backgroundColor: isDark ? "#060a12" : "#f3f6fa",
            color: isDark ? "#e8eef7" : "#0a1424",
          }}
        >
          <Story />
        </div>
      );
    },
  ],
};

export default preview;
