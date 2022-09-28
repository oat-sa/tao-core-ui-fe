<li class="property-description-container">
    <label class="property-description">
        <span class="property-description-checkbox">
            <input type="checkbox" data-property-id="{{id}}" {{#if selected}}checked{{/if}} />
            <span class="icon-checkbox"></span>
        </span>
        <span class="property-description-label">
            {{{dompurify label}}}
            {{#if alias}}<span class="property-description-alias">({{{dompurify alias}}})</span>{{/if}}
            {{#if classLabel}}<span class="property-description-class">/ {{{dompurify classLabel}}}</span>{{/if}}
        </span>
    </label>
</li>