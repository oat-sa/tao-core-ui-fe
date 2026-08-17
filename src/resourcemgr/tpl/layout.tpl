<div class="resourcemgr modal {{#if className}}{{className}}{{/if}}">

    <h2>{{{ title }}}</h2>

    <div class="file-wrapper">

        <div class="asset-search hidden" hidden>
            <label class="asset-search-label" for="{{assetSearchInputId}}">{{__ 'Search'}}</label>
            <input
                id="{{assetSearchInputId}}"
                type="search"
                class="asset-search-input"
                placeholder="{{__ 'Search assets'}}"
                autocomplete="off"
            />
            <div class="asset-search-status" role="status" aria-live="polite"></div>
        </div>

        <div class="file-panels">
            <!-- left section: items selection -->
            <section class="file-browser">
                <h1>{{__ 'Browse resources'}}</h1>
                <div class="file-browser-wrapper"></div>
            </section>

            <!-- test editor  -->
            <section class="file-selector">

                <h1>
                    <div class="title lft"></div>
                    <div class="upload-switcher rgt">
                        <a href="#" class="btn-info small upload hidden"><span class="icon-add"></span>{{__ 'Add file(s)'}}</a>
                        <a href="#" class="btn-info small listing"><span class="icon-undo"></span>{{__ 'Back to listing'}}</a>
                    </div>
                </h1>

                <div class="asset-search-loading hidden" hidden aria-busy="false">
                    {{__ 'Loading…'}}
                </div>

                <div class="asset-search-error hidden" hidden>
                    <p class="asset-search-error-message"></p>
                    <button type="button" class="btn-info small asset-search-retry">{{__ 'Retry'}}</button>
                </div>

                <div class="empty">
                    {{__ 'No files'}}
                </div>

                <ul class="files"></ul>

                <div class="file-upload-container"></div>

                <div class="pagination-bottom"></div>

            </section>

            <section class="file-preview">

                <h1>{{__ 'Preview'}}</h1>

                <div class="previewer">
                    <p class="nopreview"></p>
                </div>

                <h2 class="toggler" data-toggle="~ .file-properties">{{__ 'File Properties'}}</h2>

                <div class="file-properties">

                    <div class="grid-row">
                        <div class="col-2">
                            {{__ 'Type'}}
                        </div>
                        <div class="col-10 prop-type"></div>
                    </div>

                    <div class="grid-row">
                        <div class="col-2">
                            {{__ 'Size'}}
                        </div>
                        <div class="col-10 prop-size"></div>
                    </div>

                    <div class="grid-row prop-url">
                        <div class="actions">
                            <a href="#" download="" target="_blank" class="tlb-button-off download hidden" title="{{__ 'Download this file'}}">
                                <button class="btn-info small">
                                    <span class="icon-download"></span>{{__ 'Download this file'}}
                                </button>
                            </a>
                        </div>
                    </div>
                </div>

                <h2 class="toggler" data-toggle="~ .actions">{{__ 'Actions'}}</h2>

                <div class="actions">
                    <button class="btn-success select-action small" disabled>
                        <span class="icon-move-item"></span>{{__ 'Select'}}
                    </button>
                </div>

            </section>
        </div>

    </div>
</div>
