module.exports = {
  presets: [require("nativewind/preset")],
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#F5F5F0",
        primary: "#91A27D", // Muted Green
        secondary: "#EA580C", // Orange
        tertiary: "#2563EB", // Blue
        emotional: {
          enraged: "#D94F16",
          angry: "#E68A64",
          excited: "#9ACD67",
          ecstatic: "#68A63C",
          overwhelmed: "#E69164",
          strained: "#F2C2B3",
          engaged: "#DAEFCC",
          happy: "#9ACD67",
          anxious: "#D1D5DB",
          flat: "#E5E7EB",
          reflective: "#D1E3F2",
          content: "#93C5FD",
          depressed: "#9CA3AF",
          sad: "#CBD5E1",
          calm: "#93C5FD",
          blissful: "#60A5FA",
        }
      }
    },
  },
  plugins: [],
}

