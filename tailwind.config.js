/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
	content: ['./src/**/*.{html,js,jsx,md,mdx,ts,tsx}'],
	prefix: "",
	theme: {
		screens: {
			'md': '1000px',
		},
	},
	plugins: [
		require("tailwindcss-animate"),
	],
}

