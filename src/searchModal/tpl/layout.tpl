<div class="search-modal section-container">
    <div class="clear content-wrapper content-panel">
        <div class="navi-container">
            <div class="filters-container">
                <div class="filter-container">
                    <span class="icon-find"></span>
                    <input class="generic-search-input" type="text" placeholder="{{__ "Search Item"}}">
                </div>
                <div class="filter-container class-filter-container">
                    <span class="icon-folder"></span>
                    <span class="icon-down"></span>
                    <input class="class-filter" type="text" placeholder="{{__ "Search Item"}}">
                    <div class="class-tree"></div>
                </div>
                <!-- TODO: This container must only be rendered if advanced search is enabled -->
                <div class="advanced-search-filters-container">
                    <div class="add-criteria-container">
                        <a><span class="icon-add"></span> add criteria</a>
                        <select name="criteria-select">
                            <option></option>
                            <option value="description">description</option>
                            <option value="difficulty">difficulty</option>
                            <option value="course-code">course code</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="buttons-container">
                <button class="btn-clear btn-transparent small">{{__ "Clear"}}</button>
                <button class="btn-search btn-info small">{{__ "Search"}}</button>
            </div>
        </div>
        <div class="content-container" style="padding:40px 20px">
        </div>
    </div>
</div>