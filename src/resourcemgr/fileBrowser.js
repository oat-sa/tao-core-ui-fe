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
import updatePermissions from './util/updatePermissions';
import { DEFAULT_SORT, sortAssetItems } from 'ui/resourcemgr/assetSearchContract';

const ns = 'resourcemgr';

export default function (options) {
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
        childrenLimit: 10,
        total: 0,
        page: 1
    };
    let searchMode = false;
    let sort = Object.assign({}, DEFAULT_SORT);

    $container.on(`searchmode.${ns}`, function (e, enabled) {
        searchMode = !!enabled;
    });

    $container.on(`sortchange.${ns}`, function (e, nextSort) {
        sort = Object.assign({}, DEFAULT_SORT, nextSort || {});
        selectedClass.page = 1;
        invalidateFolderFiles(selectedClass.path);
        if (searchMode || !isActiveBrowser()) {
            return;
        }
        reloadSortedFolder();
    });

    $container.on(`searchclear.${ns}`, function (e, path) {
        const targetPath = path || selectedClass.path;
        selectedClass.page = 1;
        invalidateFolderFiles(targetPath);
        if (!isActiveBrowser()) {
            return;
        }
        const subTree = getByPath(fileTree, targetPath) || fileTree;
        getFolderContent(subTree, targetPath, function (content) {
            if (content) {
                selectFolder(content, targetPath);
            }
        });
    });

    //load the content of the ROOT
    getFolderContent(fileTree, rootPath, function (content) {
        if (!content) {
            return;
        }
        indexTree(content);

        //create the tree node for the ROOT folder by default once the initial content loaded
        $folderContainer.append(rootFolderTpl(content));

        const $rootNode = $('.root-folder', $folderContainer);
        //create an inner list and append found elements
        const $innerList = $('.root ul', $folderContainer);
        if (content.children) {
            $rootNode.addClass('opened');
        }
        updateFolders(content, $innerList);

        if (content.permissions && content.permissions.read && !options.hasAlreadySelected) {
            if (initialPath && initialPath !== rootPath) {
                openInitialPath(initialPath);
            } else {
                selectFolder(content, content.path);
            }

            if (root !== 'local') {
                options.hasAlreadySelected = true;
            }
        }
    });

    // by clicking on the tree (using a live binding  because content is not complete yet)
    $divContainer.off('click', '.folders a').on('click', '.folders a', function (e) {
        e.preventDefault();
        const $selected = $(this);
        const $folders = $('.folders li', $fileBrowser);
        const fullPath = $selected.data('path');
        const subTree = getByPath(fileTree, fullPath);

        //get the folder content
        getFolderContent(subTree, fullPath, function (content) {
            indexTree(fileTree);

            if (content) {
                //either create the inner list of the content is new or just show it
                let $innerList = $selected.siblings('ul');
                if (!$innerList.length && content.children && _.find(content.children, 'path') && !content.empty) {
                    $innerList = $('<ul></ul>').insertAfter($selected);
                    updateFolders(content, $innerList);
                    $selected.addClass('opened');
                } else if ($innerList.length) {
                    if ($innerList.css('display') === 'none') {
                        $innerList.show();
                        $selected.addClass('opened');
                    } else if ($selected.parent('li').hasClass('active')) {
                        $innerList.hide();
                        $selected.removeClass('opened');
                    }
                }

                //toggle active element
                $folders.removeClass('active');
                $selected.parent('li').addClass('active');

                //internal event to set the file-selector content
                selectFolder(content, fullPath);
            }
        });
    });

    $container.on(`filenew.${ns}`, function (e, file, path) {
        const subTree = getByPath(fileTree, path);
        if (subTree) {
            if (!subTree.children) {
                subTree.children = [];
            }
            if (root !== 'local' || !_.find(subTree.children, { name: file.name })) {
                updatePermissions(file);
                const childrenFilesOnly = _.filter(subTree.children, function (child) {
                    // Only file object has link property
                    return Object.prototype.hasOwnProperty.call(child, 'link');
                });

                if (childrenFilesOnly.length === subTree.total) {
                    // all children loaded new file can be pushed to the end of tree
                    // if not all, new file will be loaded with next page
                    subTree.children.push(file);
                }
                subTree.total = Number.isFinite(Number(subTree.total)) ? Number(subTree.total) + 1 : 1;
                if (selectedClass.path === path) {
                    selectedClass.total = subTree.total;
                }
                $container.trigger(`folderselect.${ns}`, [subTree.label, getPage(subTree.children), path, subTree]);
                renderPagination();
            }
        }
    });

    $container.on(`filedelete.${ns}`, function (e, path) {
        if (removeFromPath(fileTree, path)) {
            selectedClass.total--;
            loadPage();
        }
    });

    /**
     * Open and select an initial folder path after the root tree is available.
     * @param {String} path
     */
    function openInitialPath(path) {
        getFolderContent(fileTree, path, function (content) {
            indexTree(fileTree);
            if (!content) {
                const rootContent = getByPath(fileTree, rootPath) || fileTree;
                selectFolder(rootContent, rootContent.path || rootPath);
                return;
            }

            // Expand ancestors when possible and mark the target active.
            const $targetLink = $folderContainer.find('a').filter(function () {
                return $(this).data('path') === path;
            });
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
                $('.folders li', $fileBrowser).removeClass('active');
                $targetLink.parent('li').addClass('active');
            }

            selectFolder(content, path);
        });
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
        if (searchMode || !content) {
            return;
        }
        $container.data('activeFileBrowserRoot', root);
        updateSelectedClass(path, content.total, content.childrenLimit);
        $container.trigger(`folderpath.${ns}`, [path, content.label]);
        $container.trigger(`folderselect.${ns}`, [
            content.label,
            getPage(content.children || []),
            path,
            content
        ]);
        renderPagination();
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
     * Get the content of a folder, either in the model or load it
     * @param {Object} tree - the tree model
     * @param {String} path - the folder path (relative to the root)
     * @param {Function} cb - called back with the content in 1st parameter
     */
    function getFolderContent(tree, path, cb) {
        let content = getByPath(tree, path);
        if (!content || (!content.children && !content.empty)) {
            loadContent(path).then(function (data) {
                if (!tree.path) {
                    tree = _.merge(tree, data);
                } else if (data.children) {
                    if (!_.find(data.children, 'path')) {
                        // no subfolders inside folder
                        tree.empty = true;
                    }
                    setToPath(tree, path, data);
                } else {
                    tree.empty = true;
                }
                cb(data);
            }).catch(function () {
                cb(null);
            });
        } else if (content.children) {
            const files = _.filter(content.children, function (item) {
                return !!item.uri;
            });
            // if files less then total and need toload this page
            if (files.length < selectedClass.total && files.length < selectedClass.page * selectedClass.childrenLimit) {
                loadContent(path).then(function (data) {
                    const loadedFiles = _.filter(data.children, function (item) {
                        return !!item.uri;
                    });
                    setToPath(tree, path, {
                        children: loadedFiles,
                        total: data.total,
                        childrenLimit: data.childrenLimit
                    });
                    content = getByPath(tree, path);
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
            tree.total--;
            if (!done) {
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
        const content = getByPath(fileTree, path);
        if (content && Array.isArray(content.children)) {
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
        const content = getByPath(fileTree, path);
        if (!content || !data) {
            return;
        }
        if (data.children) {
            content.children = data.children;
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
        return Promise.resolve(
            $.ajax({
                url: options.browseUrl,
                method: 'GET',
                dataType: 'json',
                data: _.merge(parameters, options.params, {
                    childrenOffset: (selectedClass.page - 1) * selectedClass.childrenLimit,
                    sortBy: sort.field,
                    sortDir: sort.direction
                })
            })
        ).then(function (response) {
            if (response && response.success === false) {
                return Promise.reject(response);
            }
            let data = response && response.data ? response.data : response;
            data = updatePermissions(data);
            if (data.children && data.children.length > 0) {
                data.children.map(responseChildren => updatePermissions(responseChildren));
            }
            return data;
        });
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
            $parent.append(folderTpl(data));
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
                    : selectedClass.childrenLimit || 10,
            page: 1
        };
    }
    /**
     * Render pagination
     */
    function renderPagination() {
        if (searchMode) {
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
    function reloadSortedFolder() {
        const path = selectedClass.path;
        loadContent(path).then(function (data) {
            if (!data) {
                return;
            }
            replaceFolderContent(path, data);
            const content = getByPath(fileTree, path) || data;
            selectFolder(content, content.path || path);
        });
    }

    /**
     * Load page
     */
    function loadPage() {
        const subTree = getByPath(fileTree, selectedClass.path) || fileTree;

        //get the folder content
        getFolderContent(subTree, selectedClass.path, function (content) {
            indexTree(fileTree);

            if (content) {
                //internal event to set the file-selector content
                $container.trigger(`folderselect.${ns}`, [content.label, getPage(content.children), content.path, content]);
            }
        });
    }
}
