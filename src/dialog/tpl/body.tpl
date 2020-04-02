<div class="preview-modal-feedback modal {{class}}" role="dialog">
    <div class="modal-body clearfix">
        <div class="navigable-modal-body" data-control="navigable-modal-body">
            {{#if heading}}
            <h4 class="strong">{{heading}}</h4>
            {{/if}}

            <p class="message">{{{message}}}</p>

            {{#if content}}
            <div class="content">{{{content}}}</div>
            {{/if}}
        </div>

        <div class="buttons rgt"></div>
    </div>
</div>
