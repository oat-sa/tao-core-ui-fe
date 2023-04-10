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
            <input type="radio" id="acl-mode-copy" name="acl-mode" value="copy" />
            <label for="acl-mode-copy">Keep the original permissions</label><br>
            <input type="radio" id="acl-mode-inherit" name="acl-mode" value="inherit" />
            <label for="acl-mode-inherit">Inherit the permission of the parent folder</label>
        </div>
        {{/if}}
        <div class="actions">
        </div>
    </div>
</div>
