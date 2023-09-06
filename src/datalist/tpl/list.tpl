{{#each list as |row|}}
<tr data-id="{{id}}">
    {{#if @root.selectable}}
    <td class="checkboxes"><input type="checkbox" name="cb[{{id}}]" value="1" /></td>
    {{/if}}
    <td class="label">{{label}}</td>
    {{#if @root.actions}}
    <td class="actions">
        {{#each @root.actions as |action|}}
            {{#with row.line}}
                {{#unless action.hidden}}
        <button class="btn-info small" data-control="{{action.id}}"{{#if action.title}} title="{{action.title}}"{{/if}}>
            {{#if action.icon}}<span class="icon icon-{{action.icon}}"></span>{{/if}}
            {{action.label}}
        </button>
                {{/unless}}
            {{/with}}
        {{/each}}
    </td>
    {{/if}}
</tr>
{{/each}}
