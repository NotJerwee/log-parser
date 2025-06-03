"use client";

import { useState, useRef } from "react";

export default function Uploader({ onUpload, onViewStats, showViewStatsButton }: { onUpload: (filename: string) => void, onViewStats?: () => void, showViewStatsButton?: boolean }) {
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [uploadStatus, setUploadStatus] = useState<string>("");
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	async function uploadFile(file: File) {
		const filename = file.name;
	
		if (!filename.endsWith(".log")) {
			setError("Please upload a .log file only.");
			return;
		}
	
		setUploading(true);
		setError(null);
		setUploadStatus("Preparing to upload...");
	
		try {
			const formData = new FormData();
			formData.append("logfile", file);
		
			setUploadStatus("Uploading file...");
			const res = await fetch("http://localhost:3001/api/upload", {
				method: "POST",
				body: formData,
			});
		
			if (!res.ok) {
				const errorData = await res.json().catch(() => ({}));
				throw new Error(`Upload failed: ${res.status} - ${errorData.message || res.statusText} - ${errorData.error || ''}`);
			}

			setUploadStatus("Processing log file...");
						
			console.log("✅ Upload complete:", filename);
			setUploadStatus("Upload complete! Processing results...");
			
			setTimeout(() => {
				setUploading(false);
				setUploadStatus("");
				onUpload(filename);
			}, 1000);
		} catch (err: unknown) {
			console.error("❌ Upload error:", err);
			const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
			setError("Upload failed: " + errorMessage);
			setUploading(false);
			setUploadStatus("");
		}
	}

	function handleDrop(e: React.DragEvent) {
		e.preventDefault();
		const file = e.dataTransfer.files?.[0];
		if (file) uploadFile(file);
	}

	function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (file) uploadFile(file);
	}

	return (
		<div className="flex flex-col items-center px-4 pt-8">
			<h2 className="text-2xl font-semibold mb-6 text-center">Upload Your Log File</h2>
			<div className="w-full max-w-md text-center">
				<div
				onDrop={handleDrop}
				onDragOver={(e) => e.preventDefault()}
				onClick={() => !uploading && fileInputRef.current?.click()}
				className={`
					upload-zone
					border-2 border-dashed rounded-xl p-8 transition-all duration-200
					${uploading ? 'uploading' : 'cursor-pointer'}
				`}
				>
				{!uploading ? (
					<div className="upload-status-enter-active space-y-2">
						<div className="space-y-2">
							<svg 
								className="mx-auto h-12 w-12 text-gray-400" 
								stroke="currentColor" 
								fill="none" 
								viewBox="0 0 48 48" 
								aria-hidden="true"
							>
								<path 
									d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" 
									strokeWidth={2} 
									strokeLinecap="round" 
									strokeLinejoin="round" 
								/>
							</svg>
							<p className="text-gray-700 text-lg">
								Drop your .log file here or {" "}
								<span className="text-blue-600 font-medium underline">click to select</span>
							</p>
						</div>
					</div>
				) : (
					<div className="upload-status-enter-active space-y-4">
						<div className="flex justify-center">
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
						</div>
						<p className="text-blue-600 font-medium">{uploadStatus}</p>
					</div>
				)}
				
				{error && (
					<div className={`mt-4 p-3 bg-red-50 border border-red-200 rounded-lg error-shake`}>
						<p className="text-red-600">{error}</p>
					</div>
				)}
				</div>
				
				{showViewStatsButton && onViewStats && (
					<button
						className="mt-4 inline-block px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
						onClick={onViewStats}
					>
						View Log Statistics
					</button>
				)}
				<input
					ref={fileInputRef}
					type="file"
					accept=".log"
					className="hidden"
					onChange={handleFileChange}
					disabled={uploading}
				/>
			</div>
		</div>
	);
}
