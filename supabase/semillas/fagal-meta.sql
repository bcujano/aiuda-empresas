-- Fagal: plan Básico ($200 + IVA) y su pauta desde la cuenta publicitaria y página de Aiuda.
update organizaciones set
  plan_codigo = 'basico',
  precio_acordado = 200,
  meta_ad_account_id = '146375004761568',
  meta_page_id = '835033990167463',
  meta_ig_id = '17841412271290888'
where slug = 'fagal';
