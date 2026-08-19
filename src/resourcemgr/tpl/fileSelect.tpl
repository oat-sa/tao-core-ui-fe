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
            <span class="file-icon" aria-hidden="true"></span>
            <span class="desc truncate">{{name}}</span>
        </td>
        <td class="files-location">
            <span class="meta location truncate" title="{{location}}">{{location}}</span>
        </td>
        <td class="files-updated">
            <span class="meta updated truncate" title="{{updatedAtDisplay}}">{{updatedAtDisplay}}</span>
            <div class="row-actions">
                <div class="tlb">
                    <div class="tlb-top">
                        <span class="tlb-box">
                            <span class="tlb-bar">
                                <span class="tlb-start"></span>
                                {{#if permissions.read }}
                                    <span class="tlb-group">
                                        <a href="#" class="tlb-button-off select" title="{{__ 'Select this file'}}"><span class="icon-move-item"></span></a>
                                        {{#if permissions.download}}
                                            <a href="{{downloadUrl}}" download="{{name}}" target="_blank" class="tlb-button-off download" title="{{__ 'Download this file'}}"><span class="icon-download"></span></a>
                                        {{/if}}
                                        {{#if permissions.delete }}
                                            <a href="#" class="tlb-button-off delete" title="{{__ 'Remove this file'}}"><span class="icon-bin"></span></a>
                                        {{/if}}
                                    </span>
                                {{/if}}
                                <span class="tlb-end"></span>
                            </span>
                        </span>
                    </div>
                </div>
            </div>
        </td>
    </tr>
{{/each}}
