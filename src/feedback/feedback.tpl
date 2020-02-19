<div id="{{id}}" class="feedback feedback-{{level}} {{#if popup}}popup{{/if}}" role="alert" >
    <span class="icon-{{level}}"></span>
    <div aria-live="assertive" aria-label="{{{dompurify msg}}}">
        {{{dompurify msg}}}
    </div>
    <span title="{{__ 'Close message'}}" class="icon-close" data-close=":parent .feedback" role="button" tabindex="0"></span>
</div>
