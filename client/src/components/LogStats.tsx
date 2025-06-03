"use client";

import { useEffect, useState } from 'react';
import D3BarChart from './D3BarChart';

interface LogStats {
	totalLines: number;
	errorCount: number;
	warnCount: number;
	debugCount: number;
	infoCount: number;
	users: Record<string, number>;
	errors: Array<{ timestamp: string; message: string }>;
	timeline: Array<{ timestamp: string; level: string; message: string }>;
	userActivity: Record<string, Array<{ timestamp: string; action: string; details: string }>>;
}

export default function LogStats({ filename }: { filename: string }) {
	const [stats, setStats] = useState<LogStats | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function fetchData() {
			try {
				const urlRes = await fetch(`/api/get-log-data?filename=${filename}`);
				if (!urlRes.ok) throw new Error('Failed to get presigned URL');
				const { url } = await urlRes.json();

				const dataRes = await fetch(url);
				if (!dataRes.ok) throw new Error('Failed to fetch log data');
				const data = await dataRes.json();
				setStats(data);
			} catch (err) {
				setError(err instanceof Error ? err.message : 'An error occurred');
			} finally {
				setLoading(false);
			}
		}

		if (filename) {
			fetchData();
		}
	}, [filename]);

	if (loading) return <div className="text-center p-4">Loading statistics...</div>;
	if (error) return <div className="text-red-500 p-4">Error: {error}</div>;
	if (!stats) return <div className="text-center p-4">No data available</div>;

	const logLevelData = [
		{ label: 'Error', value: stats.errorCount },
		{ label: 'Warning', value: stats.warnCount },
		{ label: 'Debug', value: stats.debugCount },
		{ label: 'Info', value: stats.infoCount }
	];

	const userData = Object.entries(stats.users).map(([user, count]) => ({
		label: user,
		value: count
	}));

	return (
		<div className="p-4 space-y-8">
			<div className="flex flex-col gap-4">
				<div className="bg-gray-800 p-4 rounded-lg shadow w-full">
				<h3 className="text-lg font-semibold mb-4 text-gray-100">Log Level Distribution</h3>
				<D3BarChart data={logLevelData} />
				</div>
				<div className="bg-gray-800 p-4 rounded-lg shadow w-full">
				<h3 className="text-lg font-semibold mb-4 text-gray-100">User Activity</h3>
				<D3BarChart data={userData} />
				</div>
			</div>

			<div className="bg-gray-800 p-4 rounded-lg shadow">
				<h3 className="text-lg font-semibold mb-4 text-gray-100">Summary</h3>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					<div className="p-3 bg-red-900/30 rounded">
						<div className="text-red-300 font-semibold">Errors</div>
						<div className="text-2xl text-red-100">{stats.errorCount}</div>
					</div>
					<div className="p-3 bg-yellow-900/30 rounded">
						<div className="text-yellow-200 font-semibold">Warnings</div>
						<div className="text-2xl text-yellow-100">{stats.warnCount}</div>
					</div>
					<div className="p-3 bg-blue-900/30 rounded">
						<div className="text-blue-200 font-semibold">Debug</div>
						<div className="text-2xl text-blue-100">{stats.debugCount}</div>
					</div>
					<div className="p-3 bg-green-900/30 rounded">
						<div className="text-green-200 font-semibold">Info</div>
						<div className="text-2xl text-green-100">{stats.infoCount}</div>
					</div>
				</div>
			</div>

			{stats.errors.length > 0 && (
				<div className="bg-gray-800 p-4 rounded-lg shadow">
					<h3 className="text-lg font-semibold mb-4 text-gray-100">Errors</h3>
					<div className="space-y-2">
						{stats.errors.map((error, i) => (
						<div key={i} className="p-2 bg-red-900/30 rounded">
							<div className="text-sm text-gray-400">{error.timestamp}</div>
							<div className="text-red-200">{error.message}</div>
						</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
} 