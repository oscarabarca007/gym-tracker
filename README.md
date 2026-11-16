# GymTrack

App web para dar seguimiento a entrenamientos de hipertrofia, con diseño Material Design 3.

## Funciones

- **Rutina por defecto** (editable): Lunes pecho y tríceps, Martes pierna (cuádriceps), Miércoles espalda y bíceps, Jueves pierna (femoral y glúteo).
- **Registro de series**: peso y repeticiones por serie, con los valores de la sesión anterior como referencia.
- **Temporizador de descanso** automático al completar cada serie (tiempo específico por ejercicio, con sonido y vibración).
- **Sobrecarga progresiva**: sugiere cuándo subir peso según tu último rendimiento.
- **Historial y récords** (1RM estimado con la fórmula de Epley).
- **Progreso de peso** con gráfica, fecha estimada para tu meta y calorías y macros sugeridos.
- Crear, duplicar y editar rutinas; tema claro u oscuro; exportar e importar un respaldo en JSON.
- Funciona sin conexión y se puede instalar como app (PWA).

Los datos se guardan en el `localStorage` del navegador (solo en ese dispositivo).

## Ejecutar en local

Es un sitio estático, así que basta con servir la carpeta:

```bash
npx serve .
```
