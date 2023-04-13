<div class="destination-selector">
    {{#if title}}
    <h2>{{title}}</h2>
    {{/if}}
    <div>
        {{#if description}}
        <p class="section-title">{{description}}</p>
        {{/if}}
        <div class="selector-container"></div>
        {{#if showACL}}
        <div class="permissions-settings-container">
            <p class="section-title">Permission settings</p>
            <input type="radio" id="acl-keep-original" {{#equal aclTransferMode 'acl.keep.original' }}checked {{/equal}}name="acl-mode" value="acl.keep.original" />
            <label for="acl-keep-original">Keep the original permissions</label><br>
            <input type="radio" id="acl-use-destination" {{#equal aclTransferMode 'acl.use.destination' }}checked {{/equal}}name="acl-mode" value="acl.use.destination" />
            <label for="acl-use-destination">Inherit the permission of the parent folder</label>
        </div>
        {{/if}}
        <div class="actions">
        </div>
    </div>
</div>
