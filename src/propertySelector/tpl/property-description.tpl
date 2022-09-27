<li class="property-description-container">
    <div class="checkbox-container">
        <label>
            <input type="checkbox" data-property-id="{{id}}" {{#if selected}}checked{{/if}} />
            <span class="icon-checkbox"></span>
        </label>
    </div>
    <div class="property-description">
        <span class="property-description-label">
            {{{dompurify label}}}
            {{#if alias}}<span class="property-description-alias">({{{dompurify alias}}})</span>{{/if}}
            {{#if className}}/<span class="property-description-class">/ {{{dompurify className}}}</span>{{/if}}
        </span>
    </div>
</li>