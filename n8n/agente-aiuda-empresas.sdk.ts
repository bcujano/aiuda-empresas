import { workflow, node, trigger, languageModel, memory, ifElse, expr } from '@n8n/workflow-sdk';

const CRM = 'https://aiuda-empresas.vercel.app';

const verificarGet = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Verificación de Meta (GET)',
    parameters: { httpMethod: 'GET', path: 'aiuda-empresas-whatsapp', responseMode: 'responseNode' },
  },
  output: [{ query: { 'hub.mode': 'subscribe', 'hub.verify_token': 'aiuda-empresas-2026', 'hub.challenge': '12345' } }],
});

const tokenCorrecto = ifElse({
  version: 2.2,
  config: {
    name: '¿Token de verificación correcto?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
        conditions: [
          {
            leftValue: expr('{{ $json.query["hub.verify_token"] }}'),
            operator: { type: 'string', operation: 'equals' },
            rightValue: 'aiuda-empresas-2026',
          },
        ],
        combinator: 'and',
      },
    },
  },
});

const responderReto = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Responder reto',
    parameters: { respondWith: 'text', responseBody: expr('{{ $json.query["hub.challenge"] }}') },
  },
  output: [{}],
});

const rechazar = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Rechazar verificación',
    parameters: { respondWith: 'text', responseBody: 'token inválido', options: { responseCode: 403 } },
  },
  output: [{}],
});

const mensajeEntrante = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Mensaje de WhatsApp (POST)',
    parameters: { httpMethod: 'POST', path: 'aiuda-empresas-whatsapp', responseMode: 'onReceived' },
  },
  output: [{ body: { entry: [{ changes: [{ value: { metadata: { phone_number_id: '1417299348129209' }, contacts: [{ profile: { name: 'Ana' } }], messages: [{ from: '593991234567', id: 'wamid.1', type: 'text', text: { body: 'Hola (Ref. FAG-TRI)' } }] } }] }] } }],
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
        "  if (!msg) continue; // estados de entrega, lecturas: no se responde\n" +
        "  const texto = msg.text?.body ?? msg.button?.text ?? msg.interactive?.button_reply?.title ?? msg.interactive?.list_reply?.title ?? '';\n" +
        "  salida.push({ json: {\n" +
        "    phone_number_id: String(valor.metadata?.phone_number_id ?? ''),\n" +
        "    telefono: String(msg.from ?? ''),\n" +
        "    nombre_perfil: valor.contacts?.[0]?.profile?.name ?? '',\n" +
        "    tipo: msg.type ?? 'desconocido',\n" +
        "    texto: texto || (msg.type === 'audio' ? '[Envió una nota de voz]' : '[Envió un archivo o imagen]'),\n" +
        "    es_texto: Boolean(texto),\n" +
        "    referral: msg.referral ?? null,\n" +
        "    sesion: String(valor.metadata?.phone_number_id ?? '') + ':' + String(msg.from ?? ''),\n" +
        "  } });\n" +
        "}\n" +
        "return salida;",
    },
  },
  output: [{ phone_number_id: '1417299348129209', telefono: '593991234567', nombre_perfil: 'Ana', tipo: 'text', texto: 'Hola (Ref. FAG-TRI)', es_texto: true, referral: null, sesion: '1417299348129209:593991234567' }],
});

const contexto = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Contexto del CRM',
    parameters: {
      method: 'POST',
      url: CRM + '/api/agente/contexto',
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify({ phone_number_id: $json.phone_number_id, telefono: $json.telefono, texto: $json.texto, referral: $json.referral ?? undefined }) }}'),
      options: { timeout: 15000 },
    },
    credentials: { httpHeaderAuth: { id: 'UDLkIFYmIOTGYKKj', name: 'CRM Aiuda Empresas' } },
  },
  output: [{ organizacion: { nombre: 'Fagal Abogados', especialista: 'un abogado', ciudad: null, codigo: 'FAG' }, servicios: [{ codigo: 'TRI', servicio: 'Defensa tributaria ante el SRI', para_quien: [], no_para_quien: [] }], conocimiento: {}, angulo_detectado: 'TRI', lead: null, ventana_abierta: true }],
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
    parameters: {
      sessionIdType: 'customKey',
      sessionKey: expr("{{ $('Normalizar mensaje').item.json.sesion }}"),
      contextWindowLength: 20,
    },
  },
});

const agente = node({
  type: '@n8n/n8n-nodes-langchain.agent',
  version: 3.1,
  config: {
    name: 'Agente Aiuda Empresas',
    parameters: {
      promptType: 'define',
      text: expr("{{ $('Normalizar mensaje').item.json.texto }}"),
      needsFallback: true,
      options: {
        maxIterations: 3,
        systemMessage: expr(
          'Eres el asistente virtual de {{ $json.organizacion.nombre }} en WhatsApp. Atiendes a empresas que quieren una reunión con {{ $json.organizacion.especialista }}.\n\n' +
          'SERVICIOS (solo estos existen): {{ JSON.stringify($json.servicios) }}\n' +
          'INFORMACIÓN DEL CLIENTE CARGADA POR EL EQUIPO: {{ JSON.stringify($json.conocimiento) }}\n' +
          'SERVICIO POR EL QUE LLEGÓ (código): {{ $json.angulo_detectado ?? "desconocido" }}\n' +
          'LO QUE YA SABEMOS DE ESTA PERSONA: {{ JSON.stringify($json.lead) }}\n' +
          'Nombre de perfil de WhatsApp: {{ $("Normalizar mensaje").item.json.nombre_perfil }}\n' +
          'Fecha y hora en Quito: {{ $now.setZone("America/Guayaquil").toFormat("cccc d LLLL yyyy, HH:mm", { locale: "es" }) }}\n\n' +
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
  output: [{ output: '{"respuesta":"Hola, gracias por escribir. ¿Me ayuda con su nombre y el de su empresa?","datos":{"nombre":null}}' }],
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
        "const crudo = String($input.first().json.output ?? '').replace(/^```(?:json)?\\s*/i, '').replace(/```\\s*$/, '').trim();\n" +
        "let respuesta = crudo; let datos = {};\n" +
        "try { const p = JSON.parse(crudo.slice(crudo.indexOf('{'), crudo.lastIndexOf('}') + 1)); respuesta = String(p.respuesta ?? '').trim(); datos = p.datos ?? {}; } catch (e) { /* texto plano: se manda tal cual */ }\n" +
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
        "return [{ json: { respuesta, telefono: entrada.telefono, phone_number_id: entrada.phone_number_id, cuerpo_crm } }];",
    },
  },
  output: [{ respuesta: 'Hola, ¿me ayuda con su nombre?', telefono: '593991234567', phone_number_id: '1417299348129209', cuerpo_crm: { phone_number_id: '1417299348129209', telefono: '593991234567' } }],
});

const enviarWhatsApp = node({
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
      jsonBody: expr('{{ JSON.stringify({ messaging_product: "whatsapp", to: $json.telefono, type: "text", text: { body: $json.respuesta } }) }}'),
    },
    credentials: { httpHeaderAuth: { id: '8BXtTKC3qbdMCDoM', name: 'Meta WhatsApp Fagal' } },
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
      url: CRM + '/api/agente/lead',
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify($json.cuerpo_crm) }}'),
      options: { timeout: 15000 },
    },
    credentials: { httpHeaderAuth: { id: 'UDLkIFYmIOTGYKKj', name: 'CRM Aiuda Empresas' } },
  },
  output: [{ ok: true, lead_id: 'x', etapa: 'nuevo' }],
});

export default workflow('aiuda-empresas-agente', 'Aiuda Empresas · Agente WhatsApp')
  .add(verificarGet)
  .to(tokenCorrecto.onTrue(responderReto).onFalse(rechazar))
  .add(mensajeEntrante)
  .to(normalizar)
  .to(contexto)
  .to(agente)
  .to(leerRespuesta)
  .to(enviarWhatsApp)
  .add(leerRespuesta)
  .to(guardarCrm);
