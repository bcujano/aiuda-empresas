-- 0003 — RLS habilitado y denegando por defecto en todas las tablas.
-- Sin políticas, RLS niega todo a la llave anónima. El acceso legítimo entra
-- con service_role desde el servidor, que filtra por organización en cada
-- consulta (src/server/**). Es defensa en profundidad, no el control principal.

alter table organizaciones enable row level security;
alter table usuarios       enable row level security;
alter table angulos        enable row level security;
alter table leads          enable row level security;
alter table citas          enable row level security;
alter table actividad      enable row level security;
alter table conocimiento   enable row level security;
alter table uso_ia         enable row level security;
