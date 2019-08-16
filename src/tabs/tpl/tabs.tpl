<ul class="tab-group">
    {{#each tabs}}
    <li class="tab {{cls}}" data-tab-name="{{name}}">
        <button class="action" tabindex="0" {{#if disabled}}disabled{{/if}}>
            {{#if icon}}<span class="icon icon-{{ icon }}"></span>{{/if}}
            {{#if label}}<span class="label">{{ label }}</span>{{/if}}
        </button>
    </li>
    {{/each}}
</ul>
