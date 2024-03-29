<div class="filter-container {{criterion.id}}-filter" data-criteria="{{criterion.label}}"
    data-type="{{criterion.type}}">
    <button class="icon-result-nok" aria-label="{{__ " Remove criteria"}}"></button>
    <fieldset class="filter-bool-group">
        <legend>{{criterion.label}}
            {{#if criterion.isDuplicated}}
                {{#if criterion.alias}}<span class="criteria-alias">({{criterion.alias}})</span>{{/if}}
                {{#if criterion.class.label}}<span class="class-path">/ {{criterion.class.label}}</span>{{/if}}
            {{/if}}
        </legend>
        {{#each criterion.values}}
            <div>
                <input type="checkbox" value="{{this}}" id="{{criterion.id}}-{{this}}">
                <label class="filter-label-text" for="{{criterion.id}}-{{this}}">{{this}}</label>
            </div>
        {{/each}}
    </fieldset>
</div>