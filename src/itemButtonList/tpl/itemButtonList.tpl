<ol class="buttonlist-items">
    {{#each items}}
    <li class="buttonlist-item {{type}} {{#if scoreType}}{{scoreType}}{{/if}} {{#if ../disabled}}disabled{{/if}}" data-id="{{id}}">
        <button class="buttonlist-btn"
                role="link"
                aria-label="{{ariaLabel}}"
                {{#if ../disabled}}aria-disabled="true"{{/if}}
                data-id="{{id}}">
            <span class="icon-indicator indicator" aria-hidden="true"></span>
            {{#if scoreType}}
                <span class="buttonlist-score-badge">
                    <span class="buttonlist-score-icon icon-{{scoreType}}" aria-hidden="true"></span>
                </span>
            {{/if}}
            {{#if icon}}
                <span class="buttonlist-icon icon-{{icon}}" aria-hidden="true"></span>
            {{else}}
                <span class="buttonlist-label" aria-hidden="true">{{label}}</span>
            {{/if}}
        </button>
    </li>
    {{/each}}
</ol>