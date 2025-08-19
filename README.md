ProyectoEmpleo es una plataforma web diseñada para conectar a jóvenes sin experiencia laboral con micro oportunidades de empleo, pasantías, voluntariados y capacitaciones

Tipo de arquitectura elegida
La arquitectura adoptada para el proyecto fue monolítica, ejecutándose en una máquina virtual (VM) de Azure con Windows 10. Dentro de esta VM se instalaron Node.js, PostgreSQL y todas las dependencias requeridas por el proyecto. El servidor Express cumple un rol central, ya que gestiona tanto el backend como el frontend (sirviendo archivos estáticos) y mantiene la conexión directa con la base de datos PostgreSQL, todo dentro de la misma instancia.
Criterios de elección
Escalabilidad: Aunque un monolito no es tan escalable como microservicios, resulta suficiente para el alcance inicial del proyecto, priorizando simplicidad y velocidad de despliegue.


Tamaño del proyecto: Es un prototipo académico con funcionalidades reducidas (gestión de usuarios, oportunidades, postulaciones y experiencias). No justifica la complejidad de microservicios ni serverless.


Mantenibilidad: Más sencillo de mantener en fases iniciales, ya que todo el código y la base de datos están en un solo entorno.


Patrón de carga: Se espera un uso moderado. Un monolito puede responder sin problema a esta demanda.


Comparación con otras arquitecturas
Microservicios: mayor escalabilidad, pero requiere orquestación y más complejidad en la gestión de servicios.


Serverless: elasticidad y pago por uso, pero compleja integración con PostgreSQL y funciones distribuidas.
