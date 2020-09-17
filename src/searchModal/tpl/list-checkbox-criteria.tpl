<div class="filter-container {{criteriaData.label}}-filter" data-criteria="{{criteriaData.label}}"  data-type="{{criteriaData.type}}">
    <span class="select2-search-choice-close"></span>
    <span>{{criteriaData.label}}</span>
    <ul>
    {{#each criteriaData.values}}
        <li>
            <input type="checkbox" value="{{this}}" id="{{this}}">
            <label for="{{this}}">{{this}}</label>
        </li>
    {{/each}}
    </ul>
</div>