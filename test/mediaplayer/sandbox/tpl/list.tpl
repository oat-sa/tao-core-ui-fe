<label title="{{description}}">
    <span>{{name}}</span>
    <select name="{{name}}">
        {{#each values}}
        <option value="{{.}}">{{.}}</option>
        {{/each}}
    </select>
</label>