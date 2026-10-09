import { workflow, node, trigger, languageModel, memory, ifElse, switchCase, expr } from '@n8n/workflow-sdk';

const CRM = 'https://aiuda-empresas.vercel.app';
const CW = 'https://chatwoot-production-8564.up.railway.app/api/v1/accounts';
const credCrm = { httpHeaderAuth: { id: 'UDLkIFYmIOTGYKKj', name: 'CRM Aiuda Empresas' } };
const credCw = { httpHeaderAuth: { id: 'JUdPITdOVffodNzC', name: 'Chatwoot Fagal API' } };
const credWa = { httpHeaderAuth: { id: '8BXtTKC3qbdMCDoM', name: 'Meta WhatsApp Fagal' } };

const verificarGet = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Verificación de Meta (GET)',
    parameters: { httpMethod: 'GET', path: 'aiuda-empresas-whatsapp', responseMode: 'responseNode' },
  },
  output: [{ query: { 'hub.verify_token': 'aiuda-empresas-2026', 'hub.challenge': '12345' } }],
});

const tokenCorrecto = ifElse({
  version: 2.2,
  config: {
    name: '¿Token de verificación correcto?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
        conditions: [{ leftValue: expr('{{ $json.query["hub.verify_token"] }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'aiuda-empresas-2026' }],
        combinator: 'and',
      },
    },
  },
});

const responderReto = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: { name: 'Responder reto', parameters: { respondWith: 'text', responseBody: expr('{{ $json.query["hub.challenge"] }}') } },
  output: [{}],
});

const rechazar = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: { name: 'Rechazar verificación', parameters: { respondWith: 'text', responseBody: 'token inválido', options: { responseCode: 403 } } },
  output: [{}],
});

const mensajeEntrante = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Mensaje de WhatsApp (POST)',
    parameters: { httpMethod: 'POST', path: 'aiuda-empresas-whatsapp', responseMode: 'onReceived' },
  },
  output: [{ body: { entry: [{ changes: [{ value: { metadata: { phone_number_id: '1417299348129209' }, contacts: [{ profile: { name: 'Ana' } }], messages: [{ from: '593991234567', type: 'text', text: { body: 'Hola' } }] } }] }] } }],
});

const normalizar = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Normalizar mensaje',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode:
        "const salida = [];\n" +
        "for (const item of $input.all()) {\n" +
        "  const valor = item.json.body?.entry?.[0]?.changes?.[0]?.value ?? {};\n" +
        "  const msg = valor.messages?.[0];\n" +
        "  if (!msg) continue; // estados de entrega y lecturas: no se responde\n" +
        "  const texto = msg.text?.body ?? msg.button?.text ?? msg.interactive?.button_reply?.title ?? msg.interactive?.list_reply?.title ?? '';\n" +
        "  salida.push({ json: {\n" +
        "    phone_number_id: String(valor.metadata?.phone_number_id ?? ''),\n" +
        "    telefono: String(msg.from ?? ''),\n" +
        "    nombre_perfil: valor.contacts?.[0]?.profile?.name ?? '',\n" +
        "    tipo: msg.type ?? 'desconocido',\n" +
        "    texto: texto || (msg.type === 'audio' ? '[Envió una nota de voz]' : '[Envió un archivo o imagen]'),\n" +
        "    referral: msg.referral ?? null,\n" +
        "    sesion: String(valor.metadata?.phone_number_id ?? '') + ':' + String(msg.from ?? ''),\n" +
        "  } });\n" +
        "}\n" +
        "return salida;",
    },
  },
  output: [{ phone_number_id: '1417299348129209', telefono: '593991234567', nombre_perfil: 'Ana', tipo: 'text', texto: 'Hola', referral: null, sesion: '1417299348129209:593991234567' }],
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
      jsonBody: expr('{{ JSON.stringify({ phone_number_id: $json.phone_number_id, telefono: $json.telefono, texto: $json.texto, referral: $json.referral ?? undefined }) }}'),
      options: { timeout: 15000 },
    },
    credentials: credCrm,
  },
  output: [{ organizacion: { nombre: 'Fagal Abogados', especialista: 'un abogado', codigo: 'FAG' }, servicios: [], conocimiento: {}, angulo_detectado: null, lead: null, ventana_abierta: true, canal: { chatwoot_cuenta_id: 4, chatwoot_bandeja_id: 6 } }],
});

const planChatwoot = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Plan de Chatwoot',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode:
        "const ctx = $input.first().json;\n" +
        "const entrada = $('Normalizar mensaje').first().json;\n" +
        "const canal = ctx.canal;\n" +
        "const conv = ctx.lead?.chatwoot_conversacion_id ?? null;\n" +
        "const modo = !canal ? 'sin_chatwoot' : conv ? 'conocida' : 'nueva';\n" +
        "return [{ json: { modo, cuenta: canal?.chatwoot_cuenta_id ?? null, bandeja: canal?.chatwoot_bandeja_id ?? null, conversacion_id: conv, contacto_id: ctx.lead?.chatwoot_contacto_id ?? null, telefono_e164: '+' + entrada.telefono.replace(/\\D/g, ''), nombre: entrada.nombre_perfil || ('+' + entrada.telefono), texto: entrada.texto, nueva: false } }];",
    },
  },
  output: [{ modo: 'nueva', cuenta: 4, bandeja: 6, conversacion_id: null, contacto_id: null, telefono_e164: '+593991234567', nombre: 'Ana', texto: 'Hola', nueva: false }],
});

const rutaChatwoot = switchCase({
  version: 3.2,
  config: {
    name: '¿Cómo va a Chatwoot?',
    parameters: {
      rules: {
        values: [
          { outputKey: 'conocida', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.modo }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'conocida' }], combinator: 'and' } },
          { outputKey: 'nueva', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.modo }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'nueva' }], combinator: 'and' } },
          { outputKey: 'sin_chatwoot', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.modo }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'sin_chatwoot' }], combinator: 'and' } },
        ],
      },
    },
  },
});

const crearContacto = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Chatwoot: crear contacto',
    onError: 'continueRegularOutput',
    parameters: {
      method: 'POST',
      url: expr(`${CW}/{{ $json.cuenta }}/contacts`),
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify({ inbox_id: $json.bandeja, name: $json.nombre, phone_number: $json.telefono_e164 }) }}'),
      options: { response: { response: { neverError: true } } },
    },
    credentials: credCw,
  },
  output: [{ payload: { contact: { id: 1 } } }],
});

const buscarContacto = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Chatwoot: buscar contacto',
    onError: 'continueRegularOutput',
    parameters: {
      method: 'GET',
      url: expr(`${CW}/{{ $('Plan de Chatwoot').first().json.cuenta }}/contacts/search?q={{ encodeURIComponent($('Plan de Chatwoot').first().json.telefono_e164) }}`),
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      options: { response: { response: { neverError: true } } },
    },
    credentials: credCw,
  },
  output: [{ payload: [{ id: 1 }] }],
});

const crearConversacion = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Chatwoot: crear conversación',
    onError: 'continueRegularOutput',
    parameters: {
      method: 'POST',
      url: expr(`${CW}/{{ $('Plan de Chatwoot').first().json.cuenta }}/conversations`),
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr("{{ JSON.stringify({ inbox_id: $('Plan de Chatwoot').first().json.bandeja, contact_id: $('Chatwoot: crear contacto').first().json.payload?.contact?.id ?? $json.payload?.[0]?.id }) }}"),
    },
    credentials: credCw,
  },
  output: [{ id: 10 }],
});

const conversacionLista = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Conversación nueva lista',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode:
        "const plan = $('Plan de Chatwoot').first().json;\n" +
        "const creado = $('Chatwoot: crear contacto').first().json.payload?.contact?.id;\n" +
        "const buscado = $('Chatwoot: buscar contacto').first().json.payload?.[0]?.id;\n" +
        "return [{ json: { ...plan, conversacion_id: $input.first().json.id, contacto_id: creado ?? buscado ?? null, nueva: true } }];",
    },
  },
  output: [{ modo: 'nueva', cuenta: 4, bandeja: 6, conversacion_id: 10, contacto_id: 1, telefono_e164: '+593991234567', nombre: 'Ana', texto: 'Hola', nueva: true }],
});

const publicarEntrante = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Chatwoot: publicar mensaje del cliente',
    onError: 'continueRegularOutput',
    parameters: {
      method: 'POST',
      url: expr(`${CW}/{{ $json.cuenta }}/conversations/{{ $json.conversacion_id }}/messages`),
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify({ content: $json.texto, message_type: "incoming", private: false }) }}'),
    },
    credentials: credCw,
  },
  output: [{ id: 100 }],
});

const leerConversacion = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Chatwoot: leer etiquetas',
    onError: 'continueRegularOutput',
    parameters: {
      method: 'GET',
      url: expr(`${CW}/{{ $('Plan de Chatwoot').first().json.cuenta }}/conversations/{{ $('Chatwoot: publicar mensaje del cliente').first().json.conversation_id ?? $('Plan de Chatwoot').first().json.conversacion_id }}`),
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
    },
    credentials: credCw,
  },
  output: [{ id: 10, labels: [] }],
});

const sinPersona = ifElse({
  version: 2.2,
  config: {
    name: '¿Sin persona a cargo?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
        conditions: [{ leftValue: expr("{{ ($json.labels ?? []).includes('humano') }}"), operator: { type: 'boolean', operation: 'false', singleValue: true } }],
        combinator: 'and',
      },
    },
  },
});

const gemini = languageModel({
  type: '@n8n/n8n-nodes-langchain.lmChatGoogleGemini',
  version: 1.1,
  config: {
    name: 'Gemini (principal)',
    parameters: { modelName: 'models/gemini-2.5-flash', options: { temperature: 0.4 } },
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

const memoria = memory({
  type: '@n8n/n8n-nodes-langchain.memoryBufferWindow',
  version: 1.4,
  config: {
    name: 'Memoria de la conversación',
    parameters: { sessionIdType: 'customKey', sessionKey: expr("{{ $('Normalizar mensaje').first().json.sesion }}"), contextWindowLength: 20 },
  },
});

const agente = node({
  type: '@n8n/n8n-nodes-langchain.agent',
  version: 3.1,
  config: {
    name: 'Agente Aiuda Empresas',
    parameters: {
      promptType: 'define',
      text: expr("{{ $('Normalizar mensaje').first().json.texto }}"),
      needsFallback: true,
      options: {
        maxIterations: 3,
        systemMessage: expr(
          "Eres el asistente virtual de {{ $('Contexto del CRM').first().json.organizacion.nombre }} en WhatsApp. Atiendes a empresas que quieren una reunión con {{ $('Contexto del CRM').first().json.organizacion.especialista }}.\n\n" +
          "SERVICIOS (solo estos existen): {{ JSON.stringify($('Contexto del CRM').first().json.servicios) }}\n" +
          "INFORMACIÓN DEL CLIENTE CARGADA POR EL EQUIPO: {{ JSON.stringify($('Contexto del CRM').first().json.conocimiento) }}\n" +
          "SERVICIO POR EL QUE LLEGÓ (código): {{ $('Contexto del CRM').first().json.angulo_detectado ?? 'desconocido' }}\n" +
          "LO QUE YA SABEMOS DE ESTA PERSONA: {{ JSON.stringify($('Contexto del CRM').first().json.lead) }}\n" +
          "Nombre de perfil de WhatsApp: {{ $('Normalizar mensaje').first().json.nombre_perfil }}\n" +
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
    subnodes: { model: [gemini, openai], memory: memoria },
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
        "const entrada = $('Normalizar mensaje').first().json;\n" +
        "const plan = $('Plan de Chatwoot').first().json;\n" +
        "let cw = plan;\n" +
        "try { if ($('Conversación nueva lista').isExecuted) cw = $('Conversación nueva lista').first().json; } catch (e) {}\n" +
        "const crudo = String($input.first().json.output ?? '').replace(/^```(?:json)?\\s*/i, '').replace(/```\\s*$/, '').trim();\n" +
        "let respuesta = crudo; let datos = {};\n" +
        "try { const p = JSON.parse(crudo.slice(crudo.indexOf('{'), crudo.lastIndexOf('}') + 1)); respuesta = String(p.respuesta ?? '').trim(); datos = p.datos ?? {}; } catch (e) {}\n" +
        "if (!respuesta) respuesta = 'Gracias por escribir. En un momento le ayudamos.';\n" +
        "const limpio = {};\n" +
        "for (const c of ['nombre','empresa','cargo','ciudad','necesidad','motivo_descarte']) { if (typeof datos[c] === 'string' && datos[c].trim()) limpio[c] = datos[c].trim().slice(0, c === 'necesidad' ? 500 : 160); }\n" +
        "if (['1-9','10-49','50-199','200+'].includes(datos.colaboradores)) limpio.colaboradores = datos.colaboradores;\n" +
        "if (['baja','media','alta'].includes(datos.urgencia)) limpio.urgencia = datos.urgencia;\n" +
        "const encaje = Number(datos.encaje); if (Number.isInteger(encaje) && encaje >= 0 && encaje <= 100) limpio.encaje = encaje;\n" +
        "if (datos.etapa === 'calificado' || (datos.etapa === 'descartado' && limpio.motivo_descarte)) limpio.etapa = datos.etapa;\n" +
        "if (limpio.etapa !== 'descartado') delete limpio.motivo_descarte;\n" +
        "const cuerpo_crm = { phone_number_id: entrada.phone_number_id, telefono: entrada.telefono, texto: entrada.texto, mensaje_entrante: entrada.texto, mensaje_agente: respuesta, ...limpio };\n" +
        "if (entrada.referral) cuerpo_crm.referral = entrada.referral;\n" +
        "if (!limpio.nombre && entrada.nombre_perfil) cuerpo_crm.nombre = String(entrada.nombre_perfil).slice(0, 120);\n" +
        "if (cw.nueva && cw.conversacion_id) { cuerpo_crm.chatwoot_conversacion_id = cw.conversacion_id; if (cw.contacto_id) cuerpo_crm.chatwoot_contacto_id = cw.contacto_id; }\n" +
        "return [{ json: { respuesta, telefono: entrada.telefono, phone_number_id: entrada.phone_number_id, cuenta: cw.cuenta, conversacion_id: cw.conversacion_id, por_chatwoot: Boolean(cw.cuenta && cw.conversacion_id), cuerpo_crm } }];",
    },
  },
  output: [{ respuesta: 'Hola', telefono: '593991234567', phone_number_id: '1417299348129209', cuenta: 4, conversacion_id: 10, por_chatwoot: true, cuerpo_crm: {} }],
});

const porChatwoot = ifElse({
  version: 2.2,
  config: {
    name: '¿Sale por Chatwoot?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
        conditions: [{ leftValue: expr('{{ $json.por_chatwoot }}'), operator: { type: 'boolean', operation: 'true', singleValue: true } }],
        combinator: 'and',
      },
    },
  },
});

const publicarRespuesta = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Chatwoot: publicar respuesta del agente',
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

const enviarDirecto = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Enviar por WhatsApp (sin Chatwoot)',
    onError: 'continueRegularOutput',
    parameters: {
      method: 'POST',
      url: expr('https://graph.facebook.com/v22.0/{{ $json.phone_number_id }}/messages'),
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify({ messaging_product: "whatsapp", to: $json.telefono, type: "text", text: { body: $json.respuesta } }) }}'),
    },
    credentials: credWa,
  },
  output: [{ messages: [{ id: 'wamid.x' }] }],
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
      jsonBody: expr('{{ JSON.stringify($json.cuerpo_crm) }}'),
      options: { timeout: 15000 },
    },
    credentials: credCrm,
  },
  output: [{ ok: true }],
});

const desdeChatwoot = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Respuesta desde Chatwoot (POST)',
    parameters: { httpMethod: 'POST', path: 'aiuda-empresas-chatwoot', responseMode: 'onReceived' },
  },
  output: [{ body: { event: 'message_created', message_type: 'outgoing', private: false, content: 'Hola', sender: { id: 12, name: 'Agente Fagal' }, inbox: { id: 6 }, account: { id: 4 }, conversation: { id: 10, labels: [], meta: { sender: { phone_number: '+593991234567' } } } } }],
});

const filtrarSaliente = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Solo respuestas públicas',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode:
        "const b = $input.first().json.body ?? {};\n" +
        "const saliente = b.message_type === 'outgoing' || b.message_type === 1;\n" +
        "if (b.event !== 'message_created' || !saliente || b.private || !String(b.content ?? '').trim()) return [];\n" +
        "const remitente = b.sender?.name ?? '';\n" +
        "return [{ json: {\n" +
        "  cuenta: b.account?.id, bandeja: b.inbox?.id, conversacion_id: b.conversation?.id,\n" +
        "  etiquetas: b.conversation?.labels ?? [],\n" +
        "  telefono_payload: String(b.conversation?.meta?.sender?.phone_number ?? '').replace(/\\D/g, ''),\n" +
        "  contenido: String(b.content), remitente,\n" +
        "  es_agente: remitente.startsWith('Agente '),\n" +
        "} }];",
    },
  },
  output: [{ cuenta: 4, bandeja: 6, conversacion_id: 10, etiquetas: [], telefono_payload: '593991234567', contenido: 'Hola', remitente: 'Agente Fagal', es_agente: true }],
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
      jsonBody: expr('{{ JSON.stringify({ chatwoot_bandeja_id: $json.bandeja, chatwoot_conversacion_id: $json.conversacion_id }) }}'),
    },
    credentials: credCrm,
  },
  output: [{ phone_number_id: '1417299348129209', telefono: '+593991234567' }],
});

const enviarDesdeChatwoot = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Enviar por WhatsApp',
    onError: 'continueRegularOutput',
    parameters: {
      method: 'POST',
      url: expr('https://graph.facebook.com/v22.0/{{ $json.phone_number_id }}/messages'),
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr("{{ JSON.stringify({ messaging_product: 'whatsapp', to: $('Solo respuestas públicas').first().json.telefono_payload || String($json.telefono ?? '').replace(/\\D/g, ''), type: 'text', text: { body: $('Solo respuestas públicas').first().json.contenido } }) }}"),
    },
    credentials: credWa,
  },
  output: [{ messages: [{ id: 'wamid.y' }] }],
});

const esPersona = ifElse({
  version: 2.2,
  config: {
    name: '¿Escribió una persona?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
        conditions: [{ leftValue: expr("{{ $('Solo respuestas públicas').first().json.es_agente }}"), operator: { type: 'boolean', operation: 'false', singleValue: true } }],
        combinator: 'and',
      },
    },
  },
});

const etiquetaHumano = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Chatwoot: etiqueta humano',
    onError: 'continueRegularOutput',
    parameters: {
      method: 'POST',
      url: expr(`${CW}/{{ $('Solo respuestas públicas').first().json.cuenta }}/conversations/{{ $('Solo respuestas públicas').first().json.conversacion_id }}/labels`),
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr("{{ JSON.stringify({ labels: [...new Set([...($('Solo respuestas públicas').first().json.etiquetas || []), 'humano'])] }) }}"),
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
      jsonBody: expr("{{ JSON.stringify({ phone_number_id: $('Canal del CRM').first().json.phone_number_id, telefono: $('Canal del CRM').first().json.telefono || ('+' + $('Solo respuestas públicas').first().json.telefono_payload), mensaje_persona: $('Solo respuestas públicas').first().json.contenido, autor_persona: $('Solo respuestas públicas').first().json.remitente }) }}"),
    },
    credentials: credCrm,
  },
  output: [{ ok: true }],
});

export default workflow('aiuda-empresas-agente', 'Aiuda Empresas · Agente WhatsApp')
  .add(verificarGet)
  .to(tokenCorrecto.onTrue(responderReto).onFalse(rechazar))
  .add(mensajeEntrante)
  .to(normalizar)
  .to(contexto)
  .to(planChatwoot)
  .to(rutaChatwoot
    .onCase(0, publicarEntrante)
    .onCase(1, crearContacto.to(buscarContacto).to(crearConversacion).to(conversacionLista).to(publicarEntrante))
    .onCase(2, agente))
  .add(publicarEntrante)
  .to(leerConversacion)
  .to(sinPersona.onTrue(agente))
  .add(agente)
  .to(leerRespuesta)
  .to(porChatwoot.onTrue(publicarRespuesta).onFalse(enviarDirecto))
  .add(leerRespuesta)
  .to(guardarCrm)
  .add(desdeChatwoot)
  .to(filtrarSaliente)
  .to(canal)
  .to(enviarDesdeChatwoot)
  .to(esPersona.onTrue(etiquetaHumano.to(registrarPersona)));
