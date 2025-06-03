"use client";

import { useState } from "react";
import Uploader from "@/components/Uploader";
import LogStats from "@/components/LogStats";

const TABS = ["Upload", "Log Statistics"];

export default function Home() {
	const [selectedFilename, setSelectedFilename] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<string>(TABS[0]);

	return (
		<main className="flex flex-col items-center px-4">
		<div className="w-full mx-auto">
			{/* Tab Bar */}
			<div className="flex mb-4 rounded-xl border border-gray-800 bg-black">
			{TABS.map((tab) => (
				<button
				key={tab}
				className={`
					flex-1 py-3 text-lg font-semibold transition-colors duration-150
					bg-black
					${activeTab === tab
						? "text-white bg-blue-700 shadow-md"
						: "text-gray-300 hover:bg-blue-900 hover:text-white"}
					focus:outline-none
				`}
				onClick={() => setActiveTab(tab)}
				>
				{tab}
				</button>
			))}
			</div>
			{/* Tab Content */}
			<section className="flex flex-col items-center w-full">
			{activeTab === "Upload" && (
				<div className="w-full max-w-md">
					<Uploader 
						onUpload={setSelectedFilename} 
						showViewStatsButton={!!selectedFilename}
						onViewStats={() => setActiveTab("Log Statistics")}
					/>
				</div>
			)}
			{activeTab === "Log Statistics" && (
				<div className="w-full">
					<h2 className="text-2xl font-bold pt-8 mb-4 text-center text-white">Log Statistics</h2>
					{selectedFilename ? (
						<LogStats filename={selectedFilename} />
					) : (
						<div className="flex-1 flex items-center justify-center text-gray-500 text-lg">No file uploaded yet.</div>
					)}
				</div>
			)}
			</section>
		</div>
		</main>
	);
}
