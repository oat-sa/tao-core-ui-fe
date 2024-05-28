{{#if permissions.read }}
	<li>
		<a
			data-path="{{path}}"
			data-display="{{relPath}}"
			data-children-limit="{{childrenLimit}}"
			data-level="{{level}}"
			style="--tree-level: {{level}};"
			href="#">
			{{label}}
		</a>
	</li>
{{/if}}
