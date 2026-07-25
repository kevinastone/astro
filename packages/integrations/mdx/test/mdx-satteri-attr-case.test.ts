import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import mdx from '@astrojs/mdx';
import { satteri } from '@astrojs/markdown-satteri';
import { defineHastPlugin } from 'satteri';
import { parseHTML } from 'linkedom';
import { loadFixture, type Fixture } from './test-utils.ts';

// Append an <svg><path .../></svg> to every <a>, using hast property names
// (camelCase). The MDX pipeline should convert them to HTML attribute names
// (kebab-case) when elementAttributeNameCase is 'html'.
const appendSvg = defineHastPlugin({
	name: 'append-svg',
	element: {
		filter: ['a'],
		visit: (_node, ctx) =>
			ctx.appendChild(_node, {
				type: 'element',
				tagName: 'svg',
				properties: { viewBox: '0 0 12 12' },
				children: [
					{
						type: 'element',
						tagName: 'path',
						properties: {
							d: 'M0 0',
							strokeWidth: '1.2',
							fillOpacity: '0.9',
							fillRule: 'evenodd',
							clipPath: 'url(#c)',
						},
						children: [],
					},
				],
			}),
	},
});

describe('MDX Sätteri attribute name casing (#17512)', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/mdx-satteri-attr-case/', import.meta.url),
			integrations: [mdx()],
			markdown: {
				processor: satteri({ hastPlugins: [appendSvg] }),
			},
		});
		await fixture.build();
	});

	it('emits HTML-cased SVG attribute names, not React-cased', async () => {
		const html = await fixture.readFile('/test/index.html');
		const { document } = parseHTML(html);
		const path = document.querySelector('path');
		assert.ok(path, 'Expected a <path> element in the output');

		// These should be HTML-cased (kebab-case), not React-cased (camelCase)
		assert.ok(path.hasAttribute('stroke-width'), 'Expected stroke-width');
		assert.ok(path.hasAttribute('fill-opacity'), 'Expected fill-opacity');
		assert.ok(path.hasAttribute('fill-rule'), 'Expected fill-rule');
		assert.ok(path.hasAttribute('clip-path'), 'Expected clip-path');

		// React-cased versions should not be present
		assert.ok(!path.hasAttribute('strokeWidth'), 'strokeWidth should not appear');
		assert.ok(!path.hasAttribute('fillOpacity'), 'fillOpacity should not appear');
		assert.ok(!path.hasAttribute('fillRule'), 'fillRule should not appear');
		assert.ok(!path.hasAttribute('clipPath'), 'clipPath should not appear');
	});
});
