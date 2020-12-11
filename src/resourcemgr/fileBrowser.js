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
import paginationComponent from 'ui/pagination';
import rootFolderTpl from 'ui/resourcemgr/tpl/rootFolder';
import folderTpl from 'ui/resourcemgr/tpl/folder';

const ns = 'resourcemgr';

export default function (options) {
    const root = options.root || '/';
    const path = options.path || '/';
    const $container = options.$target;
    const $fileBrowser = $('.file-browser .file-browser-wrapper', $container);
    const $divContainer = $('.' + root, $fileBrowser);
    const $folderContainer = $('.folders', $divContainer);
    const fileTree = {};
    // for pagination
    let selectedClass = {
        path: path,
        limit: 10,
        total: 0,
        page: 1
    };

    //load the content of the ROOT
    getFolderContent(fileTree, path, function (content) {
        //create the tree node for the ROOT folder by default once the initial content loaded
        $folderContainer.append(rootFolderTpl(content));

        const $rootNode = $('.root-folder', $folderContainer);
        //create an inner list and append found elements
        const $innerList = $('.root ul', $folderContainer);
        if (content.children) {
            $rootNode.addClass('opened');
        }
        updateFolders(content, $innerList);
        //internal event to set the file-selector content
        $('.file-browser').find('li.active').removeClass('active');
        $container.trigger('folderselect.' + ns, [content.label, getPage(content.children), content.path]);
        updateSelectedClass(content.path, content.total, content.limit);
        renderPagination($container, content);
    });

    // by clicking on the tree (using a live binding  because content is not complete yet)
    $divContainer.off('click', '.folders a').on('click', '.folders a', function (e) {
        e.preventDefault();
        const $selected = $(this);
        const $folders = $('.folders li', $fileBrowser);
        const fullPath = $selected.data('path');
        updateSelectedClass(fullPath, $selected.data('total'), $selected.data('limit'));
        const subTree = getByPath(fileTree, fullPath);

        //get the folder content
        getFolderContent(subTree, fullPath, function (content) {
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
                $container.trigger('folderselect.' + ns, [content.label, getPage(content.children), content.path]);
                renderPagination($container, content);
            }
        });
    });

    $container.on('filenew.' + ns, function (e, file, path) {
        const subTree = getByPath(fileTree, path);
        if (subTree) {
            if (!subTree.children) {
                subTree.children = [];
            }
            if (!_.find(subTree.children, { name: file.name })) {
                subTree.children.push(file);
                $container.trigger('folderselect.' + ns, [subTree.label, getPage(subTree.children), path]);
            }
        }
    });

    $container.on('filedelete.' + ns, function (e, path) {
        removeFromPath(fileTree, path);
    });
    /**
     * Get files for page
     * @param {Array} children
     * @return {Array} children for this page
     */
    function getPage(children) {
        const files = _.filter(children, function (item) {
            return !!item.uri;
        });
        if (selectedClass.limit) {
            return files.slice(
                (selectedClass.page - 1) * selectedClass.limit,
                selectedClass.page * selectedClass.limit
            );
        }
        return files;
    }
    /**
     * Get the content of a folder, either in the model or load it
     * @param {Object} tree - the tree model
     * @param {String} path - the folder path (relative to the root)
     * @param {Function} cb- called back with the content in 1st parameter
     */
    function getFolderContent(tree, path, cb) {
        let content = getByPath(tree, path);
        if (!content || (!content.children && !content.empty)) {
            loadContent(path).done(function (data) {
                if (!tree.path) {
                    tree = _.merge(tree, data);
                } else if (data.children) {
                    if (!_.find(content.children, 'path')) {
                        tree.empty = true;
                    }
                    setToPath(tree, path, data.children);
                } else {
                    tree.empty = true;
                }
                cb(data);
            });
        } else if (
            content.children &&
            !content.empty &&
            content.children.length < selectedClass.page * selectedClass.limit
        ) {
            loadContent(path).done(function (data) {
                const files = _.filter(data.children, function (item) {
                    return !!item.uri;
                });
                setToPath(tree, path, files);
                content = getByPath(tree, path);
                cb(content);
            });
        } else {
            cb(content);
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
                tree.children = tree.children ? tree.children.concat(data) : data;
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
        return $.getJSON(
            options.browseUrl,
            _.merge(parameters, options.params, { offset: (selectedClass.page - 1) * selectedClass.limit })
        );
    }

    /**
     * Update the HTML Tree
     * @param {Object} data - the tree data
     * @param {jQueryElement} $parent - the parent node to append the data
     * @param {Boolean} [recurse] - internal recursive condition
     */
    function updateFolders(data, $parent, recurse) {
        if (recurse && data && data.path) {
            if (data.relPath === undefined) {
                data.relPath = data.path;
            }
            $(folderTpl(data)).appendTo($parent);
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
     * @param {Number} limit - page size
     */
    function updateSelectedClass(path, total, limit) {
        selectedClass = {
            path,
            total,
            limit,
            page: 1
        };
    }
    /**
     * Render pagination
     * @param {jQueryElement} $container - container for pagination component
     * @param {Object} data
     */
    function renderPagination($container) {
        const $paginationContainer = $('.pagination-bottom', $container);
        $paginationContainer.empty();
        const totalPages = Math.ceil(selectedClass.total / selectedClass.limit);

        if (selectedClass.total && totalPages > 1) {
            paginationComponent({
                mode: 'simple',
                activePage: selectedClass.page,
                totalPages
            })
                .on('prev', function () {
                    selectedClass.page--;
                    loadNewPage();
                })
                .on('next', function () {
                    selectedClass.page++;
                    loadNewPage();
                })
                .render($paginationContainer);
        }
    }
    /**
     * Load new page
     */
    function loadNewPage() {
        const subTree = getByPath(fileTree, selectedClass.path);

        //get the folder content
        getFolderContent(subTree, selectedClass.path, function (content) {
            if (content) {
                //internal event to set the file-selector content
                $container.trigger('folderselect.' + ns, [content.label, getPage(content.children), content.path]);
            }
        });
    }
}
