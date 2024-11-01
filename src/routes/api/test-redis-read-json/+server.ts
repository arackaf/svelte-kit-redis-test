import { createClient } from 'redis';
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
const { REDIS } = env;

export async function GET({}) {
	let redisClient;

	try {
		redisClient = createClient({
			url: REDIS
		});

		await redisClient.connect();

		const redisStart = +Date.now();
		const cachedResult = await redisClient.json.get('query-json');
		const redisEnd = +Date.now();

		return json({
			redisReadLatency: redisEnd - redisStart,
			type: typeof cachedResult,
			value: cachedResult
		});
	} catch (error) {
		return json({ error });
	} finally {
		try {
			redisClient?.disconnect();
		} catch (er) {}
	}
}
