import { createClient } from 'redis';
import pg from 'pg';
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
const { REDIS, FLY_DB, USER_ID } = env;

const { Pool } = pg;

export async function GET({ url, setHeaders, locals }) {
	const val = url.searchParams.get('search');

	let redisClient;
	let pgClient: pg.PoolClient = null as any;
	let pgPool: pg.Pool = null as any;
	try {
		redisClient = createClient({
			url: REDIS
		});

		pgPool = new Pool({
			connectionString: FLY_DB
		});

		pgClient = await pgPool.connect();

		await redisClient.connect();

		const pgStart = +Date.now();
		const queryResult = await pgClient.query(
			'SELECT * FROM books WHERE user_id = $1 AND title ilike $2 LIMIT 50',
			[USER_ID, `%${val}%`]
		);
		const pgEnd = +Date.now();

		const results = queryResult.rows;
		console.log({ results: queryResult.rows });

		const redisStart = +Date.now();
		await redisClient.set('query', JSON.stringify(results));
		const redisEnd = +Date.now();

		return json({
			pgLatency: pgEnd - pgStart,
			redisSaveLatency: redisEnd - redisStart,
			value: results
		});
	} catch (error) {
		return json({ error: error?.toString() });
	} finally {
		try {
			redisClient?.disconnect();
		} catch (er) {}

		try {
			pgClient?.release();
		} catch (er) {}

		try {
			pgPool?.end();
		} catch (er) {}
	}
}
