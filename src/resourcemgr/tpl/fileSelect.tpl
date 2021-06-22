{{#each files}}
    <li data-type="{{type}}" 
        data-file="{{uri}}" 
        data-display="{{display}}" 
        data-mime="{{mime}}" 
        data-size="{{size}}" 
        data-url="{{viewUrl}}" 
        {{#if permissions.read}} data-download="{{downloadUrl}}"{{/if}}
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
                                    <a href="#" class="tlb-button-off select" title="{{__ 'Select this file'}}"><span class="icon-move-item"></span></a>
                                    <a href="{{downloadUrl}}" download="{{name}}" target="_blank" class="tlb-button-off download" title="{{__ 'Download this file'}}"><span class="icon-download"></span></a>
                                    {{#if permissions.write }}
                                        <a href="#" class="tlb-button-off" title="{{__ 'Remove this file'}}" data-delete=":parent li"><span class="icon-bin"></span></a>
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
