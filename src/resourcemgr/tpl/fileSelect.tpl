{{#each files}}
    <tr data-type="{{type}}"
        data-file="{{uri}}"
        data-display="{{display}}"
        data-mime="{{mime}}"
        data-size="{{size}}"
        data-url="{{viewUrl}}"
        {{#if location}} data-location="{{location}}" {{/if}}
        {{#if updatedAt}} data-updated="{{updatedAt}}" {{/if}}
        {{#if permissions.download}} data-download="true" {{/if}}
        {{#if permissions.preview}} data-preview="true" {{/if}}
        {{#if permissions.read}} data-select="true" {{/if}}
        data-alt="{{alt}}">
        <td class="files-label">
            <span class="files-label-inner">
                <span class="file-icon" aria-hidden="true"></span>
                <span class="desc truncate">{{name}}</span>
            </span>
        </td>
        <td class="files-location">
            <span class="meta location truncate" title="{{locationDisplay}}">{{locationDisplay}}</span>
        </td>
        <td class="files-updated">
            <span class="files-updated-inner">
                <span class="meta updated truncate" title="{{updatedAtDisplay}}">{{updatedAtDisplay}}</span>
                <span class="row-actions">
                    {{#if permissions.delete}}
                        <a href="#" class="delete" title="{{__ 'Remove this file'}}" aria-label="{{__ 'Remove this file'}}">
                            <span class="icon-bin" aria-hidden="true"></span>
                        </a>
                    {{/if}}
                </span>
            </span>
        </td>
    </tr>
{{/each}}
