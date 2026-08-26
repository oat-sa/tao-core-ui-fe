/**
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; under version 2
 * of the License (non-upgradable).
 *
 * Copyright (c) 2026 (original work) Open Assessment Technologies SA ;
 */
define(['ui/mediaplayer/utils/crossOrigin'], function (crossOriginUtil) {
    'use strict';

    const resolveCrossOriginMode = crossOriginUtil.resolveCrossOriginMode;
    const resolveCrossOriginAttribute = crossOriginUtil.resolveCrossOriginAttribute;

    const page = {
        sameDomain(url) {
            return url.startsWith('/');
        }
    };

    QUnit.module('mediaplayer utils/crossOrigin');

    QUnit.cases
        .init([
            { title: 'defaults to anonymous', instance: undefined, module: undefined, expected: 'anonymous' },
            { title: 'instance use-credentials', instance: 'use-credentials', module: 'anonymous', expected: 'use-credentials' },
            { title: 'module use-credentials', instance: undefined, module: 'use-credentials', expected: 'use-credentials' },
            { title: 'invalid falls back to anonymous', instance: 'invalid', module: undefined, expected: 'anonymous' }
        ])
        .test('resolveCrossOriginMode ', (data, assert) => {
            assert.expect(1);
            assert.strictEqual(resolveCrossOriginMode(data.instance, data.module), data.expected);
        });

    QUnit.cases
        .init([
            {
                title: 'same-domain sources omit crossorigin',
                sources: [{ src: '/media/video.webm' }],
                mode: 'use-credentials',
                expected: null
            },
            {
                title: 'cross-domain anonymous',
                sources: [{ src: 'https://cdn.example/video.webm' }],
                mode: 'anonymous',
                expected: 'anonymous'
            },
            {
                title: 'cross-domain use-credentials',
                sources: [{ src: 'https://backend.example/files/video.webm' }],
                mode: 'use-credentials',
                expected: 'use-credentials'
            }
        ])
        .test('resolveCrossOriginAttribute ', (data, assert) => {
            assert.expect(1);
            assert.strictEqual(resolveCrossOriginAttribute(data.sources, data.mode, page), data.expected);
        });
});
