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
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 *
 * Copyright (c) 2018-2020 (original work) Open Assessment Technologies SA;
 */
import $ from 'jquery';
import _ from 'lodash';
import request from 'core/request';
import paginationComponent from 'ui/pagination';
import rootFolderTpl from 'ui/resourcemgr/tpl/rootFolder';
import folderTpl from 'ui/resourcemgr/tpl/folder';
import updatePermissions from './util/updatePermissions';

const ns = 'resourcemgr';

export default function (options) {
    const root = options.root || 'local';
    const rootPath = options.path || '/';
    const $container = options.$target;
    const $fileBrowser = $('.file-browser .file-browser-wrapper', $container);
    const $divContainer = $(`.${root}`, $fileBrowser);
    const $folderContainer = $('.folders', $divContainer);
    const fileTree = {};
    // for pagination
    let selectedClass = {
        path: rootPath,
        childrenLimit: 10,
        total: 0,
        page: 1
    };

    //load the content of the ROOT
    getFolderContent(fileTree, rootPath, function (content) {
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

        if (content.permissions.read && !options.hasAlreadySelected) {
            $('.file-browser').find('li.active').removeClass('active');
            updateSelectedClass(content.path, content.total, content.childrenLimit);
            $container.trigger('folderselect.'.concat(ns), [
                content.label,
                getPage(content.children),
                content.path,
                content
            ]);
            renderPagination();

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
                updateSelectedClass(fullPath, subTree.total, $selected.data('children-limit'));
                $container.trigger(`folderselect.${ns}`, [
                    content.label,
                    getPage(content.children),
                    content.path,
                    content
                ]);
                renderPagination();
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
                subTree.total++;
                selectedClass.total++;
                $container.trigger(`folderselect.${ns}`, [subTree.label, getPage(subTree.children), path]);
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
     * Get files for page
     * @param {Array} children
     * @returns {Array} files for this page
     */
    function getPage(children) {
        const files = _.filter(children, function (item) {
            return !!item.uri;
        });
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
                    setToPath(tree, path, { children: loadedFiles });
                    content = getByPath(tree, path);
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
                tree.total = data.total;
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
     * Get the content of a folder
     * @param {String} path - the folder path
     * @returns {jQuery.Deferred} the defferred object to run done/complete/fail
     */
    function loadContent(path) {
        const parameters = {};
        parameters[options.pathParam] = path;
        return request({
            url: options.browseUrl,
            method: 'GET',
            dataType: 'json',
            data: _.merge(parameters, options.params, {
                childrenOffset: (selectedClass.page - 1) * selectedClass.childrenLimit
            }),
            noToken: true
        })
            .then(response => response.data)
            .then(response => {
                response = updatePermissions(response);
                if (response.children && response.children.length > 0) {
                    response.children.map(responseChildren => updatePermissions(responseChildren));
                }
                return response;
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
        selectedClass = {
            path,
            total,
            childrenLimit,
            page: 1
        };
    }
    /**
     * Render pagination
     */
    function renderPagination() {
        const $paginationContainer = $('.pagination-bottom', $container);
        $paginationContainer.empty();
        const totalPages = Math.ceil(selectedClass.total / selectedClass.childrenLimit);

        if (selectedClass.total && totalPages > 1) {
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
     * Load page
     */
    function loadPage() {
        const subTree = getByPath(fileTree, selectedClass.path);

        //get the folder content
        getFolderContent(subTree, selectedClass.path, function (content) {
            indexTree(fileTree);

            if (content) {
                //internal event to set the file-selector content
                $container.trigger(`folderselect.${ns}`, [content.label, getPage(content.children), content.path]);
            }
        });
    }
}
