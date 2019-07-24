<ul class="tab-group">
    {{#each tabs}}
    <li class="tab {{#if active}}active{{/if}}" data-controlled-panel="panel-{{name}}" >
        <button tabindex="0">{{ label }}</button>
    </li>
    {{/each}}
</ul>
