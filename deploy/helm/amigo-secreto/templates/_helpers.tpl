{{- define "amigo.name" -}}
{{ .Release.Name | trunc 63 | trimSuffix "-" }}
{{- end -}}
{{- define "amigo.selector" -}}
app.kubernetes.io/name: amigo-secreto
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}
{{- define "amigo.image" -}}
{{ .Values.image.repository }}:{{ required "Set image.tag to a published immutable image tag" .Values.image.tag }}
{{- end -}}
