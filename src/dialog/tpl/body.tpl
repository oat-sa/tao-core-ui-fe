<div
    class="preview-modal-feedback modal {{class}}"
    role="dialog"
    aria-modal="true"
    data-control="navigable-modal-body"
    {{#if heading}}
        aria-labelledby="core/ui-dialog-heading-{{dialogId}}"
    {{/if}}
    aria-describedby="core/ui-dialog-message-{{dialogId}}"
>
    <div class="modal-body clearfix">
        {{#if heading}}
        <h4 id="core/ui-dialog-heading-{{dialogId}}" class="strong">{{heading}}</h4>
        {{/if}}

        <p id="core/ui-dialog-message-{{dialogId}}" class="message">{{{message}}}</p>

        {{#if content}}
        <div class="content">{{{content}}}</div>
        {{/if}}

        <div class="buttons rgt"></div>
    </div>
</div>
