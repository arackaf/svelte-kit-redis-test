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
		const cachedResultRaw = await redisClient.get('query');
		const redisEnd = +Date.now();

		const parseStart = +Date.now();
		const cachedResult = JSON.parse(cachedResultRaw!);
		const parseEnd = +Date.now();

		return json({
			redisReadLatency: redisEnd - redisStart,
			parseLatency: parseEnd - parseStart,
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
