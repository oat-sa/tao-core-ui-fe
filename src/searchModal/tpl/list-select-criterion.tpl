<div class="filter-container {{criterion.id}}-filter" data-criteria="{{criterion.label}}" data-type="{{criterion.type}}">
    <button class="icon-result-nok" aria-label="{{__ "Remove criteria"}}"></button>
    <div class="criterion-container">
        <span class="filter-label-text">{{criterion.label}}
            {{#if criterion.isDuplicated}}
                {{#if criterion.alias}}<span class="criteria-alias">({{criterion.alias}})</span>{{/if}}
                {{#if criterion.class.label}}<span class="class-path">/ {{criterion.class.label}}</span>{{/if}}
            {{/if}}
        </span>
        <div class="logic-radio-group">
            <label class="logic-label">
                <input type="radio" name="{{criterion.id}}-logic" value="LOGIC_AND"><span class="icon-radio"></span> {{__ "Include all"}}
            </label>
            <label class="logic-label">
                <input type="radio" name="{{criterion.id}}-logic" value="LOGIC_OR"><span class="icon-radio"></span> {{__ "Include any"}}
            </label>
            <label class="logic-label">
                <input type="radio" name="{{criterion.id}}-logic" value="LOGIC_NOT"><span class="icon-radio"></span> {{__ "Include none"}}
            </label>
        </div>
        <input type='text' name="{{criterion.id}}-select">
    </div>
</div>
