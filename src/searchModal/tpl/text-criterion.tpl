<div class="filter-container {{criterion.id}}-filter" data-criteria="{{criterion.label}}" data-type="{{criterion.type}}">
    <button class="icon-result-nok" aria-label="{{__ "Remove criteria"}}"></button>
    <label>
        <span class="filter-label-text">{{criterion.label}}
            {{#if criterion.isDuplicated}}
                {{#if criterion.alias}}<span class="criteria-alias">({{criterion.alias}})</span>{{/if}}
                {{#if criterion.class.label}}<span class="class-path">/ {{criterion.class.label}}</span>{{/if}}
            {{/if}}
        </span>
        <input type="text">
    </label>
</div>