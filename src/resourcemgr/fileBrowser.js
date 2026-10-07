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
 * Copyright (c) 2018-2026 (original work) Open Assessment Technologies SA;
 */
import $ from 'jquery';
import _ from 'lodash';
import paginationComponent from 'ui/pagination';
import rootFolderTpl from 'ui/resourcemgr/tpl/rootFolder';
import folderTpl from 'ui/resourcemgr/tpl/folder';
import loggerFactory from 'core/logger';
import updatePermissions from './util/updatePermissions';
import { DEFAULT_SORT, sortAssetItems } from 'ui/resourcemgr/assetSearchContract';

const NS = 'resourcemgr';
const LOGGER = loggerFactory(`ui/${NS}`);
const DEFAULT_AJAX_TIMEOUT_MS = 30000;
const TREE_LOADING_REF_KEY = `${NS}TreeLoadingRefCount`;

/**
 * @param {Object} data
 * @returns {Array}
 */
function folderChildrenOnly(data) {
    return _.filter(data && data.children, function (child) {
        return child && child.path && !child.uri;
    });
}

export default function (options) {
    if (!options.browseUrl && options.url) {
        options.browseUrl = options.url;
    }

    const root = options.root || 'local';
    const rootPath = options.path || '/';
    const initialPath = options.initialPath || rootPath;
    const $container = options.$target;
    const $fileBrowser = $('.file-browser .file-browser-wrapper', $container);
    const $divContainer = $(`.${root}`, $fileBrowser);
    const $folderContainer = $('.folders', $divContainer);
    const $paginationContainer = $('.pagination-bottom', $container);
    const fileTree = {};
    // for pagination
    let selectedClass = {
        path: rootPath,
        childrenLimit: 11,
        total: 0,
        page: 1
    };
    let searchMode = false;
    let sort = Object.assign({}, DEFAULT_SORT);
    const splitBrowse = options.splitBrowse !== false;
    const ajaxTimeoutMs = Number.isFinite(Number(options.ajaxTimeoutMs)) && Number(options.ajaxTimeoutMs) > 0
        ? Number(options.ajaxTimeoutMs)
        : DEFAULT_AJAX_TIMEOUT_MS;
    const $treeLoadingOverlay = $('.file-browser-tree-loading', $fileBrowser);
    const $treeLoadingStatus = $('.file-browser-tree-loading-status', $treeLoadingOverlay);

    /**
     * Ref-count in-flight browse requests and toggle the tree loading overlay.
     * @param {Boolean} increment - true when a load starts, false when it finishes
     */
    function setTreeLoading(increment) {
        let treeLoadingRefCount = Number($fileBrowser.data(TREE_LOADING_REF_KEY)) || 0;
        treeLoadingRefCount += increment ? 1 : -1;
        if (treeLoadingRefCount < 0) {
            treeLoadingRefCount = 0;
        }
        $fileBrowser.data(TREE_LOADING_REF_KEY, treeLoadingRefCount);
        const loading = treeLoadingRefCount > 0;
        $fileBrowser.toggleClass('is-tree-loading', loading);
        $fileBrowser.attr('aria-busy', loading ? 'true' : 'false');
        $treeLoadingOverlay.toggleClass('hidden', !loading).attr('aria-hidden', loading ? 'false' : 'true');
        $treeLoadingStatus.attr('aria-busy', loading ? 'true' : 'false');
    }

    /**
     * Show or hide the asset table loading overlay (browse mode only).
     * @param {Boolean} loading
     */
    function setFilesLoading(loading) {
        if (searchMode) {
            return;
        }
        $container.trigger(`filesloading.${NS}`, [!!loading]);
    }

    $container.on(`searchmode.${NS}`, function (e, enabled) {
        searchMode = !!enabled;
        if (searchMode) {
            $container.trigger(`filesloading.${NS}`, [false]);
        }
    });

    $container.on(`sortchange.${NS}`, function (e, nextSort) {
        sort = Object.assign({}, DEFAULT_SORT, nextSort || {});
        selectedClass.page = 1;
        invalidateFolderFiles(selectedClass.path);
        if (searchMode || !isActiveBrowser()) {
            return;
        }
        reloadSortedFolder();
    });

    $container.on(`searchclear.${NS}`, function (e, path) {
        const targetPath = path || selectedClass.path;
        selectedClass.page = 1;
        invalidateFolderFiles(targetPath);
        if (!isActiveBrowser()) {
            return;
        }
        const subTree = getByExactPath(fileTree, targetPath) || getByPath(fileTree, targetPath) || fileTree;
        if (!searchMode) {
            setFilesLoading(true);
        }
        getFolderContent(subTree, targetPath, function (content) {
            if (content) {
                selectFolder(content, targetPath);
            } else {
                setFilesLoading(false);
            }
        });
    });

    // Reopen with resolved parent (AC3 edit/change): leave search, open folder again.
    $container.on(`applycontext.${NS}`, function (e, ctx) {
        const path = (ctx && ctx.path) || rootPath;
        const pathIsTaomedia = path && String(path).indexOf('taomedia://') === 0;
        if (pathIsTaomedia && root === 'local') {
            return;
        }
        if (!pathIsTaomedia && root !== 'local') {
            return;
        }
        $container.data('activeFileBrowserRoot', root);
        if (searchMode) {
            $container.trigger(`requestexitsearch.${NS}`);
        }
        selectedClass.page = 1;
        openInitialPath(path);
    });

    //load the content of the ROOT
    const showInitialListLoading = !searchMode && root === 'local';
    if (showInitialListLoading) {
        setFilesLoading(true);
    }
    getFolderContent(fileTree, rootPath, function (content) {
        if (!content) {
            if (showInitialListLoading) {
                setFilesLoading(false);
            }
            return;
        }
        indexTree(content);

        //create the tree node for the ROOT folder by default once the initial content loaded
        $folderContainer.append(
            rootFolderTpl(
                Object.assign({}, content, {
                    showToggle: hasNestedFolderChildren(content) !== false
                })
            )
        );

        const $rootNode = $('.root-folder', $folderContainer);
        //create an inner list and append found elements
        const $innerList = $('.root ul', $folderContainer);
        if (hasNestedFolderChildren(content)) {
            $rootNode.addClass('opened');
        } else if (hasNestedFolderChildren(content) === false) {
            setFolderToggleState($rootNode, false);
        }
        updateFolders(content, $innerList);

        if (content.permissions && content.permissions.read && !options.hasAlreadySelected) {
            if (initialPath && initialPath !== rootPath) {
                openInitialPath(initialPath);
            } else {
                selectFolder(content, content.path);
                syncTreeActiveFolder(content.path || rootPath);
            }

            if (root !== 'local') {
                options.hasAlreadySelected = true;
            }
        } else if (showInitialListLoading) {
            setFilesLoading(false);
        }
    });

    // by clicking on the tree (using a live binding  because content is not complete yet)
    $divContainer.off('click', '.folders a').on('click', '.folders a', function (e) {
        e.preventDefault();
        const $selected = $(this);
        const fullPath = $selected.data('path');
        const subTree = getByExactPath(fileTree, fullPath);
        const openingFolder = !searchMode && fullPath !== selectedClass.path;

        if (openingFolder) {
            selectedClass.page = 1;
        }
        if (!searchMode) {
            setFilesLoading(true);
        }
        invalidateFolderFiles(fullPath);

        //get the folder content
        getFolderContent(subTree, fullPath, function (content) {
            indexTree(fileTree);

            if (content) {
                //either create the inner list of the content is new or just show it
                let $innerList = $selected.siblings('ul');
                const nested = hasNestedFolderChildren(content);
                if (!$innerList.length && nested) {
                    $innerList = $('<ul></ul>').insertAfter($selected);
                    updateFolders(content, $innerList);
                    $selected.addClass('opened');
                    setFolderToggleState($selected, true);
                } else if ($innerList.length) {
                    if ($innerList.css('display') === 'none') {
                        $innerList.show();
                        $selected.addClass('opened');
                    } else if ($selected.parent('li').hasClass('active')) {
                        $innerList.hide();
                        $selected.removeClass('opened');
                    }
                } else if (nested === false) {
                    // Leaf folder: keep alignment spacer, hide expand chevron.
                    setFolderToggleState($selected, false);
                }

                syncTreeActiveFolder(fullPath, $selected);

                //internal event to set the file-selector content
                selectFolder(content, fullPath);
            } else if (!searchMode) {
                setFilesLoading(false);
            }
        });
    });

    $container.on(`filenew.${NS}`, function (e, file, path) {
        const targetPath = path || selectedClass.path;
        if (!targetPath || searchMode) {
            return;
        }

        const activeRoot = $container.data('activeFileBrowserRoot');
        if (activeRoot && activeRoot !== root) {
            return;
        }

        const subTree = getByExactPath(fileTree, targetPath) || getByPath(fileTree, targetPath);
        if (subTree && root === 'local' && file && file.name && _.find(subTree.children, { name: file.name })) {
            return;
        }

        if (targetPath !== selectedClass.path) {
            selectedClass.path = targetPath;
        }
        selectedClass.page = 1;

        invalidateFolderFiles(targetPath);
        const pendingUpload =
            file && !file.error && (file.uri || file.name) ? file : null;
        reloadSortedFolder(pendingUpload ? [pendingUpload] : []);
    });

    $container.on(`filedelete.${NS}`, function (e, path) {
        if (searchMode) {
            return;
        }

        const activeRoot = $container.data('activeFileBrowserRoot');
        if (activeRoot && activeRoot !== root) {
            return;
        }

        if (path) {
            removeFromPath(fileTree, path);
        }

        invalidateFolderFiles(selectedClass.path);
        reloadSortedFolder();
    });

    /**
     * Open and select an initial folder path after the root tree is available.
     * @param {String} path
     */
    function findFolderLink(path) {
        return $folderContainer.find('a').filter(function () {
            return $(this).data('path') === path;
        });
    }

    /**
     * Render directory children under an expanded folder anchor (replace / reopen).
     * @param {String} parentPath
     * @param {Object} parentContent
     */
    function mountFolderBranch(parentPath, parentContent) {
        const $parentLink = findFolderLink(parentPath);
        if (!$parentLink.length || !parentContent) {
            return;
        }
        let $innerList = $parentLink.siblings('ul');
        if (!$innerList.length) {
            $innerList = $('<ul></ul>').insertAfter($parentLink);
        }
        updateFolders(parentContent, $innerList);
        $parentLink.addClass('opened');
        if ($innerList.css('display') === 'none') {
            $innerList.show();
        }
        setFolderToggleState($parentLink, hasNestedFolderChildren(parentContent) !== false);
    }

    function markFolderActive(path) {
        const $targetLink = findFolderLink(path);
        if ($targetLink.length) {
            $targetLink.parents('li').each(function () {
                const $li = $(this);
                const $anchor = $li.children('a');
                const $list = $li.children('ul');
                $anchor.addClass('opened');
                if ($list.length) {
                    $list.show();
                }
            });
            syncTreeActiveFolder(path, $targetLink);
        } else if (path === rootPath) {
            syncTreeActiveFolder(rootPath);
        }
    }

    function openInitialPath(path) {
        getFolderContent(fileTree, path, function (content) {
            indexTree(fileTree);
            if (!content) {
                const rootContent = getByPath(fileTree, rootPath) || fileTree;
                const fallbackPath = rootContent.path || rootPath;
                selectFolder(rootContent, fallbackPath);
                syncTreeActiveFolder(fallbackPath);
                return;
            }

            function finishOpen() {
                markFolderActive(path);
                selectFolder(content, path);
            }

            if (findFolderLink(path).length) {
                finishOpen();
                return;
            }

            const parentFolderPath = content.parentFolderPath;
            if (parentFolderPath && parentFolderPath !== path) {
                getFolderContent(fileTree, parentFolderPath, function (parentContent) {
                    mountFolderBranch(parentFolderPath, parentContent);
                    finishOpen();
                });
                return;
            }

            finishOpen();
        });
    }

    /**
     * Mark the folder row that matches path as active (open folder icon for leaves).
     * @param {String} path
     * @param {jQuery} [$link]
     */
    function syncTreeActiveFolder(path, $link) {
        $('.folders li', $fileBrowser).removeClass('active');
        const $target =
            $link && $link.length
                ? $link
                : $folderContainer.find('a').filter(function () {
                    return $(this).data('path') === path;
                });
        if ($target.length) {
            $target.parent('li').addClass('active');
        }
    }

    /**
     * Whether this media source currently owns the file table.
     * @returns {Boolean}
     */
    function isActiveBrowser() {
        return $container.data('activeFileBrowserRoot') === root;
    }

    /**
     * Select a folder and publish its page of files to the selector.
     * @param {Object} content
     * @param {String} path
     */
    function selectFolder(content, path) {
        if (!content) {
            return;
        }
        $container.data('activeFileBrowserRoot', root);
        if (searchMode) {
            $container.trigger(`folderpath.${NS}`, [path, content.label]);
        $container.trigger(`folderselect.${NS}`, [
            content.label,
            getFilesForDisplay(content),
            path,
            content
        ]);
        return;
    }
        updateSelectedClass(path, content.total, content.childrenLimit);
        $container.trigger(`folderpath.${NS}`, [path, content.label]);
        $container.trigger(`folderselect.${NS}`, [
            content.label,
            getFilesForDisplay(content),
            path,
            content
        ]);
        renderPagination();
        if (!searchMode) {
            setFilesLoading(false);
        }
    }

    /**
     * Get files for page
     * @param {Array} children
     * @returns {Array} files for this page
     */
    function getPage(children) {
        const files = sortAssetItems(
            _.filter(children, function (item) {
                return !!item.uri;
            }),
            sort
        );
        if (selectedClass.childrenLimit) {
            return files.slice(
                (selectedClass.page - 1) * selectedClass.childrenLimit,
                selectedClass.page * selectedClass.childrenLimit
            );
        }
        return files;
    }

    /**
     * Files for the table (split list payload or legacy children slice).
     * @param {Object} content
     * @returns {Array}
     */
    function getFilesForDisplay(content) {
        if (!content) {
            return [];
        }
        if (splitBrowse) {
            return content.listItems || [];
        }
        return getPage(content.children || []);
    }

    function listCacheKey() {
        return `${sort.field}:${sort.direction}:${selectedClass.page}`;
    }

    /**
     * @param {Object} response
     * @returns {Object}
     */
    function unwrapBrowseResponse(response) {
        if (response && response.success === false) {
            return Promise.reject(response);
        }
        let data = response && response.data ? response.data : response;
        data = updatePermissions(data);
        if (data.children && data.children.length > 0) {
            data.children = data.children.map(function (child) {
                return updatePermissions(child);
            });
        }
        if (data.items && data.items.length > 0) {
            data.items = data.items.map(function (item) {
                return updatePermissions(item);
            });
        }
        return data;
    }

    /**
     * @param {String} path
     * @param {Object} extraData
     * @returns {Promise}
     */
    function browseRequest(path, extraData) {
        const parameters = {};
        parameters[options.pathParam || 'path'] = path;
        return Promise.resolve(
            $.ajax({
                url: options.browseUrl,
                method: 'GET',
                dataType: 'json',
                timeout: ajaxTimeoutMs,
                data: _.merge(parameters, options.params, extraData)
            })
        ).then(unwrapBrowseResponse);
    }

    /**
     * @param {Object} tree
     * @param {String} path
     * @param {Object} data
     */
    function applyTreePayload(tree, path, data) {
        const folderData = Object.assign({}, data, { children: folderChildrenOnly(data) });
        if (!tree.path) {
            _.merge(tree, folderData);
        } else if (folderData.children) {
            setToPath(tree, path, folderData);
            if (!_.find(folderData.children, 'path')) {
                markFolderEmptyAtPath(tree, path);
            }
        } else {
            setToPath(tree, path, folderData);
            markFolderEmptyAtPath(tree, path);
        }
    }

    /**
     * @param {Object} tree
     * @param {String} path
     * @param {Object} listData
     * @param {String} cacheKey
     */
    function applyListPayload(tree, path, listData, cacheKey) {
        const node = getByExactPath(tree, path) || getByPath(tree, path);
        if (!node || !listData) {
            return;
        }
        node.listItems = listData.items || [];
        node.total = listData.total;
        node.childrenLimit = listData.pageSize || listData.childrenLimit || selectedClass.childrenLimit;
        node.listPage = listData.page;
        node.totalIsApproximate = listData.totalIsApproximate;
        node.listCacheKey = cacheKey;
    }

    /**
     * Ensure upload responses appear in the table before Elasticsearch catches up.
     * @param {String} path
     * @param {Array<Object>} uploads
     */
    function mergePendingUploads(path, uploads) {
        if (!uploads || !uploads.length) {
            return;
        }
        const node = getByExactPath(fileTree, path) || getByPath(fileTree, path);
        if (!node) {
            return;
        }
        if (!Array.isArray(node.listItems)) {
            node.listItems = [];
        }
        let added = 0;
        uploads.forEach(function (uploaded) {
            if (!uploaded || uploaded.error) {
                return;
            }
            const normalized = updatePermissions(uploaded);
            if (!normalized.uri && !normalized.name) {
                return;
            }
            const exists = _.some(node.listItems, function (item) {
                return (
                    (normalized.uri && item.uri === normalized.uri) ||
                    (normalized.name && item.name === normalized.name)
                );
            });
            if (exists) {
                return;
            }
            node.listItems.push(normalized);
            added++;
        });
        if (!added) {
            return;
        }
        if (splitBrowse) {
            node.listItems = sortAssetItems(node.listItems, sort);
        }
        const total = Number(node.total);
        if (Number.isFinite(total) && total >= 0) {
            node.total = total + added;
        }
    }

    /**
     * Get the content of a folder, either in the model or load it
     * @param {Object} tree - the tree model
     * @param {String} path - the folder path (relative to the root)
     * @param {Function} cb - called back with the content in 1st parameter
     */
    function markFolderEmptyAtPath(tree, path) {
        const node = getByExactPath(tree, path);
        if (node) {
            node.empty = true;
        }
    }

    function getFolderContent(tree, path, cb) {
        if (splitBrowse) {
            const existing = getByExactPath(tree, path) || getByPath(tree, path);
            const needTree = !existing || (!existing.children && !existing.empty);
            const cacheKey = listCacheKey();
            const needList = !existing || existing.listCacheKey !== cacheKey;

            const treePromise = needTree
                ? (setTreeLoading(true),
                browseRequest(path, {
                    part: 'tree',
                    depth: 1,
                    sortBy: sort.field,
                    sortDir: sort.direction
                }).then(
                    function (data) {
                        setTreeLoading(false);
                        return data;
                    },
                    function (error) {
                        setTreeLoading(false);
                        return Promise.reject(error);
                    }
                ))
                : Promise.resolve(null);

            const listPromise = needList
                ? browseRequest(path, {
                    part: 'list',
                    page: selectedClass.page,
                    pageSize: selectedClass.childrenLimit || 11,
                    sortBy: sort.field,
                    sortDir: sort.direction
                })
                : Promise.resolve(null);

            Promise.all([treePromise, listPromise])
                .then(function ([treeData, listData]) {
                    if (treeData) {
                        applyTreePayload(tree, path, treeData);
                    }
                    if (listData) {
                        applyListPayload(tree, path, listData, cacheKey);
                    }
                    cb(getByExactPath(tree, path) || getByPath(tree, path));
                })
                .catch(function () {
                    cb(null);
                });
            return;
        }

        let content = getByPath(tree, path);
        if (!content || (!content.children && !content.empty)) {
            loadContent(path).then(function (data) {
                if (!tree.path) {
                    tree = _.merge(tree, data);
                } else if (data.children) {
                    setToPath(tree, path, data);
                    if (!_.find(data.children, 'path')) {
                        // no subfolders inside folder
                        markFolderEmptyAtPath(tree, path);
                    }
                } else {
                    setToPath(tree, path, data);
                    markFolderEmptyAtPath(tree, path);
                }
                cb(data);
            }).catch(function () {
                cb(null);
            });
        } else if (content.children) {
            const files = _.filter(content.children, function (item) {
                return !!item.uri;
            });
            // Use folder total (not selectedClass): openInitialPath runs before selectFolder.
            const expectedTotal = Number(content.total);
            const pageSize = Number(content.childrenLimit) || selectedClass.childrenLimit || 11;
            const page = selectedClass.page || 1;
            // Missing/NaN total → unknown size; refetch so invalidated cache is not treated as complete.
            if (
                !Number.isFinite(expectedTotal) ||
                (files.length < expectedTotal && files.length < page * pageSize)
            ) {
                loadContent(path).then(function (data) {
                    const loadedFiles = _.filter(data.children, function (item) {
                        return !!item.uri;
                    });
                    const node = getByExactPath(tree, path);
                    if (node && !Number.isFinite(expectedTotal)) {
                        node.children = _.filter(node.children, function (item) {
                            return !item.uri;
                        });
                    }
                    setToPath(tree, path, {
                        children: loadedFiles,
                        total: data.total,
                        childrenLimit: data.childrenLimit
                    });
                    content = getByExactPath(tree, path) || getByPath(tree, path);
                    cb(content);
                }).catch(function () {
                    cb(content);
                });
            } else {
                cb(content);
            }
        } else {
            cb(content);
        }
    }

    /**
     * Sets the tree level for each node in the tree.
     * @param {object} tree - the tree model
     * @param {number} level - the root level
     */
    function indexTree(tree, level = 0) {
        if (!tree) {
            return;
        }
        tree.level = level;
        if (tree.children) {
            _.forEach(tree.children, child => indexTree(child, level + 1));
        }
    }

    /**
     * Get a subTree from a path
     * @param {Object} tree - the tree model
     * @param {String} path - the path (relative to the root)
     * @returns {Object} the subtree that matches the path
     */
    function getByPath(tree, path) {
        let match;
        if (tree) {
            if (tree.path && tree.path.indexOf(path) === 0) {
                match = tree;
            } else if (tree.children) {
                _.forEach(tree.children, function (child) {
                    match = getByPath(child, path);
                    if (match) {
                        return false;
                    }
                });
            }
        }
        return match;
    }

    /**
     * Get a subtree by exact path equality.
     * @param {Object} tree
     * @param {String} path
     * @returns {Object|undefined}
     */
    function getByExactPath(tree, path) {
        let match;
        if (tree) {
            if (tree.path === path) {
                match = tree;
            } else if (tree.children) {
                _.forEach(tree.children, function (child) {
                    match = getByExactPath(child, path);
                    if (match) {
                        return false;
                    }
                });
            }
        }
        return match;
    }

    /**
     * Merge data into at into the subtree
     * @param {Object} tree - the tree model
     * @param {String} path - the path (relative to the root)
     * @param {Object} data - the sbutree to merge at path level
     * @returns {Boolean}  true if done
     */
    function setToPath(tree, path, data) {
        let done = false;
        if (tree) {
            if (tree.path === path) {
                tree.children = tree.children ? tree.children.concat(data.children) : data.children;
                if (Object.prototype.hasOwnProperty.call(data, 'total')) {
                    tree.total = data.total;
                }
                if (Object.prototype.hasOwnProperty.call(data, 'childrenLimit')) {
                    tree.childrenLimit = data.childrenLimit;
                }
            } else if (tree.children) {
                _.forEach(tree.children, function (child) {
                    done = setToPath(child, path, data);
                    if (done) {
                        return false;
                    }
                });
            }
        }
        return done;
    }
    /**
     * Remove file from tree
     * @param {Object} tree - the tree model
     * @param {String} path - the path (relative to the root)
     * @returns {boolean} is file removed
     */
    function removeFromPath(tree, path) {
        let done = false;
        let removed = [];
        if (tree && tree.children) {
            removed = _.remove(tree.children, function (child) {
                return child.path === path || (child.name && tree.path + child.name === path) || child.uri === path;
            });
            done = removed.length > 0;
            if (done) {
                if (Number.isFinite(Number(tree.total))) {
                    tree.total = Math.max(0, Number(tree.total) - removed.length);
                }
            } else {
                _.forEach(tree.children, function (child) {
                    done = removeFromPath(child, path);
                    if (done) {
                        return false;
                    }
                });
            }
        }
        return done;
    }

    /**
     * Drop cached file rows for a folder so the next load hits the service
     * with the current sort. Nested folder nodes are kept.
     * @param {String} path
     */
    function invalidateFolderFiles(path) {
        const content = getByExactPath(fileTree, path);
        if (!content) {
            return;
        }
        if (splitBrowse) {
            delete content.listItems;
            delete content.listCacheKey;
            delete content.listPage;
            return;
        }
        if (Array.isArray(content.children)) {
            content.children = content.children.filter(function (child) {
                return child.path && !child.uri;
            });
        }
    }

    /**
     * Replace a folder node with a freshly loaded payload (files + folders).
     * @param {String} path
     * @param {Object} data
     */
    function replaceFolderContent(path, data) {
        const content = getByExactPath(fileTree, path);
        if (!content || !data) {
            return;
        }
        if (splitBrowse && Object.prototype.hasOwnProperty.call(data, 'items')) {
            applyListPayload(fileTree, path, data, listCacheKey());
            return;
        }
        if (Object.prototype.hasOwnProperty.call(data, 'children')) {
            content.children = data.children;
        } else {
            content.children = [];
            content.empty = true;
            content.total = 0;
        }
        if (Object.prototype.hasOwnProperty.call(data, 'total')) {
            content.total = data.total;
        }
        if (Object.prototype.hasOwnProperty.call(data, 'childrenLimit')) {
            content.childrenLimit = data.childrenLimit;
        }
        if (data.label) {
            content.label = data.label;
        }
        if (data.path) {
            content.path = data.path;
        }
    }

    /**
     * Get the content of a folder
     * @param {String} path - the folder path
     * @returns {Promise} resolves with folder content
     */
    function loadContent(path) {
        const parameters = {};
        parameters[options.pathParam || 'path'] = path;
        setTreeLoading(true);
        return Promise.resolve(
            $.ajax({
                url: options.browseUrl,
                method: 'GET',
                dataType: 'json',
                timeout: ajaxTimeoutMs,
                data: _.merge(parameters, options.params, {
                    // depth=2 so each rendered child folder includes its own dir children,
                    // allowing leaf folders to hide the expand chevron without an extra click.
                    depth: 2,
                    childrenOffset: (selectedClass.page - 1) * selectedClass.childrenLimit,
                    sortBy: sort.field,
                    sortDir: sort.direction
                })
            })
        )
            .then(function (response) {
                if (response && response.success === false) {
                    return Promise.reject(response);
                }
                let data = response && response.data ? response.data : response;
                data = updatePermissions(data);
                if (data.children && data.children.length > 0) {
                    data.children.map(responseChildren => updatePermissions(responseChildren));
                }
                return data;
            })
            .then(
                function (data) {
                    setTreeLoading(false);
                    return data;
                },
                function (error) {
                    setTreeLoading(false);
                    return Promise.reject(error);
                }
            );
    }

    /**
     * Whether a folder node has nested directory children.
     * @param {Object} node
     * @returns {boolean|null} true/false when known; null when children were not loaded yet
     */
    function hasNestedFolderChildren(node) {
        if (!node || node.empty === true) {
            return false;
        }
        if (!Array.isArray(node.children)) {
            return null;
        }
        return Boolean(_.find(node.children, 'path'));
    }

    /**
     * Show or hide the expand chevron on a folder anchor (keep spacer width).
     * @param {jQuery} $anchor
     * @param {boolean} hasNested
     */
    function setFolderToggleState($anchor, hasNested) {
        const $toggle = $anchor.children('.tree-toggle');
        if (hasNested) {
            $toggle.addClass('icon-right').removeClass('is-leaf');
            $anchor.removeClass('is-leaf');
        } else {
            $toggle.removeClass('icon-right').addClass('is-leaf');
            $anchor.removeClass('opened').addClass('is-leaf');
        }
    }

    /**
     * Update the HTML Tree
     * @param {Object} data - the tree data
     * @param {jQueryElement} $parent - the parent node to append the data
     * @param {Boolean} [recurse] - internal recursive condition
     */
    function updateFolders(data, $parent, recurse) {
        if (recurse && data && data.path) {
            if (typeof data.relPath === 'undefined') {
                data.relPath = data.path;
            }
            // Unknown nested state (lazy depth) keeps the chevron until the folder is opened.
            data.showToggle = hasNestedFolderChildren(data) !== false;
            $parent.append(folderTpl(data));
            return;
        }
        if (data && data.children && _.isArray(data.children) && !data.empty) {
            _.forEach(data.children, function (child) {
                updateFolders(child, $parent, true);
            });
        }
    }

    /**
     * Update the selectedClass
     * @param {String} path - the folder path
     * @param {Number} total - files in class
     * @param {Number} childrenLimit - page size
     */
    function updateSelectedClass(path, total, childrenLimit) {
        const normalizedTotal = Number(total);
        const normalizedChildrenLimit = Number(childrenLimit);

        selectedClass = {
            path,
            total: Number.isFinite(normalizedTotal) && normalizedTotal >= 0 ? normalizedTotal : 0,
            childrenLimit:
                Number.isFinite(normalizedChildrenLimit) && normalizedChildrenLimit > 0
                    ? normalizedChildrenLimit
                    : selectedClass.childrenLimit || 11,
            page: 1
        };
    }
    /**
     * Render pagination
     */
    function renderPagination() {
        if (searchMode) {
            // Drop browse pagination controls/handlers when search owns the table.
            $paginationContainer.empty();
            return;
        }
        const total = Number(selectedClass.total);
        const childrenLimit = Number(selectedClass.childrenLimit);

        $paginationContainer.empty();

        if (!Number.isFinite(total) || !Number.isFinite(childrenLimit) || childrenLimit <= 0) {
            return;
        }

        const totalPages = Math.ceil(total / childrenLimit);

        if (total > 0 && totalPages > 1) {
            paginationComponent({
                mode: 'simple',
                activePage: selectedClass.page,
                totalPages
            })
                .on('prev', function () {
                    selectedClass.page--;
                    loadPage();
                })
                .on('next', function () {
                    selectedClass.page++;
                    loadPage();
                })
                .render($paginationContainer);
        }
    }
    /**
     * Re-fetch the current folder with the active sort and publish files.
     */
    function reloadSortedFolder(pendingUploads) {
        const path = selectedClass.path;
        if (!searchMode && isActiveBrowser()) {
            setFilesLoading(true);
        }
        const loadPromise = splitBrowse
            ? browseRequest(path, {
                part: 'list',
                page: selectedClass.page,
                pageSize: selectedClass.childrenLimit || 11,
                sortBy: sort.field,
                sortDir: sort.direction
            })
            : loadContent(path);

        loadPromise
            .then(function (data) {
                if (!data) {
                    setFilesLoading(false);
                    return;
                }
                replaceFolderContent(path, data);
                mergePendingUploads(path, pendingUploads);
                const content = getByExactPath(fileTree, path) || data;
                selectFolder(content, content.path || path);
            })
            .catch(function (error) {
                LOGGER.error(error);
                setFilesLoading(false);
            });
    }

    /**
     * Load page
     */
    function loadPage() {
        if (!searchMode && isActiveBrowser()) {
            setFilesLoading(true);
        }

        if (splitBrowse) {
            const path = selectedClass.path;
            browseRequest(path, {
                part: 'list',
                page: selectedClass.page,
                pageSize: selectedClass.childrenLimit || 11,
                sortBy: sort.field,
                sortDir: sort.direction
            })
                .then(function (data) {
                    applyListPayload(fileTree, path, data, listCacheKey());
                    const content = getByExactPath(fileTree, path);
                    if (content) {
                        $container.trigger(`folderselect.${NS}`, [
                            content.label,
                            getFilesForDisplay(content),
                            content.path,
                            content
                        ]);
                        renderPagination();
                    }
                    setFilesLoading(false);
                })
                .catch(function (error) {
                    LOGGER.error(error);
                    setFilesLoading(false);
                });
            return;
        }

        const subTree = getByPath(fileTree, selectedClass.path) || fileTree;

        //get the folder content
        getFolderContent(subTree, selectedClass.path, function (content) {
            indexTree(fileTree);

            if (content) {
                //internal event to set the file-selector content
                $container.trigger(`folderselect.${NS}`, [
                    content.label,
                    getFilesForDisplay(content),
                    content.path,
                    content
                ]);
            }
            if (!searchMode) {
                setFilesLoading(false);
            }
        });
    }
}
