<ul class="tab-group">
    {{#each tabs}}
    <li class="tab {{#if active}}active{{/if}}" data-tab-name="{{name}}">
        <button tabindex="0" {{#if disabled}}disabled{{/if}}>{{ label }}</button>
    </li>
    {{/each}}
</ul>
