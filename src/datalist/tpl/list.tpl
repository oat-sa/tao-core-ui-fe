{{#each list}}
<tr data-id="{{id}}">
    {{#if @root.selectable}}
    <td class="checkboxes"><input type="checkbox" name="cb[{{id}}]" value="1" /></td>
    {{/if}}
    <td class="label">{{label}}</td>
    {{#if @root.actions}}
    <td class="actions">
    {{#each @root.actions}}
        {{#unless hidden}}
        <button class="btn-info small" data-control="{{id}}"{{#if title}} title="{{title}}"{{/if}}>
            {{#if icon}}<span class="icon icon-{{icon}}"></span>{{/if}}
            {{label}}
        </button>
        {{/unless}}
    {{/each}}
    </td>
    {{/if}}
</tr>
{{/each}}
