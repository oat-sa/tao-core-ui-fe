<div class="filter-container {{criterion.id}}-filter" data-criteria="{{criterion.label}}" data-type="{{criterion.type}}">
    <button class="icon-result-nok" aria-label="{{__ "Remove criteria"}}"></button>
    <label>
        <span class="filter-label-text">{{criterion.label}}{{#if criterion.isDuplicated}} <span class="class-path">/ {{criterion.class.label}}</span>{{/if}}</span>
        <input type="text">
    </label>
</div>