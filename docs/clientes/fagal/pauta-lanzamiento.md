# Fagal · Pauta de lanzamiento (Quito)

Objetivo: que el mercado diga qué ángulo trae empresas que agendan. Con $3 al día la forma de
probar varios ángulos sin dividir el presupuesto es **un solo conjunto con un anuncio por
ángulo**: Meta reparte la plata hacia el que mejor responde. La segmentación la hacen el
creativo y el copy, no el público.

## Estructura

- **Campaña:** Interacción → Mensajes → WhatsApp (+593 99 258 0707). Presupuesto de campaña
  (Advantage+) **$3/día**.
- **Conjunto único:** Quito (ciudad + 15 km), 25–65 años, público Advantage+ sin intereses
  (el copy filtra). Ubicaciones Advantage+.
- **5 anuncios, uno por ángulo.** Cada uno con su **mensaje predefinido** que lleva la
  referencia: es lo que le dice al CRM de qué ángulo vino el lead (con Chatwoot se pierde el
  dato del anuncio).
- **Regla de decisión (sin adivinar):** a los 7 días o a los $20 gastados, se mira en el CRM
  *costo por lead calificado* y *costo por reunión* por ángulo. El que no tenga ni un
  calificado con el doble del costo del mejor se apaga y se prueba otro nicho de
  `nichos-long-tail.md`.

## Anuncios

| Ref | Ángulo | Gancho del creativo (imagen o video corto) | Texto principal | Título | Mensaje predefinido |
|---|---|---|---|---|---|
| FAG-TRI | Defensa tributaria | «¿Le llegó una glosa del SRI?» sobre un oficio sellado | ¿Le llegó una glosa, una determinación o un requerimiento del SRI? El plazo ya corre. Revise su caso con un abogado tributarista antes de responder. Más de 15 años asesorando empresas en Quito. | Glosa del SRI: hable con un abogado | Hola, mi empresa recibió algo del SRI y necesita asesoría. (Ref. FAG-TRI) |
| FAG-LAB | Laboral para empleadores | «Inspección del Ministerio del Trabajo mañana» | ¿Inspección del Ministerio del Trabajo, un despido delicado o una demanda de un extrabajador? Proteja a su empresa con asesoría laboral para empleadores. | Asesoría laboral para empleadores | Hola, mi empresa necesita asesoría laboral como empleador. (Ref. FAG-LAB) |
| FAG-CUM | Datos personales y UAFE | «La Ley de Datos ya se sanciona» | Si su empresa maneja datos de clientes, pacientes o usuarios, ya puede ser sancionada. Póngase en regla con protección de datos y UAFE. | Su empresa, en regla con la Ley de Datos | Hola, quiero poner a mi empresa en regla con la protección de datos. (Ref. FAG-CUM) |
| FAG-SOC | Societario | «Socios que no se ponen de acuerdo» | Un socio que bloquea, una junta impugnada o una empresa familiar sin reglas. Ordénelo antes de que sea un pleito, con asesoría corporativa. | Conflictos entre socios: resuélvalos a tiempo | Hola, mi empresa necesita asesoría societaria con sus socios. (Ref. FAG-SOC) |
| FAG-CON | Contratación pública | «¿Contratista incumplido?» sobre un logo genérico de compras públicas (sin marcas oficiales) | ¿Una entidad no le paga las planillas o le amenazan con declararle contratista incumplido? Asesoría para proveedores del Estado y convenios interinstitucionales. | Proveedores del Estado: defienda su contrato | Hola, mi empresa trabaja con el Estado y necesita asesoría en contratación pública. (Ref. FAG-CON) |

Reglas del copy (vienen del agente y de Fagal): no prometer resultados, no dar precios, no
usar logos ni sellos oficiales del SRI, Ministerio o SERCOP.

## Medición

- **Landings** (`/fagal/<ángulo>`): ya tienen el píxel de Meta (PageView y Contact al tocar
  WhatsApp). Solo falta cargar el ID del píxel en la organización.
- **CRM:** cada lead queda con su ángulo (por la referencia), etapa (calificado, agendado) y
  su cita. Ese es el tablero que decide.
- **Pendiente:** evento de Conversions API «Lead calificado» y «Agendó» al píxel, para que
  Meta optimice hacia reuniones y no solo hacia mensajes.
