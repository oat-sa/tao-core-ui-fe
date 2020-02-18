<div id="{{id}}" class="feedback feedback-{{level}} {{#if popup}}popup{{/if}}"
     role="dialog" aria-describedby="{{dompurify msg}}" >
    <span class="icon-{{level}}"></span>
    <div aria-live="{{dompurify msg}}">
        {{{dompurify msg}}}
    </div>
    <button title="{{__ 'Close message'}}" class="icon-close" data-close=":parent .feedback"
            aria-label="{{__ 'Close message'}}"></button>
</div>
