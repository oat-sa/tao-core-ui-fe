<div class="filter-container {{criterion.id}}-filter" data-criteria="{{criterion.label}}"  data-type="{{criterion.type}}">
    <button class="icon-result-nok" aria-label="{{__ "Remove criteria"}}"></button>
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