-- Lo que incluye cada plan, en frases para la landing de Aiuda Empresas y para el panel.
alter table planes add column incluye text[] not null default '{}';
