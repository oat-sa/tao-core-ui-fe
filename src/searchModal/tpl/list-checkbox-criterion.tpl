<div class="filter-container {{criterion.label}}-filter" data-criteria="{{criterion.label}}"  data-type="{{criterion.type}}">
    <span class="select2-search-choice-close"></span>
    <span>{{criterion.label}}</span>
    <ul>
    {{#each criterion.values}}
        <li>
            <input type="checkbox" value="{{this}}" id="{{this}}">
            <label for="{{this}}">{{this}}</label>
        </li>
    {{/each}}
    </ul>
</div>