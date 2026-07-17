# Registrar la tarea nueva
aws ecs register-task-definition --cli-input-json file://deploy/task-definition.json

# Actualizar el servicio para que tome la última versión
aws ecs update-service --cluster cluster-servicios-electricos --service contact-service-run --task-definition contact-service-task --force-new-deployment