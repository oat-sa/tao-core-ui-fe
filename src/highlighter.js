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
 * Copyright (c) 2016-2021 (original work) Open Assessment Technologies SA;
 */
/**
 * Highlighter helper: wraps every text node found within a Range object.
 *
 * @author Christophe Noël <christophe@taotesting.com>
 */
import _ from 'lodash';
import $ from 'jquery';

/**
 * Data attribute used to logically group the wrapping nodes into a single selection
 * @type {string}
 */
var GROUP_ATTR = 'data-hl-group';

/**
 * Children of those nodes types cannot be highlighted
 * @type {string[]}
 */
var defaultBlackList = ['textarea', 'math', 'script', '.select2-container'];

/**
 * @param {Object} options
 * @param {String} options.className - name of the class that will be used by the wrappers tags to highlight text
 * @param {String} options.containerSelector - allows to select the root Node in which highlighting is allowed
 * @param {Array<String>} [options.containersBlackList] - additional blacklist selectors to be added to module instance's blacklist
 * @param {Array<String>} [options.containersWhiteList] - whitelist selectors; supported only in `keepEmptyNodes` mode
 * @param {Boolean} [options.clearOnClick] - clear single highlight node on click
 * @param {Object} [options.colors] - keys is keeping as the "c" value of storing/restore the highlighters for indexing, values are wrappers class names
 * @param {Boolean} [options.keepEmptyNodes] - retain original dom structure as far as possible and do not remove empty nodes if they were not created by highlighter
 * @returns {Object} - the highlighter instance
 */
export default function (options) {
    var className = options.className;
    var containerSelector = options.containerSelector;
    var keepEmptyNodes = options.keepEmptyNodes;

    let highlightingClasses = [className];

    // Multi-color mode
    if (options.colors) {
        highlightingClasses = Object.values(options.colors);
    }

    /**
     * list of node selectors which should NOT receive any highlighting from this instance
     * an optional passed-in blacklist is merged with local defaults
     * @type {Array}
     */
    var containersBlackList = _.union(defaultBlackList, options.containersBlackList);
    var containersBlackListSelector = containersBlackList.join(', ');
    var containersWhiteListSelector = null;
    var containersBlackAndWhiteListSelector = containersBlackListSelector;
    if (options.keepEmptyNodes && options.containersWhiteList) {
        containersWhiteListSelector = options.containersWhiteList.join(', ');
        containersBlackAndWhiteListSelector = _.union(containersBlackList, options.containersWhiteList).join(', ');
    }

    /**
     * used in recursive loops to decide if we should wrap or not the current node
     * @type {boolean}
     */
    var isWrapping = false;

    /**
     * performance improvement to break out of a potentially big recursive loop once the wrapping has ended
     * @type {boolean}
     */
    var hasWrapped = false;

    /**
     * used in recursive loops to assign a group Id to the current wrapped node
     * @type {number}
     */
    var currentGroupId;

    /**
     * used in recursive loops to build the index of text nodes
     * @type {number}
     */
    var textNodesIndex;

    /**
     * Returns the node in which highlighting is allowed
     * @returns {Element}
     */
    function getContainer() {
        return $(containerSelector).get(0);
    }

    /**
     * Returns all highlighted nodes
     * @returns {JQuery<HTMLElement>}
     */
    function getHighlightedNodes() {
        return $(containerSelector).find(`.${highlightingClasses.join(',.')}`);
    }

    /**
     * Attach data to wrapper node.
     * Use it when deleting this highlight to know if highlight content should be merged with neighbour text nodes or not.
     * Needed to keep markup the same as it was before highlighting.
     * @param {HTMLElement} node
     * @param {Boolean} beforeWasSplit
     * @param {Boolean} afterWasSplit
     */
    function addSplitData(node, beforeWasSplit, afterWasSplit) {
        node.dataset.beforeWasSplit = beforeWasSplit;
        node.dataset.afterWasSplit = afterWasSplit;
    }

    /**
     * Highlight all text nodes within each given range
     * @param {Range[]} ranges - array of ranges to highlight, may be given by the helper selector.getAllRanges()
     */
    function highlightRanges(ranges) {
        ranges.forEach(function (range) {
            var rangeInfos;

            if (isRangeValid(range)) {
                currentGroupId = getAvailableGroupId();

                // easy peasy: highlighting a plain text without any DOM nodes
                // NOTE: The condition checks the whole node content and not a selected content in a given range, that allows to wrap whitespace
                if (
                    isWrappable(range.commonAncestorContainer) &&
                    !isWrappingNode(range.commonAncestorContainer.parentNode)
                ) {
                    const wrapperNode = getWrapper(currentGroupId);
                    if (!keepEmptyNodes) {
                        range.surroundContents(wrapperNode);
                    } else {
                        addSplitData(wrapperNode, range.startOffset > 0, range.endOffset < range.commonAncestorContainer.length);
                        rangeSurroundContentsNoEmptyNodes(range, wrapperNode);
                    }
                } else if (
                    isWrappable(range.commonAncestorContainer) &&
                    isWrappingNode(range.commonAncestorContainer.parentNode) &&
                    range.commonAncestorContainer.parentNode !== className
                ) {
                    highlightContainerNodes(range.commonAncestorContainer, className, range, currentGroupId);

                    // now the fun stuff: highlighting a mix of text and DOM nodes
                } else {
                    rangeInfos = {
                        startNode: isElement(range.startContainer)
                            ? range.startContainer.childNodes[range.startOffset]
                            : range.startContainer,
                        startNodeContainer: range.startContainer,
                        startOffset: range.startOffset,

                        endNode: isElement(range.endContainer)
                            ? range.endContainer.childNodes[range.endOffset - 1]
                            : range.endContainer,
                        endNodeContainer: range.endContainer,
                        endOffset: range.endOffset,
                        commonRange: range
                    };

                    isWrapping = false;
                    hasWrapped = false;
                    wrapTextNodesInRange(range.commonAncestorContainer, rangeInfos);
                }
            }

            if (!keepEmptyNodes) {
                // clean up the markup after wrapping...
                range.commonAncestorContainer.normalize();
            }

            currentGroupId = 0;
            isWrapping = false;
            reindexGroups(getContainer());
            mergeAdjacentWrappingNodes(getContainer());
            unWrapEmptyHighlights();
        });

        if (options.clearOnClick) {
            $(containerSelector + ' .' + className)
                .off('click')
                .on('click', clearSingleHighlight);
        }
    }

    /**
     * Check if a range is valid
     * @param {Range} range
     * @returns {boolean}
     */
    function isRangeValid(range) {
        var rangeInContainer;
        try {
            rangeInContainer =
                $.contains(getContainer(), range.commonAncestorContainer) ||
                getContainer().isSameNode(range.commonAncestorContainer);

            return rangeInContainer && !range.collapsed;
        } catch (e) {
            return false;
        }
    }

    /**
     * Core wrapping function. Traverse the DOM tree and highlight (= wraps) all text nodes within the given range.
     * Recursive.
     *
     * @param {Node} rootNode - top of the node hierarchy in which text nodes will be searched
     * @param {Object} rangeInfos
     * @param {Node} rangeInfos.startNode - node on which the selection starts
     * @param {Node} rangeInfos.startNodeContainer - container of the startNode, or the start node itself in case of text nodes
     * @param {number} rangeInfos.startOffset - same as range.startOffset, but not read-only to allow override
     * @param {Node} rangeInfos.endNode - node on which the selection ends
     * @param {Node} rangeInfos.endNodeContainer - container of the endNode, or the end node itself in case of text nodes
     * @param {number} rangeInfos.endOffset - same as range.endOffset, but not read-only to allow override
     */
    function wrapTextNodesInRange(rootNode, rangeInfos) {
        var childNodes = rootNode.childNodes;
        var currentNode, i;
        var splitDatas = [];

        for (i = 0; i < childNodes.length; i++) {
            if (hasWrapped) {
                break;
            }
            currentNode = childNodes[i];

            const isCurrentNodeTextInsideOfAnotherHighlightingWrapper =
                isText(currentNode) &&
                isWrappingNode(currentNode.parentNode) &&
                currentNode.parentNode.className !== className;

            if (isCurrentNodeTextInsideOfAnotherHighlightingWrapper) {
                const internalRange = new Range();
                internalRange.selectNodeContents(currentNode);

                if (rangeInfos.startNode === currentNode) {
                    internalRange.setStart(currentNode, rangeInfos.startOffset);
                }

                if (rangeInfos.endNode === currentNode) {
                    internalRange.setEnd(currentNode, rangeInfos.endOffset);
                }

                const isNodeInRange = rangeInfos.commonRange.isPointInRange(currentNode, internalRange.endOffset);

                // Apply new highlighting color only for selected nodes
                if (isNodeInRange) {
                    isWrapping = true;
                    highlightContainerNodes(currentNode, className, internalRange, currentGroupId);
                }
            } else {
                // split current node in case the wrapping start/ends on a partially selected text node
                if (currentNode.isSameNode(rangeInfos.startNode)) {
                    if (isText(rangeInfos.startNodeContainer) && rangeInfos.startOffset !== 0) {
                        // we defer the wrapping to the next iteration of the loop
                        //end of node should be highlighted
                        rangeInfos.startNode = currentNode.splitText(rangeInfos.startOffset);
                        rangeInfos.startOffset = 0;
                        splitDatas.push({ node: rangeInfos.startNode, beforeWasSplit: true, afterWasSplit: false });
                    } else {
                        //whole node should be highlighted
                        isWrapping = true;
                        splitDatas.push({ node: currentNode, beforeWasSplit: false, afterWasSplit: false });
                    }
                }

                if (currentNode.isSameNode(rangeInfos.endNode) && isText(rangeInfos.endNodeContainer)) {
                    if (rangeInfos.endOffset !== 0) {
                        if (rangeInfos.endOffset < currentNode.textContent.length) {
                            //start of node should be highlighted
                            currentNode.splitText(rangeInfos.endOffset);
                            splitDatas.push({ node: currentNode, beforeWasSplit: false, afterWasSplit: true });
                        } else {
                            //whole node should be highlighted
                            splitDatas.push({ node: currentNode, beforeWasSplit: false, afterWasSplit: false });
                        }
                    } else {
                        isWrapping = false;
                    }
                }

                // wrap the current node...
                if (isText(currentNode)) {
                    if (!keepEmptyNodes) {
                        wrapTextNode(currentNode, currentGroupId);
                    } else if (willHighlightNotBeEmptyAfterMerge(currentNode)) {
                        const wrapperNode = wrapTextNode(currentNode, currentGroupId);
                        if (wrapperNode) {
                            const splitData = splitDatas.find(d => d.node === currentNode);
                            addSplitData(wrapperNode,
                                splitData ? splitData.beforeWasSplit : false,
                                splitData ? splitData.afterWasSplit : false);
                        }
                    }

                    // ... or continue deeper in the node tree
                } else if (isElement(currentNode)) {
                    wrapTextNodesInRange(currentNode, rangeInfos);
                }
            }

            // end wrapping ?
            if (currentNode.isSameNode(rangeInfos.endNode)) {
                isWrapping = false;
                hasWrapped = true;
                break;
            }
        }
    }

    /**
     * Restructure content of the highlighted wrapper according to the selectedRange
     * @param {Node} textNode
     * @param {string} activeClass
     * @param {Range} selectedRange
     * @param {number} currentGroupId
     */
    function highlightContainerNodes(textNode, activeClass, selectedRange, currentGroupId) {
        const container = textNode.parentNode;
        const range = new Range();
        range.selectNodeContents(textNode);

        const isSelectionCoversNodeStart = range.compareBoundaryPoints(Range.START_TO_START, selectedRange) === 0;
        const isSelectionCoversNodeEnd = range.compareBoundaryPoints(Range.END_TO_END, selectedRange) === 0;

        /*
        There are 4 possible cases selected area is intersected with already highlighted element.
        In examples below the border is represents the selection, "yellow" is class name of already highlighted
        container, "red" is class name of currently active highlighter
        **********************************************************************************************************
        1. The container content is completely selected, so that we only have to change the highlighter class name

        Input:
         __________________________________________________
        |                                                  |
        |<span class="yellow"> Lorem ipsum dolor sit</span>|
        |__________________________________________________|

        Output:
         <span class="red"> Lorem ipsum dolor sit</span>

        **********************************************************************************************************
        2. The container content is partially selected from the begging.

        Input:
         ______________________________
        |                              |
        |<span class="yellow"> Lorem ip|sum dolor sit</span>
        |______________________________|

        Output:
        <span class="red"> Lorem ip</span><span class="yellow">sum dolor sit</span>

        **********************************************************************************************************
        3. The container content is partially selected at the end.

        Input:
                                       ____________________
                                      |                    |
        <span class="yellow"> Lorem ip|sum dolor sit</span>|
                                      |____________________|

        Output:
        <span class="yellow"> Lorem ip</span><span class="red">sum dolor sit</span>

        **********************************************************************************************************
        4. The container content is partially selected in the middle.

        Input:
                                     ___________
                                    |           |
        <span class="yellow"> Lorem |ipsum dolor| sit</span>
                                    |___________|

        Output:
         <span class="yellow"> Lorem </span><span class="red">ipsum dolor</span><span class="yellow"> sit</span>
         */
        if (isSelectionCoversNodeStart && isSelectionCoversNodeEnd) {
            textNode.parentNode.className = activeClass;
        } else if (isSelectionCoversNodeStart) {
            textNode.splitText(selectedRange.endOffset);
            wrapContainerChildNodes(container, 0, activeClass, currentGroupId);
        } else if (isSelectionCoversNodeEnd) {
            textNode.splitText(selectedRange.startOffset);
            wrapContainerChildNodes(container, 1, activeClass, currentGroupId);
        } else {
            textNode.splitText(selectedRange.startOffset).splitText(selectedRange.endOffset);
            wrapContainerChildNodes(container, 1, activeClass, currentGroupId);
        }
    }

    /**
     * Wraps all containers text nodes with highlighter element.
     * The child node with index given by indexToWrapNode parameter will be wrap with class given by activeClass parameter
     * @param {Element} container
     * @param {number} indexToWrapNode
     * @param {string} activeClass
     * @param {number} currentGroupId
     */
    function wrapContainerChildNodes(container, indexToWrapNode, activeClass, currentGroupId) {
        const containerClass = container.className;
        const fragment = new DocumentFragment();
        const childNodesLength = container.childNodes.length;

        container.childNodes.forEach((node, index) => {
            var wrapperNode;
            if (index === indexToWrapNode) {
                wrapperNode = wrapNode(node.cloneNode(), activeClass, currentGroupId);
            } else {
                wrapperNode = wrapNode(node.cloneNode(), containerClass, currentGroupId);
            }
            fragment.appendChild(wrapperNode);

            if (keepEmptyNodes) {
                addSplitData(wrapperNode,
                    index === 0 ? container.dataset.beforeWasSplit : true,
                    index === childNodesLength - 1 ? container.dataset.afterWasSplit : true);
            }
        });

        container.replaceWith(fragment);
    }

    /**
     * wraps a text node into the highlight span
     * @param {Node} node - the node to wrap
     * @param {number} groupId - the highlight group
     * @returns {Node|null} wrapper node, if it was created
     */
    function wrapTextNode(node, groupId) {
        if (isWrapping && !isWrappingNode(node.parentNode) && isWrappable(node)) {
            $(node).wrap(getWrapper(groupId));
            return node.parentNode;
        }
        return null;
    }

    /**
     * We need to re-index the groups after a user highlight: either to merge groups or to resolve inconsistencies
     * Recursive.
     *
     * @param {Node} rootNode
     */
    function reindexGroups(rootNode) {
        if (!rootNode) {
            return;
        }

        var childNodes = rootNode.childNodes;
        var i, currentNode, parent;

        for (i = 0; i < childNodes.length; i++) {
            currentNode = childNodes[i];

            if (isWrappable(currentNode)) {
                parent = currentNode.parentNode;
                if (isWrappingNode(parent)) {
                    if (isWrapping === false) {
                        currentGroupId++;
                    }
                    isWrapping = true;
                    parent.setAttribute(GROUP_ATTR, currentGroupId); // set the new group Id
                } else {
                    isWrapping = false;
                }
            } else if (isElement(currentNode)) {
                reindexGroups(currentNode);
            }
        }
    }

    /**
     * Some highlights may result in having adjacent wrapping nodes. We remove them here to get a cleaner markup.
     *
     * @param {Node} rootNode
     */
    function mergeAdjacentWrappingNodes(rootNode) {
        if (!rootNode) {
            return;
        }

        var childNodes = rootNode.childNodes;
        var i, currentNode;

        for (i = 0; i < childNodes.length; i++) {
            currentNode = childNodes[i];

            if (isWrappingNode(currentNode)) {
                if (keepEmptyNodes) {
                    currentNode.normalize();
                }
                while (
                    isWrappingNode(currentNode.nextSibling) &&
                    currentNode.className === currentNode.nextSibling.className
                ) {
                    if (keepEmptyNodes) {
                        currentNode.nextSibling.normalize();
                    }
                    currentNode.firstChild.textContent += currentNode.nextSibling.firstChild.textContent;
                    if (keepEmptyNodes) {
                        addSplitData(currentNode, currentNode.dataset.beforeWasSplit, currentNode.nextSibling.dataset.afterWasSplit);
                    }
                    currentNode.parentNode.removeChild(currentNode.nextSibling);
                }
            } else if (isElement(currentNode)) {
                mergeAdjacentWrappingNodes(currentNode);
            }
        }
    }

    /**
     * Unwraps highlighted nodes with a line break or with an empty content
     */
    function unWrapEmptyHighlights() {
        getHighlightedNodes().each((index, node) => {
            const nodeContent = node.textContent;

            if (nodeContent.trim().length === 0) {
                if (nodeContent.length === 0 || /\r|\n/.exec(nodeContent)) {
                    clearSingleHighlight({ target: node });
                }
            }
        });
    }

    /**
     * Check condition to avoid the work of `unwrapEmptyHighlights` ahead of time, before `mergeAdjacentNodes` runs,
     * because in `keepEmptyNodes` case we do not want to add nodes to dom unless necessary.
     * Also be more strict and don't allow to select nodes with spaces only, because they may appear in unexpected places in markup
     * (here it's not exactly same as `unwrapEmptyHighlights`).
     * @param {Node} node - node which will be wrapped (highlighted)
     * @returns {Boolean}
     */
    function willHighlightNotBeEmptyAfterMerge(node) {
        if (!node.textContent.length) {
            return false;
        }
        if (node.textContent.trim().length) {
            return true;
        }
        const prevNode = node.previousSibling;
        const canWrapperBeMergedWithPreviousSibling = prevNode && isWrappingNode(prevNode) && prevNode.className === className;
        if (canWrapperBeMergedWithPreviousSibling) {
            return true;
        }
        const nextNode = node.nextSibling;
        const canWrapperBeMergedWithNextSibling = nextNode && isWrappingNode(nextNode) && nextNode.className === className;
        if (canWrapperBeMergedWithNextSibling) {
            return true;
        }
        return false;
    }

    /**
     * `range.surroundContents` can create empty text nodes,
     * which will cause trouble in `mergeAdjacentNodes` later (in `keepEmptyNodes` case).
     * This method surrounds range, then removes those nodes
     * @param {Range} range
     * @param {Node} wrapperNode
     */
    function rangeSurroundContentsNoEmptyNodes(range, wrapperNode) {
        const containerPreviousSibling = range.commonAncestorContainer.previousSibling;
        const containerNextSibling = range.commonAncestorContainer.nextSibling;

        range.surroundContents(wrapperNode);

        removeEmptyTextNodeIfDifferent(wrapperNode.previousSibling, containerPreviousSibling);
        removeEmptyTextNodeIfDifferent(wrapperNode.nextSibling, containerNextSibling);
    }

    /**
     * Remove `node`, if it's an empty text node and is *not* the same node as `nodeToCompare`
     * @param {Node} node
     * @param {Node} nodeToCompare
     */
    function removeEmptyTextNodeIfDifferent(node, nodeToCompare) {
        if (node && node !== nodeToCompare && isText(node) && node.textContent.length === 0) {
            node.remove();
        }
    }

    /**
     * Remove all wrapping nodes from markup
     */
    function clearHighlights() {
        getHighlightedNodes().each(function (i, elem) {
            if (!keepEmptyNodes) {
                var $wrapped = $(this);
                $wrapped.replaceWith($wrapped.text());
            } else {
                clearSingleHighlight({ target: elem });
            }
        });
    }

    /**
     * Remove unwrap dom node
     */
    function clearSingleHighlight(e) {
        if (!keepEmptyNodes) {
            const $wrapped = $(e.target);
            const text = $wrapped.text();

            // NOTE: JQuery replaceWith is not working with empty string https://bugs.jquery.com/ticket/13401
            if (text === '') {
                $wrapped.remove();
            } else {
                $wrapped.replaceWith(text);
            }
        } else {
            const nodeToRemove = e.target;
            const nodeToRemoveText = nodeToRemove.textContent;
            const beforeWasSplit = nodeToRemove.dataset.beforeWasSplit === 'true';
            const afterWasSplit = nodeToRemove.dataset.afterWasSplit === 'true';
            const prevNode = nodeToRemove.previousSibling;
            const nextNode = nodeToRemove.nextSibling;

            if (beforeWasSplit && prevNode && isText(prevNode) && prevNode.textContent) {
                //append text to previous sibling
                prevNode.textContent += nodeToRemoveText;
                nodeToRemove.remove();

                if (afterWasSplit && prevNode.nextSibling && isText(prevNode.nextSibling) && prevNode.nextSibling.textContent) {
                    //merge it with next sibling
                    prevNode.textContent += prevNode.nextSibling.textContent;
                    prevNode.nextSibling.remove();
                }
            }
            else if (afterWasSplit && nextNode && isText(nextNode) && nextNode.textContent) {
                //append text to next sibling
                nextNode.textContent = nodeToRemoveText + nextNode.textContent;
                nodeToRemove.remove();
            } else if (nodeToRemoveText) {
                //keep text in a separate text node
                const $wrapped = $(nodeToRemove);
                $wrapped.replaceWith(nodeToRemoveText);
            } else {
                //text is empty, just remove it
                nodeToRemove.remove();
            }
        }
    }

    /**
     * Index-related functions:
     * ========================
     * To allow saving and restoring highlights on an equivalent, but different, DOM tree (for example if the markup is deleted and re-created)
     * we build an index containing the status of each text node:
     * - not highlighted
     * - fully highlighted
     * - partially highlighted (= with inline ranges)
     *
     * This index will be used to restore a selection on the new DOM tree
     */

    /**
     * Bootstrap the process of building the highlight index
     * @returns {Object[]|BuildModelResultKeepEmpty|null}
     */
    function getHighlightIndex() {
        var rootNode = getContainer();
        if (!keepEmptyNodes) {
            var highlightIndex = [];
            if (rootNode) {
                rootNode.normalize();
                textNodesIndex = 0;
                buildHighlightIndex(rootNode, highlightIndex);
            }
            return highlightIndex;
        } else {
            if (rootNode) {
                return buildHighlightModelKeepEmpty(rootNode);
            } else {
                return null;
            }
        }
    }

    /**
     * Traverse the DOM tree to create the text Nodes index. Recursive.
     * @param {Node} rootNode
     * @param {Object[]} highlightIndex
     */
    function buildHighlightIndex(rootNode, highlightIndex) {
        var childNodes = rootNode.childNodes;
        var i, currentNode;
        var nodeInfos, inlineRange, inlineOffset, nodesToSkip;

        for (i = 0; i < childNodes.length; i++) {
            currentNode = childNodes[i];

            // Skip blacklisted nodes
            if (isBlacklisted(currentNode)) {
                continue;
            }
            // A simple node not highlighted and isolated (= not followed by an wrapped text)
            else if (isWrappable(currentNode) && !isWrappingNode(currentNode.nextSibling)) {
                highlightIndex[textNodesIndex] = { highlighted: false };
                textNodesIndex++;

                // an isolated node (= not followed by a highlight table text) with its whole content highlighted
            } else if (
                isWrappingNode(currentNode) &&
                !isText(currentNode.nextSibling) &&
                (!isWrappingNode(currentNode.nextSibling) ||
                    currentNode.className === currentNode.nextSibling.className)
            ) {
                highlightIndex[textNodesIndex] = {
                    highlighted: true,
                    groupId: currentNode.getAttribute(GROUP_ATTR),
                    c: getColorByClassName(currentNode.className)
                };
                textNodesIndex++;

                // less straightforward: a succession of (at least) 1 wrapping node with 1 wrappable text node, in either order, and possibly more
                // the trick is to create a unique text node on which we will be able to re-apply multiple partial highlights
                // for this, we use 'inlineRanges'
            } else if (isHotNode(currentNode)) {
                nodeInfos = {
                    highlighted: true,
                    inlineRanges: []
                };

                nodesToSkip = -1;
                inlineOffset = 0;

                while (currentNode) {
                    if (isWrappingNode(currentNode)) {
                        inlineRange = {
                            groupId: currentNode.getAttribute(GROUP_ATTR),
                            c: getColorByClassName(currentNode.className)
                        };

                        if (isText(currentNode.previousSibling) || isWrappingNode(currentNode.previousSibling)) {
                            inlineRange.startOffset = inlineOffset;
                        }
                        if (isText(currentNode.nextSibling) || isWrappingNode(currentNode.nextSibling)) {
                            inlineRange.endOffset = inlineOffset + currentNode.textContent.length;
                        }
                        nodeInfos.inlineRanges.push(inlineRange);
                    }

                    inlineOffset += currentNode.textContent.length;
                    currentNode =
                        isHotNode(currentNode.nextSibling) || isText(currentNode.nextSibling)
                            ? currentNode.nextSibling
                            : null;
                    nodesToSkip++;
                }
                i += nodesToSkip; // we increase the loop counter to avoid looping over the nodes that we just analyzed

                highlightIndex[textNodesIndex] = nodeInfos;
                textNodesIndex++;

                // go deeper in the node tree...
            } else if (isElement(currentNode)) {
                buildHighlightIndex(currentNode, highlightIndex);
            }
        }
    }

    /**
     * @typedef HighlightEntryKeepEmpty
     * @property {String} groupId
     * @property {String} c - color
     * @property {Number} offsetBefore
     * @property {Number} textLength
     * @property {String} beforeWasSplit
     * @property {String} afterWasSplit
     * @property {Array<Number>} path - on each level from root container to highlight, index among siblings
     */
    /**
     * @typedef BuildModelResultKeepEmpty
     * @property {HighlightEntryKeepEmpty[]} highlightModel
     * @property {NodeList} wrapperNodes
     */
    /**
     * For `keepEmptyNodes` option, creates data model of highlights.
     * Additionally returns array of hilghlight nodes. Traverses DOM tree.
     * @param {Node} rootNode
     * @returns {HighlightEntryKeepEmpty[]|null} result
     */
    function buildHighlightModelKeepEmpty(rootNode) {
        const wrapperNodesSelector = Object.values(options.colors).map(cls => containerSelector + ' .' + cls).join(', ');
        const wrapperNodes = document.querySelectorAll(wrapperNodesSelector);

        if (!wrapperNodes.length) {
            return null;
        }

        var highlightModel = [];
        const indexCache = new Map();
        for (var k = 0; k < wrapperNodes.length; k++) {
            var wrapperNode = wrapperNodes[k];

            //get info about highlight itself
            var offsetBefore = 0;
            var prevNode = wrapperNode.previousSibling;
            if (prevNode && isText(prevNode)) {
                const beforeWasSplit = wrapperNode.dataset.beforeWasSplit === 'true';
                if (beforeWasSplit) {
                    offsetBefore = prevNode.textContent.length;
                }
            }
            var highlightData = {
                groupId: wrapperNode.getAttribute(GROUP_ATTR),
                c: getColorByClassName(wrapperNode.className),
                offsetBefore,
                textLength: wrapperNode.textContent.length,
                beforeWasSplit: wrapperNode.dataset.beforeWasSplit,
                afterWasSplit: wrapperNode.dataset.afterWasSplit,
                path: []
            };

            //get info about its position in the tree: path through all parents from rootNode to highlight
            let currentNode = wrapperNode;
            while (currentNode && currentNode !== rootNode) {
                let indexInModel = indexCache.get(currentNode);
                if (!indexInModel && indexInModel !== 0) {
                    //should be more reliable to ignore empty nodes when indexing
                    const childNodes = Array.from(currentNode.parentNode.childNodes).filter(node => !(isText(node) && !node.textContent.length));
                    //index among its non-empty siblings
                    indexInModel = childNodes.indexOf(currentNode);
                    indexCache.set(currentNode, indexInModel);
                }
                highlightData.path.unshift(indexInModel);
                currentNode = currentNode.parentNode;
            }

            //add info about highlight and its position to model
            highlightModel.push(highlightData);
        }
        return {
            highlightModel,
            wrapperNodes
        };
    }

    /**
     * Bootstrap the process of restoring the highlights from an index
     * @param {Object[]|HighlightEntryKeepEmpty[]|null} highlightIndex
     */
    function highlightFromIndex(highlightIndex) {
        var rootNode = getContainer();
        if (rootNode) {
            if (!keepEmptyNodes) {
                rootNode.normalize();
                textNodesIndex = 0;
                restoreHighlight(rootNode, highlightIndex);
            } else {
                restoreHighlightKeepEmpty(rootNode, highlightIndex);
            }
        }
    }

    /**
     * Traverse the DOM tree to wraps the text nodes according to the highlight index. Recursive.
     * @param {Node} rootNode
     * @param {Object[]} highlightIndex
     */
     function restoreHighlight(rootNode, highlightIndex) {
        var childNodes = rootNode.childNodes;
        var i, currentNode, parent;
        var nodeInfos, nodesToSkip, range, initialChildCount;

        for (i = 0; i < childNodes.length; i++) {
            currentNode = childNodes[i];

            if (isBlacklisted(currentNode)) {
                continue;
            } else if (isWrappable(currentNode)) {
                parent = currentNode.parentNode;
                initialChildCount = parent.childNodes.length;

                nodeInfos = highlightIndex[textNodesIndex];

                if (nodeInfos.highlighted === true) {
                    if (_.isArray(nodeInfos.inlineRanges)) {
                        nodeInfos.inlineRanges.reverse();
                        nodeInfos.inlineRanges.forEach(function (inlineRange) {
                            range = document.createRange();
                            range.setStart(currentNode, inlineRange.startOffset || 0);
                            range.setEnd(currentNode, inlineRange.endOffset || currentNode.textContent.length);
                            range.surroundContents(getWrapper(inlineRange.groupId, getClassNameByColor(inlineRange.c)));
                        });

                        // fully highlighted text node
                    } else {
                        range = document.createRange();
                        range.selectNodeContents(currentNode);
                        range.surroundContents(getWrapper(nodeInfos.groupId, getClassNameByColor(nodeInfos.c)));
                    }
                    // we do want to loop over the nodes created by the wrapping operation
                    nodesToSkip = parent.childNodes.length - initialChildCount;
                    i += nodesToSkip;
                }
                textNodesIndex++;
            } else if (isElement(currentNode)) {
                restoreHighlight(currentNode, highlightIndex);
            }
        }
     }

    /**
     * For `keepEmptyNodes` option, wraps the text nodes according to highlights data model.
     * Traverses and updates DOM tree. Shouldn't throw errors in case of mismatches.
     * @param {Node} rootNode
     * @param {HighlightEntryKeepEmpty[]|null} highlightModel
     */
    function restoreHighlightKeepEmpty(rootNode, highlightModel) {
        if (!highlightModel) {
            return;
        }

        var currentModel;
        var range;
        for (var k = 0; k < highlightModel.length; k++) {
            currentModel = highlightModel[k];

            //find node to wrap - go through nodes until we reach level where node to wrap will be
            let childNodes;
            let indexInModel;
            let currentParentNode = rootNode;
            let pathNotFound = false;
            if (!currentModel.path || !currentModel.path.length) {
                continue; //something went wrong
            }
            for (var m = 0; m < currentModel.path.length; m++) {
                //path was counted among non-empty nodes
                childNodes = Array.from(currentParentNode.childNodes).filter(node => !(isText(node) && !node.textContent.length));
                indexInModel = currentModel.path[m];
                currentParentNode = childNodes[indexInModel];
                if (!currentParentNode && m < currentModel.path.length - 1) {
                    //node on last level may not exist yet, no need to fail. See `nodeAtIndex`
                    pathNotFound = true;
                    break;
                }
            }
            if (pathNotFound) {
                continue; //something went wrong
            }

            //add single highlight
            var nodeAtIndex = null;
            if (!currentModel.offsetBefore) {
                //wrap starts on this node
                nodeAtIndex = childNodes[indexInModel];
                if (!nodeAtIndex || isBlacklisted(nodeAtIndex)) {
                    continue; //something went wrong
                }
            } else {
                //split previousSibling to create a node for wrapping
                var nodeBefore = childNodes[indexInModel - 1];
                if (!nodeBefore || nodeBefore.textContent.length <= currentModel.offsetBefore || isBlacklisted(nodeBefore)) {
                    continue; //something went wrong
                }
                nodeAtIndex = nodeBefore.splitText(currentModel.offsetBefore);
            }
            //cut off its end
            if (nodeAtIndex.textContent.length > currentModel.textLength) {
                nodeAtIndex.splitText(currentModel.textLength);
            }

            //wrap
            const wrapperNode = getWrapper(currentModel.groupId, getClassNameByColor(currentModel.c));
            addSplitData(wrapperNode, currentModel.beforeWasSplit, currentModel.afterWasSplit);
            range = document.createRange();
            range.selectNodeContents(nodeAtIndex);
            rangeSurroundContentsNoEmptyNodes(range, wrapperNode);
        }
    }

    /**
     * Set highlighter color
     * @param {string} color Active highlighter color
     */
    const setActiveColor = color => {
        if (options.colors[color]) {
            className = options.colors[color];
        }
    };

    /**
     * Helpers
     */

    /**
     * Return the object key contains the given value
     * @param {Object} object
     * @param {any} value
     * @return {string|undefined}
     */
    const getKeyByValue = (object, value) => Object.keys(object).find(key => object[key] === value);

    /**
     * Returns color identifier for the given class name
     * @param {string} highlighterClassName Class name of highlighter classes
     * @returns {string|number} Color identifier
     */
    const getColorByClassName = highlighterClassName => {
        if (options.colors) {
            return getKeyByValue(options.colors, highlighterClassName);
        }

        return className;
    };

    /**
     * Returns class name for the given color identifier
     * @param {string|number} color Color identifier
     * @returns {string} Class name
     */
    const getClassNameByColor = color => {
        if (options.colors && options.colors[color]) {
            return options.colors[color];
        }

        return className;
    };

    /**
     * Check if the given node is a wrapper
     * @param {Node|Element} node
     * @returns {boolean}
     */
    function isWrappingNode(node) {
        return isElement(node) && node.tagName.toLowerCase() === 'span' && highlightingClasses.includes(node.className);
    }

    /**
     * Check if the given node can be wrapped
     * @param {Node} node
     * @returns {boolean}
     */
    function isWrappable(node) {
        return isText(node) && !isBlacklisted(node);
    }

    /**
     * Check if the given node is, or is within, a blacklisted container
     * @param {Node} node
     * @returns {boolean}
     */
    function isBlacklisted(node) {
        const closest = $(node).closest(containersBlackAndWhiteListSelector);
        if (!closest.length) {
            return false;
        } else if (!containersWhiteListSelector) {
            return true;
        } else {
            return !closest.get(0).matches(containersWhiteListSelector);
        }
    }

    /**
     * Wraps text node to the highlighter wrapper element
     * @param {Node} textNode Text node to wrap
     * @param {string} className Wrapper class name
     * @param {number} groupId Group id
     */
    function wrapNode(textNode, className, groupId) {
        const element = getWrapper(groupId, className);

        element.appendChild(textNode);
        return element;
    }

    /**
     * Create a wrapping node
     * @param {number} groupId
     * @returns {Element}
     */
    function getWrapper(groupId, wrapperClass) {
        const wrapper = document.createElement('span');

        wrapper.className = wrapperClass || className;
        wrapper.setAttribute(GROUP_ATTR, `${groupId}`);
        return wrapper;
    }

    /**
     * Returns the first unused group Id
     * @returns {number}
     */
    function getAvailableGroupId() {
        var id = currentGroupId || 1;
        while ($(getContainer()).find('[' + GROUP_ATTR + '=' + id + ']').length !== 0) {
            id++;
        }
        return id;
    }

    /**
     * Check if the given node is an element
     * @param {Node} node
     * @returns {boolean}
     */
    function isElement(node) {
        return node && typeof node === 'object' && node.nodeType === window.Node.ELEMENT_NODE;
    }

    /**
     * Check if the given node is of type text
     * @param {Node} node
     * @returns {boolean}
     */
    function isText(node) {
        return node && typeof node === 'object' && node.nodeType === window.Node.TEXT_NODE;
    }

    /**
     * a "Hot Node" is either wrappable text node or a wrapper
     * @param {Node} node
     * @returns {boolean}
     */
    function isHotNode(node) {
        return isWrappingNode(node) || isWrappable(node);
    }

    /**
     * Public API of the highlighter helper
     */
    return {
        highlightRanges: highlightRanges,
        highlightFromIndex: highlightFromIndex,
        getHighlightIndex: getHighlightIndex,
        clearHighlights: clearHighlights,
        clearSingleHighlight: clearSingleHighlight,
        setActiveColor
    };
}
