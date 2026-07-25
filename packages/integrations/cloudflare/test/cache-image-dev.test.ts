import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

describe('Cloudflare cache provider + /_image in dev', () => {
	let fixture: Fixture;
	let devServer: DevServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/cache-image-dev/',
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer?.stop();
	});

	it('serves cached image responses without crashing on immutable headers', async () => {
		const url = '/_image?href=/placeholder.jpg&f=webp&w=100';

		// First request — cache miss, fresh response with mutable headers.
		const res1 = await fixture.fetch(url);
		assert.equal(res1.status, 200, 'first image request should succeed');

		// Second request — cache hit via caches.default.match().
		// Before the fix, Miniflare returned a Response with immutable headers
		// and handler.ts crashed trying to .set() on them.
		const res2 = await fixture.fetch(url);
		assert.equal(res2.status, 200, 'second (cached) image request should succeed');
	});
});
