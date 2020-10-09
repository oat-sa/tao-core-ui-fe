<div class="filter-container invalid-criteria-warning-container">
<span class="select2-search-choice-close"></span>
    <p>
        {{__ "The following criteria are not applicable to the selected class and have been removed from the search"}}:
    </p>
    <ul>
    {{#each invalidCriteria}}
        <li>{{this}}</li>
    {{/each}}
    </ul>
</div>