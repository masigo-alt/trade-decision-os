import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bull: "#34d399",
        bear: "#fb7185",
        neutral: "#fbbf24",
      },
    },
  },
  plugins: [],
};

export default config;
