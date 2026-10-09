import { workflow, node, trigger, languageModel, ifElse, expr } from '@n8n/workflow-sdk';

const CRM = 'https://aiuda-empresas.vercel.app';
const CW = 'https://chatwoot-production-8564.up.railway.app/api/v1/accounts';
const credCrm = { httpHeaderAuth: { id: 'UDLkIFYmIOTGYKKj', name: 'CRM Aiuda Empresas' } };
const credCw = { httpHeaderAuth: { id: 'JUdPITdOVffodNzC', name: 'Chatwoot Fagal API' } };

/*
 * v3 · Esquema probado de Aiuda: Meta → bandeja «WhatsApp Cloud» de Chatwoot →
 * webhook de la cuenta de Chatwoot → este workflow → respuesta por la API de
 * Chatwoot (Chatwoot la entrega a WhatsApp). Cada cliente tiene su cuenta de
 * Chatwoot; el CRM sabe de quién es por esa cuenta.
 */

const desdeChatwoot = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Evento de Chatwoot (POST)',
    parameters: { httpMethod: 'POST', path: 'aiuda-empresas-chatwoot', responseMode: 'onReceived' },
  },
  output: [{ body: { event: 'message_created', message_type: 'incoming', private: false, content: 'Hola', attachments: [], sender: { id: 1, name: 'Ana', phone_number: '+593991234567' }, inbox: { id: 7 }, account: { id: 4 }, conversation: { id: 10, labels: [], meta: { sender: { id: 1, phone_number: '+593991234567' } } } } }],
});

const clasificar = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Clasificar mensaje',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode:
        "const b = $input.first().json.body ?? {};\n" +
        "if (b.event !== 'message_created' || b.private) return [];\n" +
        "const entrante = b.message_type === 'incoming' || b.message_type === 0;\n" +
        "const saliente = b.message_type === 'outgoing' || b.message_type === 1;\n" +
        "const conv = b.conversation ?? {};\n" +
        "const remitente = b.sender ?? {};\n" +
        "const nombre = String(remitente.name ?? '');\n" +
        "// Lo que publica el propio agente («Agente …») y los avisos automáticos de Chatwoot no se procesan.\n" +
        "if (!entrante && !(saliente && nombre && !nombre.startsWith('Agente '))) return [];\n" +
        "const telefono = String(conv.meta?.sender?.phone_number ?? (entrante ? remitente.phone_number : '') ?? '').replace(/\\D/g, '');\n" +
        "const adjuntos = b.attachments ?? [];\n" +
        "let texto = String(b.content ?? '').trim();\n" +
        "if (!texto && adjuntos.length) texto = adjuntos.some((a) => a.file_type === 'audio') ? '[Envió una nota de voz]' : '[Envió un archivo o imagen]';\n" +
        "if (!texto || !telefono || !b.account?.id || !conv.id) return [];\n" +
        "return [{ json: {\n" +
        "  tipo: entrante ? 'cliente' : 'persona',\n" +
        "  cuenta: b.account.id, conversacion_id: conv.id, mensaje_id: b.id,\n" +
        "  contacto_id: conv.meta?.sender?.id ?? (entrante ? remitente.id : null) ?? null,\n" +
        "  etiquetas: conv.labels ?? [], telefono, texto,\n" +
        "  nombre_perfil: entrante ? nombre : '', remitente: nombre,\n" +
        "} }];",
    },
  },
  output: [{ tipo: 'cliente', cuenta: 4, conversacion_id: 10, mensaje_id: 500, contacto_id: 1, etiquetas: [], telefono: '593991234567', texto: 'Hola', nombre_perfil: 'Ana', remitente: 'Ana' }],
});

const canal = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Canal del CRM',
    parameters: {
      method: 'POST',
      url: `${CRM}/api/agente/canal`,
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify({ chatwoot_cuenta_id: $json.cuenta, chatwoot_conversacion_id: $json.conversacion_id }) }}'),
      options: { timeout: 15000 },
    },
    credentials: credCrm,
  },
  output: [{ phone_number_id: '1417299348129209', telefono: null }],
});

const quien = ifElse({
  version: 2.2,
  config: {
    name: '¿Escribió el cliente?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
        conditions: [{ leftValue: expr("{{ $('Clasificar mensaje').first().json.tipo }}"), operator: { type: 'string', operation: 'equals' }, rightValue: 'cliente' }],
        combinator: 'and',
      },
    },
  },
});

const esperar = node({
  type: 'n8n-nodes-base.wait',
  version: 1.1,
  config: { name: 'Esperar mensajes seguidos (7 s)', parameters: { resume: 'timeInterval', amount: 7, unit: 'seconds' } },
  output: [{}],
});

const leerMensajes = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Chatwoot: últimos mensajes',
    onError: 'continueRegularOutput',
    parameters: {
      method: 'GET',
      url: expr(`${CW}/{{ $('Clasificar mensaje').first().json.cuenta }}/conversations/{{ $('Clasificar mensaje').first().json.conversacion_id }}/messages`),
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
    },
    credentials: credCw,
  },
  output: [{ payload: [{ id: 500, message_type: 0, private: false, content: 'Hola', attachments: [] }] }],
});

const juntar = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Juntar mensajes seguidos',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode:
        "// Si la persona mandó varios mensajes seguidos, responde solo la última ejecución y con todos juntos.\n" +
        "const m = $('Clasificar mensaje').first().json;\n" +
        "const lista = ($input.first().json.payload ?? []).filter((x) => !x.private && (x.message_type === 0 || x.message_type === 1));\n" +
        "if (!lista.length) return [{ json: { texto: m.texto } }];\n" +
        "if (lista.some((x) => x.message_type === 0 && x.id > m.mensaje_id)) return [];\n" +
        "const textos = [];\n" +
        "for (let i = lista.length - 1; i >= 0; i--) {\n" +
        "  const x = lista[i];\n" +
        "  if (x.message_type === 1) break;\n" +
        "  if (x.id > m.mensaje_id) continue;\n" +
        "  const adj = x.attachments ?? [];\n" +
        "  const t = String(x.content ?? '').trim() || (adj.some((a) => a.file_type === 'audio') ? '[Envió una nota de voz]' : adj.length ? '[Envió un archivo o imagen]' : '');\n" +
        "  if (t) textos.unshift(t);\n" +
        "}\n" +
        "return [{ json: { texto: (textos.join('\\n') || m.texto).slice(0, 4000) } }];",
    },
  },
  output: [{ texto: 'Hola' }],
});

const leerEtiquetas = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Chatwoot: leer etiquetas',
    onError: 'continueRegularOutput',
    parameters: {
      method: 'GET',
      url: expr(`${CW}/{{ $('Clasificar mensaje').first().json.cuenta }}/conversations/{{ $('Clasificar mensaje').first().json.conversacion_id }}/labels`),
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
    },
    credentials: credCw,
  },
  output: [{ payload: [] }],
});

const sinPersona = ifElse({
  version: 2.2,
  config: {
    name: '¿Sin persona a cargo?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
        conditions: [{ leftValue: expr("{{ [...($json.payload ?? []), ...($('Clasificar mensaje').first().json.etiquetas ?? [])].includes('humano') }}"), operator: { type: 'boolean', operation: 'false', singleValue: true } }],
        combinator: 'and',
      },
    },
  },
});

const contexto = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Contexto del CRM',
    parameters: {
      method: 'POST',
      url: `${CRM}/api/agente/contexto`,
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr("{{ JSON.stringify({ phone_number_id: $('Canal del CRM').first().json.phone_number_id, telefono: $('Clasificar mensaje').first().json.telefono, texto: $('Juntar mensajes seguidos').first().json.texto }) }}"),
      options: { timeout: 15000 },
    },
    credentials: credCrm,
  },
  output: [{ organizacion: { nombre: 'Fagal Abogados', especialista: 'un abogado', codigo: 'FAG' }, servicios: [], conocimiento: {}, angulo_detectado: null, lead: null, ventana_abierta: true, historial: [], tope_alcanzado: false }],
});

const dentroTope = ifElse({
  version: 2.2,
  config: {
    name: '¿Dentro del tope diario?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
        conditions: [{ leftValue: expr('{{ $json.tope_alcanzado === true }}'), operator: { type: 'boolean', operation: 'false', singleValue: true } }],
        combinator: 'and',
      },
    },
  },
});

const gemini = languageModel({
  type: '@n8n/n8n-nodes-langchain.lmChatGoogleGemini',
  version: 1.1,
  config: {
    name: 'Gemini gratis (principal)',
    parameters: { modelName: 'models/gemini-3.1-flash-lite', options: { temperature: 0.4 } },
    credentials: { googlePalmApi: { id: 'jbOxhXuz7QS5IefQ', name: 'Gemini Aiuda' } },
  },
});

const openai = languageModel({
  type: '@n8n/n8n-nodes-langchain.lmChatOpenAi',
  version: 1.3,
  config: {
    name: 'OpenAI (respaldo)',
    parameters: { model: { __rl: true, mode: 'id', value: 'gpt-4.1-mini' }, options: { temperature: 0.4 } },
    credentials: { openAiApi: { id: 'GvNmUCZRx5ZvZerQ', name: 'OpenAi account' } },
  },
});

const agente = node({
  type: '@n8n/n8n-nodes-langchain.agent',
  version: 3.1,
  config: {
    name: 'Agente Aiuda Empresas',
    parameters: {
      promptType: 'define',
      text: expr("{{ $('Juntar mensajes seguidos').first().json.texto }}"),
      needsFallback: true,
      options: {
        maxIterations: 3,
        systemMessage: expr(
          "Eres el asistente virtual de {{ $('Contexto del CRM').first().json.organizacion.nombre }} en WhatsApp. Atiendes a empresas que quieren una reunión con {{ $('Contexto del CRM').first().json.organizacion.especialista }}.\n\n" +
          "SERVICIOS (solo estos existen): {{ JSON.stringify($('Contexto del CRM').first().json.servicios) }}\n" +
          "INFORMACIÓN DEL CLIENTE CARGADA POR EL EQUIPO: {{ JSON.stringify($('Contexto del CRM').first().json.conocimiento) }}\n" +
          "SERVICIO POR EL QUE LLEGÓ (código): {{ $('Contexto del CRM').first().json.angulo_detectado ?? 'desconocido' }}\n" +
          "LO QUE YA SABEMOS DE ESTA PERSONA: {{ JSON.stringify($('Contexto del CRM').first().json.lead) }}\n" +
          "CONVERSACIÓN ANTERIOR (de la más antigua a la más reciente; 'equipo' es una persona del estudio): {{ JSON.stringify($('Contexto del CRM').first().json.historial ?? []) }}\n" +
          "Nombre de perfil de WhatsApp: {{ $('Clasificar mensaje').first().json.nombre_perfil }}\n" +
          "Fecha y hora en Quito: {{ $now.setZone('America/Guayaquil').toFormat('cccc d LLLL yyyy, HH:mm', { locale: 'es' }) }}\n\n" +
          'OBJETIVO: entender en pocas preguntas qué necesita la empresa y, si encaja, dejar lista la reunión.\n\n' +
          'REGLAS:\n' +
          '1. Español de Ecuador, trato de usted, cordial y profesional. Mensajes cortos (máximo 3 frases) y una sola pregunta por mensaje.\n' +
          '2. Nunca das asesoría legal, ni opinas sobre el caso, ni prometes resultados, ni das honorarios. Si preguntan precio: los honorarios los define el abogado según el caso, en la reunión.\n' +
          '3. Nunca pides detalles del caso, documentos ni datos sensibles. Solo pides, de a uno: nombre, empresa, cargo, número de colaboradores, ciudad y en una frase qué tema necesita resolver y qué tan urgente es.\n' +
          '4. Si la persona es un particular, un trabajador contra su empleador o algo de la lista no_para_quien, explica con amabilidad que este canal atiende empresas y cierra; marca etapa descartado con el motivo.\n' +
          '5. No inventes datos del estudio (dirección, años, nombres de abogados, horarios). Si no están en la información cargada, di que el equipo lo confirma.\n' +
          '6. Si preguntan si eres una persona, di con claridad que eres un asistente virtual.\n' +
          '7. Cuando tengas empresa, cargo, colaboradores y la necesidad, y el tema encaje con un servicio: marca etapa calificado, pide dos o tres horarios que le acomoden para una reunión y avisa que el equipo le confirma la hora por este mismo WhatsApp. No confirmes tú una hora.\n' +
          '8. Si el mensaje dice [Envió una nota de voz] o [Envió un archivo o imagen], pide amablemente que lo escriba en texto.\n\n' +
          'FORMATO: responde SOLO con un JSON válido, sin texto antes ni después y sin bloques de código:\n' +
          '{"respuesta":"mensaje para WhatsApp","datos":{"nombre":null,"empresa":null,"cargo":null,"colaboradores":null,"ciudad":null,"necesidad":null,"urgencia":null,"encaje":null,"etapa":null,"motivo_descarte":null}}\n' +
          'En datos pon solo lo que la persona dijo en esta conversación; lo demás va en null. colaboradores: "1-9", "10-49", "50-199" o "200+". urgencia: "baja", "media" o "alta". encaje: entero de 0 a 100 según qué tan bien encaja con los servicios. etapa: null, "calificado" o "descartado".',
        ),
      },
    },
    subnodes: { model: [gemini, openai] },
  },
  output: [{ output: '{"respuesta":"Hola, ¿me ayuda con su nombre y el de su empresa?","datos":{}}' }],
});

const leerRespuesta = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Leer respuesta del agente',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode:
        "const m = { ...$('Clasificar mensaje').first().json, texto: $('Juntar mensajes seguidos').first().json.texto };\n" +
        "const previa = $('Contexto del CRM').first().json.lead?.etapa ?? 'nuevo';\n" +
        "const pnid = $('Canal del CRM').first().json.phone_number_id;\n" +
        "const crudo = String($input.first().json.output ?? '').replace(/^```(?:json)?\\s*/i, '').replace(/```\\s*$/, '').trim();\n" +
        "let respuesta = crudo; let datos = {};\n" +
        "try { const p = JSON.parse(crudo.slice(crudo.indexOf('{'), crudo.lastIndexOf('}') + 1)); respuesta = String(p.respuesta ?? '').trim(); datos = p.datos ?? {}; } catch (e) {}\n" +
        "if (!respuesta) respuesta = 'Gracias por escribir. En un momento le ayudamos.';\n" +
        "const limpio = {};\n" +
        "for (const c of ['nombre','empresa','cargo','ciudad','necesidad','motivo_descarte']) { if (typeof datos[c] === 'string' && datos[c].trim()) limpio[c] = datos[c].trim().slice(0, c === 'necesidad' ? 500 : 160); }\n" +
        "if (['1-9','10-49','50-199','200+'].includes(datos.colaboradores)) limpio.colaboradores = datos.colaboradores;\n" +
        "if (['baja','media','alta'].includes(datos.urgencia)) limpio.urgencia = datos.urgencia;\n" +
        "const encaje = datos.encaje == null || datos.encaje === '' ? NaN : Number(datos.encaje); if (Number.isInteger(encaje) && encaje >= 0 && encaje <= 100) limpio.encaje = encaje;\n" +
        "if (datos.etapa === 'calificado' || (datos.etapa === 'descartado' && limpio.motivo_descarte)) limpio.etapa = datos.etapa;\n" +
        "if (limpio.etapa !== 'descartado') delete limpio.motivo_descarte;\n" +
        "const cuerpo_crm = { phone_number_id: pnid, telefono: m.telefono, texto: m.texto, mensaje_entrante: m.texto, mensaje_agente: respuesta, chatwoot_conversacion_id: m.conversacion_id, ...limpio };\n" +
        "if (m.contacto_id) cuerpo_crm.chatwoot_contacto_id = m.contacto_id;\n" +
        "if (!limpio.nombre && m.nombre_perfil) cuerpo_crm.nombre = String(m.nombre_perfil).slice(0, 120);\n" +
        "const avisar = limpio.etapa === 'calificado' && previa === 'nuevo';\n" +
        "const d = { ...($('Contexto del CRM').first().json.lead ?? {}), ...limpio };\n" +
        "const nota = ['Lead calificado por el agente. Falta confirmar la reunión.', 'Nombre: ' + (d.nombre ?? cuerpo_crm.nombre ?? '—'), 'Empresa: ' + (d.empresa ?? '—'), 'Cargo: ' + (d.cargo ?? '—'), 'Colaboradores: ' + (d.colaboradores ?? '—'), 'Ciudad: ' + (d.ciudad ?? '—'), 'Necesidad: ' + (d.necesidad ?? '—'), 'Urgencia: ' + (d.urgencia ?? '—')].join('\\n');\n" +
        "return [{ json: { respuesta, cuenta: m.cuenta, conversacion_id: m.conversacion_id, cuerpo_crm, avisar, nota } }];",
    },
  },
  output: [{ respuesta: 'Hola', cuenta: 4, conversacion_id: 10, cuerpo_crm: {}, avisar: false, nota: '' }],
});

const publicarRespuesta = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Chatwoot: responder (sale por WhatsApp)',
    onError: 'continueRegularOutput',
    parameters: {
      method: 'POST',
      url: expr(`${CW}/{{ $json.cuenta }}/conversations/{{ $json.conversacion_id }}/messages`),
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify({ content: $json.respuesta, message_type: "outgoing", private: false }) }}'),
    },
    credentials: credCw,
  },
  output: [{ id: 101 }],
});

const guardarCrm = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Guardar lead en el CRM',
    onError: 'continueRegularOutput',
    parameters: {
      method: 'POST',
      url: `${CRM}/api/agente/lead`,
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr("{{ JSON.stringify($('Leer respuesta del agente').first().json.cuerpo_crm) }}"),
      options: { timeout: 15000 },
    },
    credentials: credCrm,
  },
  output: [{ ok: true }],
});

const guardarEntrante = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Guardar mensaje (lo atiende una persona)',
    onError: 'continueRegularOutput',
    parameters: {
      method: 'POST',
      url: `${CRM}/api/agente/lead`,
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr("{{ JSON.stringify({ phone_number_id: $('Canal del CRM').first().json.phone_number_id, telefono: $('Clasificar mensaje').first().json.telefono, texto: $('Juntar mensajes seguidos').first().json.texto, mensaje_entrante: $('Juntar mensajes seguidos').first().json.texto, chatwoot_conversacion_id: $('Clasificar mensaje').first().json.conversacion_id }) }}"),
    },
    credentials: credCrm,
  },
  output: [{ ok: true }],
});

const etiquetaHumano = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Chatwoot: etiqueta humano',
    onError: 'continueRegularOutput',
    parameters: {
      method: 'POST',
      url: expr(`${CW}/{{ $('Clasificar mensaje').first().json.cuenta }}/conversations/{{ $('Clasificar mensaje').first().json.conversacion_id }}/labels`),
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr("{{ JSON.stringify({ labels: [...new Set([...($('Clasificar mensaje').first().json.etiquetas || []), 'humano'])] }) }}"),
    },
    credentials: credCw,
  },
  output: [{ payload: ['humano'] }],
});

const registrarPersona = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Guardar respuesta de la persona en el CRM',
    onError: 'continueRegularOutput',
    parameters: {
      method: 'POST',
      url: `${CRM}/api/agente/lead`,
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr("{{ JSON.stringify({ phone_number_id: $('Canal del CRM').first().json.phone_number_id, telefono: $('Clasificar mensaje').first().json.telefono, mensaje_persona: $('Clasificar mensaje').first().json.texto, autor_persona: $('Clasificar mensaje').first().json.remitente }) }}"),
    },
    credentials: credCrm,
  },
  output: [{ ok: true }],
});

const hayAviso = ifElse({
  version: 2.2,
  config: {
    name: '¿Quedó calificado ahora?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
        conditions: [{ leftValue: expr("{{ $('Leer respuesta del agente').first().json.avisar }}"), operator: { type: 'boolean', operation: 'true', singleValue: true } }],
        combinator: 'and',
      },
    },
  },
});

const notaCalificado = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Chatwoot: nota privada del lead calificado',
    onError: 'continueRegularOutput',
    parameters: {
      method: 'POST',
      url: expr(`${CW}/{{ $('Leer respuesta del agente').first().json.cuenta }}/conversations/{{ $('Leer respuesta del agente').first().json.conversacion_id }}/messages`),
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr("{{ JSON.stringify({ content: $('Leer respuesta del agente').first().json.nota + ($('Guardar lead en el CRM').first().json.lead_id ? '\\nFicha: https://aiuda-empresas.vercel.app/panel/leads/' + $('Guardar lead en el CRM').first().json.lead_id : ''), message_type: 'outgoing', private: true }) }}"),
    },
    credentials: credCw,
  },
  output: [{ id: 102 }],
});

const etiquetaCalificado = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Chatwoot: etiqueta calificado',
    onError: 'continueRegularOutput',
    parameters: {
      method: 'POST',
      url: expr(`${CW}/{{ $('Leer respuesta del agente').first().json.cuenta }}/conversations/{{ $('Leer respuesta del agente').first().json.conversacion_id }}/labels`),
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr("{{ JSON.stringify({ labels: [...new Set([...($('Chatwoot: leer etiquetas').first().json.payload || []), 'calificado'])] }) }}"),
    },
    credentials: credCw,
  },
  output: [{ payload: ['calificado'] }],
});

export default workflow('aiuda-empresas-agente', 'Aiuda Empresas · Agente WhatsApp')
  .add(desdeChatwoot)
  .to(clasificar)
  .to(canal)
  .to(quien
    .onTrue(esperar.to(leerMensajes).to(juntar).to(leerEtiquetas).to(sinPersona.onTrue(contexto).onFalse(guardarEntrante)))
    .onFalse(etiquetaHumano.to(registrarPersona)))
  .add(contexto)
  .to(dentroTope.onTrue(agente).onFalse(guardarEntrante))
  .add(agente)
  .to(leerRespuesta)
  .to(publicarRespuesta)
  .to(guardarCrm)
  .to(hayAviso.onTrue(notaCalificado.to(etiquetaCalificado)));
