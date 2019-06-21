<div class="form-component">
    <h2 class="form-title">{{title}}</h2>
    <form{{#if formAction}} action="{{formAction}}"{{/if}}{{#if formMethod}} method="{{formMethod}}"{{/if}}>
        <fieldset class="fieldset"></fieldset>
        <div class="form-actions"></div>
    </form>
</div>
