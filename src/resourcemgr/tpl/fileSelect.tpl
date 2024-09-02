{{#each files}}
    <li data-type="{{type}}"
        data-file="{{uri}}"
        data-display="{{display}}"
        data-mime="{{mime}}"
        data-size="{{size}}"
        data-url="{{viewUrl}}"
        {{#if permissions.download}} data-download="true" {{/if}}
        {{#if permissions.preview}} data-preview="true" {{/if}}
        {{#if permissions.read}} data-select="true" {{/if}}
        data-alt="{{alt}}">
        <span class="desc truncate">{{name}}</span>
        <div class="actions">
            <div class="tlb">
                <div class="tlb-top">
                    <span class="tlb-box">
                        <span class="tlb-bar">
                            <span class="tlb-start"></span>
                            {{#if permissions.read }}
                                <span class="tlb-group">
                                    {{#if permissions.read}}
                                        <a href="#" class="tlb-button-off select" title="{{__ 'Select this file'}}"><span class="icon-move-item"></span></a>
                                    {{/if}}
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
    </li>
{{/each}}
