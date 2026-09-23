<div class="resourcemgr modal {{#if className}}{{className}}{{/if}}">

    <h2>{{{ title }}}</h2>

    <div class="file-wrapper">

        <div class="file-panels">
            <!-- left section: search, filters, folder tree -->
            <section class="file-browser">
                <div class="asset-search hidden" hidden>
                    <div class="asset-search-header">
                        <button
                            type="button"
                            class="asset-search-toggle"
                            aria-expanded="true"
                            aria-controls="{{assetSearchBodyId}}"
                        >
                            <span class="asset-search-title">{{__ 'Search'}}</span>
                            <span class="asset-search-applied-count hidden" hidden></span>
                            <span class="asset-search-scope" aria-live="polite">
                                <span class="asset-search-scope-prefix">{{__ 'Searching in:'}}</span>
                                <span class="asset-search-scope-name"></span>
                                <span class="asset-search-scope-subfolders hidden" hidden>{{__ 'and its subfolders'}}</span>
                            </span>
                            <span class="asset-search-chevron icon-up" aria-hidden="true"></span>
                        </button>
                    </div>
                    <div class="asset-search-body" id="{{assetSearchBodyId}}">
                        <div class="asset-search-field">
                            <span class="icon-find" aria-hidden="true"></span>
                            <label class="asset-search-label" for="{{assetSearchInputId}}">{{__ 'Search by name or label'}}</label>
                            <input
                                id="{{assetSearchInputId}}"
                                type="search"
                                class="asset-search-input"
                                placeholder="{{__ 'Search by name or label'}}"
                                autocomplete="off"
                            />
                        </div>
                        <div class="asset-search-filters"></div>
                        <div class="asset-search-actions">
                            <button type="button" class="asset-search-clear hidden" hidden>{{__ 'Clear all'}}</button>
                            <button type="button" class="btn-info small asset-search-submit" disabled>
                                <span class="asset-search-submit-spinner icon-loop" aria-hidden="true" hidden></span>
                                <span class="asset-search-submit-label">{{__ 'Search'}}</span>
                            </button>
                        </div>
                    </div>
                </div>

                <h1 class="resources-title">{{__ 'Resources'}}</h1>
                <div class="file-browser-wrapper"></div>
            </section>

            <!-- center: asset listing -->
            <section class="file-selector">

                <h1>
                    <div class="title lft">{{__ 'Assets'}}</div>
                    <div class="upload-switcher rgt">
                        <a href="#" class="btn-info small upload hidden"><span class="icon-add"></span>{{__ 'Add file(s)'}}</a>
                        <a href="#" class="btn-info small listing"><span class="icon-undo"></span>{{__ 'Back to listing'}}</a>
                    </div>
                </h1>

                <div class="asset-search-error hidden" hidden role="alert">
                    <p class="asset-search-error-message"></p>
                    <button type="button" class="btn-info small asset-search-retry">{{__ 'Retry'}}</button>
                </div>

                <div class="empty">
                    {{__ 'No files'}}
                </div>

                <div class="files-wrapper" aria-busy="false">
                    <table class="files">
                        <thead>
                            <tr>
                                <th class="files-label sortable sorted sorted_asc" data-sort-by="label" aria-sort="ascending" tabindex="0">
                                    <span class="sort-label">{{__ 'Label'}}</span>
                                </th>
                                <th class="files-location sortable" data-sort-by="location" aria-sort="none" tabindex="0">
                                    <span class="sort-label">{{__ 'Location'}}</span>
                                </th>
                                <th class="files-updated sortable" data-sort-by="updatedAt" aria-sort="none" tabindex="0">
                                    <span class="sort-label">{{__ 'Last modified on'}}</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody class="files-list"></tbody>
                    </table>
                </div>

                <div class="file-upload-container"></div>

                <div class="pagination-bottom"></div>

            </section>

            <section class="file-preview">

                <h1>{{__ 'Preview'}}</h1>

                <div class="previewer">
                    <p class="nopreview"></p>
                </div>

                <div class="file-properties">

                    <div class="grid-row">
                        <div class="col-2">
                            {{__ 'Type'}}
                        </div>
                        <div class="col-10 prop-type">—</div>
                    </div>

                    <div class="grid-row">
                        <div class="col-2">
                            {{__ 'Size'}}
                        </div>
                        <div class="col-10 prop-size">—</div>
                    </div>

                    <div class="grid-row prop-url">
                        <div class="actions">
                            <a href="#" download="" target="_blank" class="tlb-button-off download hidden" title="{{__ 'Download this file'}}">
                                <span class="icon-download"></span>{{__ 'Download this file'}}
                            </a>
                        </div>
                    </div>
                </div>

                <div class="actions select-actions">
                    <button class="btn-success select-action small" disabled>
                        <span class="icon-move-item"></span>{{__ 'Select'}}
                    </button>
                </div>

            </section>
        </div>

    </div>
</div>
