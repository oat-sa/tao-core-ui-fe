<div class="property-description-container">
    <div class="checkbox-container"></div>
    <div class="property-description">
        <span class="property-description-label">
        {{{property.label}}}
        {{#if property.alias}}
            /
        {{/if}}
        </span>
        
        {{#if property.alias}}
            <span class="property-description-alias">/{{{property.alias}}}</span>
        {{/if}}
    </div>
</div>