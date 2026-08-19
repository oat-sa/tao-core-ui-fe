/**
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; under version 2
 * of the License (non-upgradable).
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 31 Milk St # 960789 Boston, MA 02196 USA.
 *
 * Copyright (c) 2026 (original work) Open Assessment Technologies SA;
 */

/**
 * FE contract for scoped asset search used by Resource Manager (PoC).
 * Align request/response fields with the backend search ticket.
 *
 * @exports ui/resourcemgr/assetSearchContract
 */

/**
 * Supported sort fields for the picker search UI.
 * @type {{LABEL: string, LOCATION: string, UPDATED_AT: string}}
 */
export const SORT_FIELDS = {
    LABEL: 'label',
    LOCATION: 'location',
    UPDATED_AT: 'updatedAt'
};

/**
 * Default sort: Label ascending (case-insensitive on the service side).
 * @type {{field: string, direction: string}}
 */
export const DEFAULT_SORT = {
    field: SORT_FIELDS.LABEL,
    direction: 'asc'
};

/**
 * Default page size for search results.
 * @type {number}
 */
export const DEFAULT_PAGE_SIZE = 10;

/**
 * Build query params for a scoped asset-search request.
 *
 * Request minimum:
 * - path/scope (folder subtree)
 * - query text
 * - sort field + direction
 * - page / pageSize
 * - existing picker params (uri, lang, filters) passed through as-is
 *
 * @param {Object} options
 * @param {string} options.path - folder scope
 * @param {string} options.query - universal search text
 * @param {{field: string, direction: string}} options.sort
 * @param {number} options.page - 1-based page
 * @param {number} [options.pageSize]
 * @param {string} [options.pathParam='path']
 * @param {Object} [options.params] - existing RM params (uri, lang, filters, …)
 * @returns {Object}
 */
export function buildSearchRequestParams(options) {
    const pathParam = options.pathParam || 'path';
    const pageSize = options.pageSize || DEFAULT_PAGE_SIZE;
    const sort = options.sort || DEFAULT_SORT;
    const params = Object.assign({}, options.params || {});

    params[pathParam] = options.path;
    params.query = options.query || '';
    params.sortBy = sort.field;
    params.sortDir = sort.direction;
    params.page = options.page || 1;
    params.pageSize = pageSize;

    return params;
}

/**
 * Normalize a search service payload into a stable picker shape.
 *
 * Response minimum for PoC rows:
 * - identity/uri, label/name, mime/type, location, updatedAt, permissions
 * - total + pageSize for pagination
 * Empty success (total 0 / empty items) is distinct from request failure.
 *
 * Accepts either a wrapped `{ data: … }` response or a flat body, and either
 * `items` or browse-compatible `children`.
 *
 * @param {Object} payload
 * @returns {{items: Array, total: number, page: number, pageSize: number}}
 */
export function normalizeSearchResponse(payload) {
    const body = unwrapPayload(payload);
    const rawItems = body.items || body.children || [];
    const items = (Array.isArray(rawItems) ? rawItems : []).map(normalizeSearchItem);
    const pageSize = Number(body.pageSize || body.childrenLimit || DEFAULT_PAGE_SIZE);
    const page = Number(body.page || 1);
    const rawTotal = Number(body.total);
    const total =
        typeof body.total === 'undefined' || body.total === null || !Number.isFinite(rawTotal)
            ? items.length
            : rawTotal;

    return {
        items,
        total,
        page: Number.isFinite(page) && page > 0 ? page : 1,
        pageSize: Number.isFinite(pageSize) && pageSize > 0 ? pageSize : DEFAULT_PAGE_SIZE
    };
}

/**
 * Browse (`ItemContent/files`) responses use `children` and ignore `query`.
 * Real search responses expose `items`.
 *
 * @param {Object} payload
 * @returns {boolean}
 */
export function isBrowseShapedSearchPayload(payload) {
    const body = unwrapPayload(payload);
    return Array.isArray(body.children) && !Array.isArray(body.items);
}

/**
 * Local filter/sort/page for browse-shaped payloads (`children`, no `items`).
 * Search endpoints that return `items` are left untouched.
 *
 * @param {Object} normalized - output of normalizeSearchResponse
 * @param {Object} options
 * @param {string} options.query
 * @param {{field: string, direction: string}} [options.sort]
 * @param {number} [options.page]
 * @param {number} [options.pageSize]
 * @returns {{items: Array, total: number, page: number, pageSize: number}}
 */
export function applyLocalSearchFallback(normalized, options) {
    const query = String((options && options.query) || '')
        .trim()
        .toLowerCase();
    const sort = (options && options.sort) || DEFAULT_SORT;
    const pageSize =
        Number(options && options.pageSize) > 0
            ? Number(options.pageSize)
            : normalized.pageSize || DEFAULT_PAGE_SIZE;
    const page = Number(options && options.page) > 0 ? Number(options.page) : 1;

    let items = (normalized.items || []).filter(isSearchableAsset);
    if (query) {
        items = items.filter(function (item) {
            return getSearchableText(item).indexOf(query) !== -1;
        });
    }

    items = sortAssetItems(items, sort);

    const total = items.length;
    const safePageSize = pageSize > 0 ? pageSize : DEFAULT_PAGE_SIZE;
    const maxPage = Math.max(1, Math.ceil(total / safePageSize) || 1);
    const safePage = Math.min(page, maxPage);
    const start = (safePage - 1) * safePageSize;

    return {
        items: items.slice(start, start + safePageSize),
        total,
        page: safePage,
        pageSize: safePageSize
    };
}

/**
 * @param {Object} payload
 * @returns {Object}
 */
function unwrapPayload(payload) {
    return payload && payload.data && !Array.isArray(payload.data) ? payload.data : payload || {};
}

/**
 * @param {Object} item
 * @returns {Object}
 */
function normalizeSearchItem(item) {
    const normalized = Object.assign({}, item);
    if (!normalized.name && normalized.label) {
        normalized.name = normalized.label;
    }
    if (!normalized.label && normalized.name) {
        normalized.label = normalized.name;
    }
    if (!normalized.uri && normalized.id) {
        normalized.uri = normalized.id;
    }
    if (!normalized.updatedAt && normalized.updated_at) {
        normalized.updatedAt = normalized.updated_at;
    }
    if (!normalized.location && normalized.path) {
        normalized.location = normalized.path;
    }
    return normalized;
}

/**
 * @param {Object} item
 * @returns {boolean}
 */
function isSearchableAsset(item) {
    if (!item) {
        return false;
    }
    if (item.mime || item.type) {
        return true;
    }
    // Directories from browse have nested children / no mime.
    if (Array.isArray(item.children) || (item.path && !item.uri && !item.file)) {
        return false;
    }
    return Boolean(item.uri || item.file || item.name || item.label);
}

/**
 * @param {Object} item
 * @returns {string}
 */
function getSearchableText(item) {
    return [item.label, item.name, item.location, item.path, item.uri, item.file]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
}

/**
 * Sort asset rows by the picker contract (label / location / updatedAt).
 * Equal keys fall back to label so the order is stable when a column is tied.
 *
 * @param {Array} items
 * @param {{field: string, direction: string}} [sort]
 * @returns {Array}
 */
export function sortAssetItems(items, sort) {
    const resolved = Object.assign({}, DEFAULT_SORT, sort || {});
    return (items || []).slice().sort(function (a, b) {
        const primary = compareSortValues(
            getSortValue(a, resolved.field),
            getSortValue(b, resolved.field),
            resolved.direction
        );
        if (primary !== 0) {
            return primary;
        }
        if (resolved.field === SORT_FIELDS.LABEL) {
            return 0;
        }
        return compareSortValues(getSortValue(a, SORT_FIELDS.LABEL), getSortValue(b, SORT_FIELDS.LABEL), 'asc');
    });
}

/**
 * @param {string} left
 * @param {string} right
 * @param {string} direction
 * @returns {number}
 */
function compareSortValues(left, right, direction) {
    if (left < right) {
        return direction === 'desc' ? 1 : -1;
    }
    if (left > right) {
        return direction === 'desc' ? -1 : 1;
    }
    return 0;
}

/**
 * @param {Object} item
 * @param {string} field
 * @returns {string}
 */
function getSortValue(item, field) {
    if (field === SORT_FIELDS.LOCATION) {
        return String(item.location || item.path || '').toLowerCase();
    }
    if (field === SORT_FIELDS.UPDATED_AT) {
        return String(item.updatedAt || item.updated_at || '');
    }
    return String(item.label || item.name || '').toLowerCase();
}
