import { Inter } from "next/font/google"

// We are importing the weights we need for our project.
// 100 = thin
// 300 = light
// 400 = normal/regular
export const inter = Inter({
  subsets: ["latin"],
  weight: ["100", "300", "400"],
  display: "swap",
})