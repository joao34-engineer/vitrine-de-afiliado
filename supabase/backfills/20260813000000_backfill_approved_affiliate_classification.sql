-- Affiliate Vitrine - backfill de classificacao aprovado pela revisao humana
--
-- ARQUIVO REVISAVEL. Nao executar em producao sem autorizacao explicita.
-- Este backfill nao apaga dados e atualiza somente campos de classificacao.
-- Preserva category, title, ai_copy, precos, links, imagens e is_active.
-- Fonte: produtos-csv/classificacao/affiliate-classification-final-approved.csv

begin;

create temporary table affiliate_classification_backfill_v1 (
  id uuid primary key,
  department_slug text not null,
  subcategory_slug text not null,
  leaf_slug text not null,
  classification_source text not null,
  classification_confidence numeric not null check (classification_confidence between 0 and 1),
  classification_review_status text not null check (classification_review_status in ('auto', 'review'))
) on commit drop;

insert into affiliate_classification_backfill_v1 (
  id,
  department_slug,
  subcategory_slug,
  leaf_slug,
  classification_source,
  classification_confidence,
  classification_review_status
)
values
  ('2dfd42d8-b2b2-4fdc-825c-433accabf78c'::uuid, 'mais', 'ferramentas', 'ferramentas', 'legacy-backfill-v1', 0.95, 'auto'),
  ('1ea1fd02-e6fe-4eea-be5e-3d7f4c0d8bf3'::uuid, 'infantil', 'roupas', 'infantil', 'legacy-backfill-v1', 0.95, 'auto'),
  ('d038a2ef-56a1-471a-8616-db947e644b42'::uuid, 'mais', 'ferramentas', 'ferramentas', 'legacy-backfill-v1', 0.95, 'auto'),
  ('2c840b78-8e41-4b72-ac43-3af1a4a15db0'::uuid, 'infantil', 'cuidados', 'bebe', 'legacy-backfill-v1', 0.95, 'auto'),
  ('374244a5-f945-428b-b56e-39efcf49cfaf'::uuid, 'infantil', 'cuidados', 'bebe', 'legacy-backfill-v1', 0.85, 'auto'),
  ('57fd0232-f684-48cd-a8b5-1d90adfbce7b'::uuid, 'pet', 'cuidados', 'pets', 'legacy-backfill-v1', 0.95, 'auto'),
  ('02bc95e1-624a-435c-b90d-8e20e3c0a3cc'::uuid, 'esportes', 'cuidados', 'fitness', 'legacy-backfill-v1', 0.88, 'auto'),
  ('25127360-fa26-41b6-b1e2-99a1ab219f04'::uuid, 'esportes', 'cuidados', 'fitness', 'legacy-backfill-v1', 0.95, 'auto'),
  ('3f53002e-0753-4440-a6fe-3b164d86b707'::uuid, 'casa', 'organizacao', 'organizacao', 'legacy-backfill-v1', 0.95, 'auto'),
  ('df69d845-d175-46dc-a02a-e644f895f538'::uuid, 'mais', 'ferramentas', 'ferramentas', 'legacy-backfill-v1', 0.88, 'auto'),
  ('36179f98-9abb-4692-a203-4fa2c8339367'::uuid, 'mulheres', 'roupas', 'roupas-femininas', 'legacy-backfill-v1', 0.85, 'auto'),
  ('c8929066-d795-4712-9630-8e973439636e'::uuid, 'cozinha', 'utensilios', 'utensilios-de-cozinha', 'legacy-backfill-v1', 0.95, 'auto'),
  ('967f9d83-50b8-47cd-b6e5-812ad947a828'::uuid, 'mulheres', 'acessorios', 'acessorios-femininos', 'legacy-backfill-v1', 0.95, 'auto'),
  ('ff3cf8e4-c987-4f99-bf6d-15359f244d08'::uuid, 'mulheres', 'roupas', 'roupas-femininas', 'legacy-backfill-v1', 0.95, 'auto'),
  ('9717310c-4a88-4b84-9364-6ab893dd656c'::uuid, 'infantil', 'roupas', 'infantil', 'legacy-backfill-v1', 0.95, 'auto'),
  ('528d177e-78d7-46b9-8ebc-4b245125e28e'::uuid, 'homens', 'acessorios', 'acessorios-masculinos', 'legacy-backfill-v1', 0.95, 'auto'),
  ('d8eafc6e-b127-466c-80a7-f797182c98e0'::uuid, 'mulheres', 'acessorios', 'acessorios-femininos', 'legacy-backfill-v1', 0.95, 'auto'),
  ('27f6eae0-2f11-4aa5-b1e9-1bbbb7feaf3e'::uuid, 'casa', 'organizacao', 'utilidades-domesticas', 'legacy-backfill-v1', 0.85, 'auto'),
  ('83d5b62c-d798-4401-97b6-4421e2619503'::uuid, 'cozinha', 'utensilios', 'utensilios-de-cozinha', 'legacy-backfill-v1', 0.88, 'auto'),
  ('8c380abd-8ee9-4465-b62d-05f1be1fc403'::uuid, 'casa', 'organizacao', 'organizacao', 'legacy-backfill-v1', 0.85, 'auto'),
  ('3baaa84d-a715-4694-ae35-a5db622e45a1'::uuid, 'casa', 'organizacao', 'decoracao', 'legacy-backfill-v1', 0.85, 'auto'),
  ('307ab03a-a862-43ab-a501-b2b9caae6f9b'::uuid, 'casa', 'organizacao', 'decoracao', 'legacy-backfill-v1', 0.85, 'auto'),
  ('a7da09d8-c82d-460e-8f13-2a7de8d1579e'::uuid, 'infantil', 'roupas', 'infantil', 'legacy-backfill-v1', 0.85, 'auto'),
  ('5e119a98-fc71-4c66-bdb5-77d2a0cdec73'::uuid, 'mulheres', 'roupas', 'roupas-femininas', 'legacy-backfill-v1', 0.95, 'auto'),
  ('0794a108-2c1a-4cb0-889d-81f9b6692ecd'::uuid, 'cozinha', 'utensilios', 'utensilios-de-cozinha', 'legacy-backfill-v1', 0.85, 'auto'),
  ('75131ce5-3109-4c7d-a962-20c6a23ceed1'::uuid, 'mais', 'automotivo', 'automotivo', 'legacy-backfill-v1', 0.95, 'auto'),
  ('8d7917ef-f0fa-4802-ada0-5b497732aa86'::uuid, 'homens', 'acessorios', 'acessorios-masculinos', 'legacy-backfill-v1', 0.95, 'auto'),
  ('7a2f8d6e-4c2b-4281-ac99-7fbab17eacf3'::uuid, 'mulheres', 'calcados', 'calcados-femininos', 'legacy-backfill-v1', 0.95, 'auto'),
  ('a530dfb0-3c83-4bad-8539-0f706b11086e'::uuid, 'tech', 'audio', 'eletronicos', 'legacy-backfill-v1', 0.85, 'auto'),
  ('3e880e51-3503-434a-9d9f-fa4d6328dfae'::uuid, 'homens', 'calcados', 'calcados-masculinos', 'legacy-backfill-v1', 0.95, 'auto'),
  ('801e5e7f-706e-40dd-a55f-cc86662dcc31'::uuid, 'homens', 'acessorios', 'acessorios-masculinos', 'legacy-backfill-v1', 0.95, 'auto'),
  ('f5f27e0d-91ae-48ef-873f-0867f9f5fac2'::uuid, 'mulheres', 'roupas', 'roupas-femininas', 'legacy-backfill-v1', 0.88, 'auto'),
  ('6171a9c8-5fed-4f38-9343-94782f7a2c42'::uuid, 'mulheres', 'roupas', 'roupas-femininas', 'legacy-backfill-v1', 0.95, 'auto'),
  ('a57cd548-acce-41fd-9f21-09686fd3d1f9'::uuid, 'mulheres', 'roupas', 'roupas-femininas', 'legacy-backfill-v1', 0.88, 'auto'),
  ('74fc5657-06e0-450d-af44-5d17da4be626'::uuid, 'mais', 'automotivo', 'automotivo', 'legacy-backfill-v1', 0.85, 'auto'),
  ('40820ba2-e533-4572-a526-de71ed38294c'::uuid, 'casa', 'organizacao', 'organizacao', 'legacy-backfill-v1', 0.95, 'auto'),
  ('40691b53-0fc5-4ed3-ba78-0008879313a8'::uuid, 'casa', 'organizacao', 'organizacao', 'legacy-backfill-v1', 0.85, 'auto'),
  ('a39657b6-2aa0-4227-94f1-aaefebbe5071'::uuid, 'casa', 'organizacao', 'utilidades-domesticas', 'legacy-backfill-v1', 0.85, 'auto'),
  ('1f93f4c7-fed2-4233-8c00-1482daa0a671'::uuid, 'infantil', 'roupas', 'infantil', 'legacy-backfill-v1', 0.95, 'auto'),
  ('64203296-9ee1-43b8-9cbf-fe5a86fec413'::uuid, 'mulheres', 'acessorios', 'acessorios-femininos', 'legacy-backfill-v1', 0.88, 'auto'),
  ('5bec0f2c-92e6-499a-bb89-a8aea32789c7'::uuid, 'cozinha', 'utensilios', 'utensilios-de-cozinha', 'legacy-backfill-v1', 0.85, 'auto'),
  ('a7a4551c-fa6a-4ba8-8d83-b07b013bb5f6'::uuid, 'casa', 'organizacao', 'decoracao', 'legacy-backfill-v1', 0.85, 'auto'),
  ('0eef0a78-a2b9-47e3-8967-2fa990e7dde0'::uuid, 'beleza', 'cuidados', 'beleza-e-cuidados', 'legacy-backfill-v1', 0.85, 'auto'),
  ('ac293fce-f2f8-4571-91d0-43c6f05c7628'::uuid, 'cozinha', 'utensilios', 'utensilios-de-cozinha', 'legacy-backfill-v1', 0.85, 'auto'),
  ('538b1a0c-911b-41d2-8ebf-d40470399e1e'::uuid, 'infantil', 'roupas', 'infantil', 'legacy-backfill-v1', 0.85, 'auto'),
  ('a19f2c07-6b16-4041-9930-7a1d1f2641c5'::uuid, 'infantil', 'cuidados', 'bebe', 'legacy-backfill-v1', 0.85, 'auto'),
  ('7679f564-333b-42be-a702-ab5647828261'::uuid, 'homens', 'roupas', 'roupas-masculinas', 'legacy-backfill-v1', 0.85, 'auto'),
  ('aa31712e-913b-4278-8935-0a957fbf85fc'::uuid, 'homens', 'roupas', 'roupas-masculinas', 'legacy-backfill-v1', 0.95, 'auto'),
  ('13894233-dec4-4fda-a6c6-1143fa37af4e'::uuid, 'infantil', 'cuidados', 'bebe', 'legacy-backfill-v1', 0.85, 'auto'),
  ('85d2e3e3-e351-4a66-afb7-b54c803ee2b9'::uuid, 'homens', 'roupas', 'roupas-masculinas', 'legacy-backfill-v1', 0.95, 'auto'),
  ('f0663ab2-67b0-4ab9-aa18-1546b0387018'::uuid, 'homens', 'acessorios', 'acessorios-masculinos', 'legacy-backfill-v1', 0.95, 'auto'),
  ('8be14a1b-cfba-42b6-8423-de4327745d01'::uuid, 'homens', 'calcados', 'calcados-masculinos', 'legacy-backfill-v1', 0.95, 'auto'),
  ('075c7a58-6318-40b9-bb5b-a73a01c81a3c'::uuid, 'homens', 'calcados', 'calcados-masculinos', 'legacy-backfill-v1', 0.95, 'auto'),
  ('8c6304dc-ff4a-442c-b845-87ddb2b63cb9'::uuid, 'homens', 'acessorios', 'acessorios-masculinos', 'legacy-backfill-v1', 0.85, 'auto'),
  ('e20e5f17-3486-4da9-b89d-5cc031a06f0f'::uuid, 'homens', 'acessorios', 'acessorios-masculinos', 'legacy-backfill-v1', 0.95, 'auto'),
  ('6e54dce6-77fe-4534-990c-cc481df94a83'::uuid, 'mais', 'automotivo', 'automotivo', 'legacy-backfill-v1', 0.88, 'auto'),
  ('987ee79a-66af-44c3-9611-32c62bb0009d'::uuid, 'homens', 'roupas', 'roupas-masculinas', 'legacy-backfill-v1', 0.88, 'auto'),
  ('4e00f8c8-4745-4af2-8bf4-b6fdfab8fe56'::uuid, 'homens', 'acessorios', 'acessorios-masculinos', 'legacy-backfill-v1', 0.95, 'auto'),
  ('a6915ebc-5fca-4ca1-be5d-175e45a3002d'::uuid, 'mais', 'ferramentas', 'ferramentas', 'legacy-backfill-v1', 0.95, 'auto'),
  ('c4f6a957-643a-46c2-a630-89aabf4cb258'::uuid, 'esportes', 'cuidados', 'fitness', 'legacy-backfill-v1', 0.95, 'auto'),
  ('6d7e76da-3e1e-4f4e-b6f8-d48adb3ae941'::uuid, 'homens', 'calcados', 'calcados-masculinos', 'legacy-backfill-v1', 0.95, 'auto'),
  ('41bff6a5-6111-4eb1-b918-770778a4e530'::uuid, 'homens', 'acessorios', 'acessorios-masculinos', 'legacy-backfill-v1', 0.95, 'auto'),
  ('c69070db-c51b-4e77-8912-6931c712e358'::uuid, 'homens', 'calcados', 'calcados-masculinos', 'legacy-backfill-v1', 0.95, 'auto'),
  ('14bf7c01-55d2-42d1-9804-d9bb22a516dc'::uuid, 'homens', 'roupas', 'roupas-masculinas', 'legacy-backfill-v1', 0.85, 'auto'),
  ('9f9f713f-f5b0-4709-abe2-eed1a5e801e0'::uuid, 'homens', 'acessorios', 'acessorios-masculinos', 'legacy-backfill-v1', 0.85, 'auto'),
  ('650ea0d3-a7ce-4b93-9058-fbc489dfea0d'::uuid, 'tech', 'audio', 'eletronicos', 'legacy-backfill-v1', 0.85, 'auto'),
  ('c9ec8f9f-f7bc-4c96-aed4-b22e658df8b7'::uuid, 'homens', 'acessorios', 'acessorios-masculinos', 'legacy-backfill-v1', 0.95, 'auto'),
  ('53bb61dc-92cf-4b9c-8cb8-df601262fe1d'::uuid, 'tech', 'audio', 'eletronicos', 'legacy-backfill-v1', 0.85, 'auto'),
  ('a438410e-916c-446a-bd29-2a4418a73721'::uuid, 'homens', 'calcados', 'calcados-masculinos', 'legacy-backfill-v1', 0.95, 'auto'),
  ('18bdb95c-677d-4ac4-a66d-6c6ac4a1ab84'::uuid, 'casa', 'organizacao', 'utilidades-domesticas', 'legacy-backfill-v1', 0.85, 'auto'),
  ('f7690cfa-6953-4667-8b8e-a2eb5ecb4618'::uuid, 'homens', 'roupas', 'roupas-masculinas', 'legacy-backfill-v1', 0.95, 'auto'),
  ('e536fa2c-227d-4665-99c7-453103a828b8'::uuid, 'homens', 'roupas', 'roupas-masculinas', 'legacy-backfill-v1', 0.88, 'auto'),
  ('773ee3ac-671b-44d0-88c4-025eab29cd42'::uuid, 'homens', 'calcados', 'calcados-masculinos', 'legacy-backfill-v1', 0.95, 'auto'),
  ('3abdb719-63a0-4eb4-b4e3-77af8ce4fac8'::uuid, 'mais', 'automotivo', 'automotivo', 'legacy-backfill-v1', 0.85, 'auto'),
  ('a2866fa2-57cb-488a-84ce-ff1a3bb5b1db'::uuid, 'homens', 'acessorios', 'acessorios-masculinos', 'legacy-backfill-v1', 0.95, 'auto'),
  ('7f16abb0-b104-4f16-8316-ee0d26c12196'::uuid, 'tech', 'audio', 'audio', 'legacy-backfill-v1', 0.95, 'auto'),
  ('c4d5c83a-c2ed-4cc1-9e21-fe09714b2983'::uuid, 'esportes', 'cuidados', 'esportes-ao-ar-livre', 'legacy-backfill-v1', 0.85, 'auto'),
  ('84f76179-36c7-4331-99ed-f31b0661e5e0'::uuid, 'mais', 'ferramentas', 'ferramentas', 'legacy-backfill-v1', 0.95, 'auto'),
  ('5f9e0c7d-ad49-49e5-9c8c-c40e0e397f23'::uuid, 'homens', 'calcados', 'calcados-masculinos', 'legacy-backfill-v1', 0.95, 'auto'),
  ('d8a5fc06-a0a3-40b1-82b7-4cb6de340ea3'::uuid, 'homens', 'acessorios', 'acessorios-masculinos', 'legacy-backfill-v1', 0.95, 'auto'),
  ('4996ddd7-a3da-481d-b564-52bf67329f56'::uuid, 'homens', 'roupas', 'roupas-masculinas', 'legacy-backfill-v1', 0.88, 'auto'),
  ('d6283ad9-256c-4201-92af-24589db9e6da'::uuid, 'casa', 'organizacao', 'decoracao', 'legacy-backfill-v1', 0.85, 'auto'),
  ('e5a4b649-6880-47ae-865a-4ac1dfeb205f'::uuid, 'homens', 'acessorios', 'acessorios-masculinos', 'legacy-backfill-v1', 0.95, 'auto'),
  ('41628809-9fd9-403c-96ed-6445a1070b94'::uuid, 'esportes', 'cuidados', 'esportes-ao-ar-livre', 'legacy-backfill-v1', 0.85, 'auto'),
  ('750fae84-fd45-4b26-ba59-2a9de9002eb5'::uuid, 'esportes', 'cuidados', 'fitness', 'legacy-backfill-v1', 0.88, 'auto'),
  ('6fe827a9-5eeb-4a05-a232-93ad8d11c43b'::uuid, 'esportes', 'cuidados', 'esportes-ao-ar-livre', 'legacy-backfill-v1', 0.85, 'auto'),
  ('4e268e3b-5ee8-4da5-8487-fdfd28fe824f'::uuid, 'casa', 'organizacao', 'decoracao', 'legacy-backfill-v1', 0.85, 'auto'),
  ('29bfcd54-4ba7-4693-ab61-5bdf7f924665'::uuid, 'casa', 'organizacao', 'decoracao', 'legacy-backfill-v1', 0.85, 'auto'),
  ('a413f2be-ea08-4bb4-ad5e-9cbd5804f4d6'::uuid, 'infantil', 'cuidados', 'bebe', 'legacy-backfill-v1', 0.98, 'auto'),
  ('cd6f679f-2727-4789-aedd-72dbe5062685'::uuid, 'mulheres', 'roupas', 'roupas-femininas', 'legacy-backfill-v1', 0.76, 'auto'),
  ('d7e0ca8b-cf09-4901-8896-ef49b9eb3693'::uuid, 'casa', 'organizacao', 'utilidades-domesticas', 'legacy-backfill-v1', 0.98, 'auto'),
  ('f7467b9f-963b-48d1-b5dd-b36e7bb7cd66'::uuid, 'cozinha', 'utensilios', 'utensilios-de-cozinha', 'legacy-backfill-v1', 0.94, 'auto'),
  ('ed939ef4-1e0d-458c-858b-31a890d57634'::uuid, 'casa', 'organizacao', 'decoracao', 'legacy-backfill-v1', 0.98, 'auto'),
  ('74803eca-ddac-4638-b04e-44613d08809d'::uuid, 'cozinha', 'utensilios', 'utensilios-de-cozinha', 'legacy-backfill-v1', 0.98, 'auto'),
  ('383a8646-94a0-4af8-ae67-4aec46526ce5'::uuid, 'infantil', 'cuidados', 'bebe', 'legacy-backfill-v1', 0.95, 'auto'),
  ('561bda64-86f1-4a5b-9637-c84881801a8a'::uuid, 'esportes', 'cuidados', 'esportes-ao-ar-livre', 'legacy-backfill-v1', 0.96, 'auto'),
  ('2d5ead09-a3a6-4719-9970-3d2dc30ec192'::uuid, 'homens', 'calcados', 'calcados-masculinos', 'legacy-backfill-v1', 0.58, 'auto'),
  ('cde027cb-0500-47e0-a1b4-89502112abfc'::uuid, 'beleza', 'cuidados', 'beleza-e-cuidados', 'legacy-backfill-v1', 0.98, 'auto'),
  ('a68b0e4b-b191-4118-8e19-cf1254560c7e'::uuid, 'casa', 'organizacao', 'utilidades-domesticas', 'legacy-backfill-v1', 0.86, 'auto'),
  ('2a054dff-02de-48dd-9fc6-1ac029433ace'::uuid, 'casa', 'organizacao', 'utilidades-domesticas', 'legacy-backfill-v1', 0.95, 'auto'),
  ('29f76d49-9129-43e9-bbaf-1e1b9d9a920c'::uuid, 'casa', 'organizacao', 'organizacao', 'legacy-backfill-v1', 0.98, 'auto'),
  ('50572669-cae6-4417-ad6f-83124b7b0887'::uuid, 'cozinha', 'utensilios', 'utensilios-de-cozinha', 'legacy-backfill-v1', 0.94, 'auto'),
  ('e948f57b-d57b-4324-84d2-2f16cad64feb'::uuid, 'cozinha', 'utensilios', 'utensilios-de-cozinha', 'legacy-backfill-v1', 0.94, 'auto'),
  ('ba17bf09-6891-4319-897f-d68ee15020c8'::uuid, 'beleza', 'cuidados', 'beleza-e-cuidados', 'legacy-backfill-v1', 0.98, 'auto'),
  ('c4483c64-fdd6-483f-9a76-973f182fc3a2'::uuid, 'casa', 'organizacao', 'utilidades-domesticas', 'legacy-backfill-v1', 0.72, 'auto'),
  ('b25ef88b-459e-41f6-b0d5-919bdd4d7cee'::uuid, 'homens', 'roupas', 'roupas-masculinas', 'legacy-backfill-v1', 0.56, 'auto'),
  ('df702695-0679-41a6-a24f-eb4b203a4909'::uuid, 'casa', 'organizacao', 'utilidades-domesticas', 'legacy-backfill-v1', 0.72, 'auto'),
  ('e329737a-9137-4969-90bc-e1a17f8d4fca'::uuid, 'mulheres', 'calcados', 'calcados-femininos', 'legacy-backfill-v1', 0.55, 'auto'),
  ('5aefed9e-e17c-4aca-9a36-a27bae312a4e'::uuid, 'cozinha', 'eletroportateis', 'eletroportateis', 'legacy-backfill-v1', 0.94, 'auto'),
  ('ac7f4453-25d6-4ab7-b6ab-86b377095c2d'::uuid, 'tech', 'audio', 'audio', 'legacy-backfill-v1', 0.99, 'auto'),
  ('d6bde384-665d-4e5d-856e-41adaec97786'::uuid, 'mais', 'automotivo', 'achadinhos-gerais', 'legacy-backfill-v1', 0.84, 'auto'),
  ('2e866768-af74-4041-aa73-29941441ee28'::uuid, 'casa', 'organizacao', 'utilidades-domesticas', 'legacy-backfill-v1', 0.96, 'auto'),
  ('69d96ed6-79f0-4bdc-8524-56e98990d36f'::uuid, 'casa', 'organizacao', 'organizacao', 'legacy-backfill-v1', 0.96, 'auto'),
  ('af6fd878-b2b6-42ba-af82-3d3165295df9'::uuid, 'casa', 'organizacao', 'utilidades-domesticas', 'legacy-backfill-v1', 0.92, 'auto'),
  ('7ddaa126-1a00-4b69-9c68-51e449b89b9e'::uuid, 'casa', 'organizacao', 'decoracao', 'legacy-backfill-v1', 0.98, 'auto'),
  ('7faea767-78c4-434c-b55e-7b2ff6542021'::uuid, 'infantil', 'roupas', 'infantil', 'legacy-backfill-v1', 0.98, 'auto'),
  ('e38a3623-f059-4803-8862-79f4f7247e30'::uuid, 'cozinha', 'eletroportateis', 'eletroportateis', 'legacy-backfill-v1', 0.99, 'auto'),
  ('f7821f79-4552-452c-ac94-0e9145ab2376'::uuid, 'homens', 'roupas', 'roupas-masculinas', 'legacy-backfill-v1', 0.56, 'auto'),
  ('755ba125-a1df-470f-8411-d7579dc6f1c2'::uuid, 'casa', 'organizacao', 'decoracao', 'legacy-backfill-v1', 0.98, 'auto'),
  ('29f4164a-2474-482b-9c9c-ffb8be673013'::uuid, 'homens', 'roupas', 'roupas-masculinas', 'legacy-backfill-v1', 0.99, 'auto'),
  ('55ca4b05-0b5d-4826-875a-3972d1765541'::uuid, 'homens', 'roupas', 'roupas-masculinas', 'legacy-backfill-v1', 0.99, 'auto'),
  ('b773ad72-63ee-4a63-85a3-aecdcfddb2b0'::uuid, 'homens', 'roupas', 'roupas-masculinas', 'legacy-backfill-v1', 0.86, 'auto'),
  ('6518f481-cf2c-4678-979b-2c1b3356db23'::uuid, 'homens', 'roupas', 'roupas-masculinas', 'legacy-backfill-v1', 0.99, 'auto'),
  ('694e5cb3-e999-4c6a-8794-dce21dd9d9e7'::uuid, 'homens', 'roupas', 'roupas-masculinas', 'legacy-backfill-v1', 0.99, 'auto'),
  ('5fc5db71-0cc0-485e-8621-a7a44d47f89b'::uuid, 'cozinha', 'utensilios', 'utensilios-de-cozinha', 'legacy-backfill-v1', 0.98, 'auto'),
  ('ef6901f1-8a52-4ee8-9dee-0625cd040c24'::uuid, 'homens', 'acessorios', 'acessorios-masculinos', 'legacy-backfill-v1', 0.56, 'auto'),
  ('a94bb4bb-b10d-41fa-b739-0bcb05bc6ebb'::uuid, 'cozinha', 'utensilios', 'utensilios-de-cozinha', 'legacy-backfill-v1', 0.98, 'auto'),
  ('199757b2-fa5d-4549-8aa4-f5de2df5cae8'::uuid, 'beleza', 'cuidados', 'beleza-e-cuidados', 'legacy-backfill-v1', 0.99, 'auto'),
  ('cad7ca99-6b0d-4cfb-88cd-5510e2827346'::uuid, 'mais', 'ferramentas', 'ferramentas', 'legacy-backfill-v1', 0.99, 'auto'),
  ('6314dd31-5c0a-4693-b834-5255dc88b1ec'::uuid, 'homens', 'roupas', 'roupas-masculinas', 'legacy-backfill-v1', 0.99, 'auto'),
  ('eb0eddc8-1eaf-4b64-ae9d-3f997e579c19'::uuid, 'mais', 'automotivo', 'automotivo', 'legacy-backfill-v1', 0.91, 'auto'),
  ('2af6c219-cbd3-40e4-aea7-ffa9458db784'::uuid, 'cozinha', 'utensilios', 'utensilios-de-cozinha', 'legacy-backfill-v1', 0.89, 'auto'),
  ('75492f7f-5ccb-4063-b0e4-9405f5d0c87e'::uuid, 'homens', 'roupas', 'roupas-masculinas', 'legacy-backfill-v1', 0.98, 'auto'),
  ('457de11c-c272-49be-9452-2ad73d85dd6d'::uuid, 'mais', 'automotivo', 'automotivo', 'legacy-backfill-v1', 0.99, 'auto'),
  ('8b08de64-9c07-47ff-8ce0-6454721d3c84'::uuid, 'esportes', 'cuidados', 'esportes-ao-ar-livre', 'legacy-backfill-v1', 0.94, 'auto'),
  ('8250dd99-51c6-44b1-b864-b5044e670b49'::uuid, 'mais', 'automotivo', 'automotivo', 'legacy-backfill-v1', 0.99, 'auto'),
  ('23d6d055-a706-42aa-aab2-4e0201c303c1'::uuid, 'tech', 'audio', 'eletronicos', 'legacy-backfill-v1', 0.99, 'auto'),
  ('05bac0a9-6590-471e-b6f0-316dd2060bf2'::uuid, 'tech', 'audio', 'eletronicos', 'legacy-backfill-v1', 0.99, 'auto'),
  ('0c24f873-e469-486d-9cf4-79242af1d474'::uuid, 'cozinha', 'utensilios', 'utensilios-de-cozinha', 'legacy-backfill-v1', 0.92, 'auto'),
  ('14ec4d52-b3d6-46d8-b222-c3bdc9d2d722'::uuid, 'beleza', 'cuidados', 'beleza-e-cuidados', 'legacy-backfill-v1', 0.99, 'auto'),
  ('ef956b2a-2b78-4669-bdf3-3c111cc32570'::uuid, 'cozinha', 'utensilios', 'utensilios-de-cozinha', 'legacy-backfill-v1', 0.95, 'auto'),
  ('7e0f4cdd-7695-476a-a989-7f834400e071'::uuid, 'cozinha', 'utensilios', 'utensilios-de-cozinha', 'legacy-backfill-v1', 0.95, 'auto'),
  ('315c57c0-1b96-4ae6-a0d2-3553aca01999'::uuid, 'homens', 'roupas', 'roupas-masculinas', 'legacy-backfill-v1', 0.91, 'auto'),
  ('cbe334e0-6475-4ac2-9740-3036992a215b'::uuid, 'homens', 'roupas', 'roupas-masculinas', 'legacy-backfill-v1', 0.99, 'auto'),
  ('57bd2f87-f00a-4b33-8fde-a36a289bace5'::uuid, 'esportes', 'cuidados', 'fitness', 'legacy-backfill-v1', 0.86, 'auto'),
  ('aa3082cf-ef83-4191-b4c4-732858a56440'::uuid, 'esportes', 'cuidados', 'esportes-ao-ar-livre', 'legacy-backfill-v1', 0.96, 'auto'),
  ('0f04f2b5-5697-4e4e-bb1f-6670bbdd88c5'::uuid, 'homens', 'roupas', 'roupas-masculinas', 'legacy-backfill-v1', 0.68, 'auto'),
  ('2277e3c3-711b-487a-8fe6-c29c984a3d6c'::uuid, 'homens', 'roupas', 'roupas-masculinas', 'legacy-backfill-v1', 0.58, 'auto'),
  ('e422ed14-52d0-4a87-a0a2-8e40df6ff9ac'::uuid, 'homens', 'roupas', 'roupas-masculinas', 'legacy-backfill-v1', 0.99, 'auto'),
  ('a2238c35-1185-4113-91a8-1ceb81c019b3'::uuid, 'casa', 'organizacao', 'decoracao', 'legacy-backfill-v1', 0.94, 'auto'),
  ('314ae95b-82b2-424b-8b0b-63e01d0ac47b'::uuid, 'tech', 'audio', 'eletronicos', 'legacy-backfill-v1', 0.99, 'auto'),
  ('4faf4969-5d7c-4ae9-9eb8-c152b578adff'::uuid, 'casa', 'organizacao', 'utilidades-domesticas', 'legacy-backfill-v1', 0.82, 'auto'),
  ('408f5c63-cc34-4a4d-9a93-7fb815543039'::uuid, 'casa', 'organizacao', 'decoracao', 'legacy-backfill-v1', 0.72, 'auto'),
  ('0959258b-f000-4984-a56a-29be209ce561'::uuid, 'casa', 'organizacao', 'utilidades-domesticas', 'legacy-backfill-v1', 0.82, 'auto'),
  ('08e1d47c-f50a-4674-a9a9-63f98708e64a'::uuid, 'casa', 'organizacao', 'utilidades-domesticas', 'legacy-backfill-v1', 0.82, 'auto'),
  ('5f17cdd5-0c58-480d-8bf3-0bbd625bbb19'::uuid, 'homens', 'calcados', 'calcados-masculinos', 'legacy-backfill-v1', 0.99, 'auto'),
  ('ad5b0e9e-ec69-4682-8647-33c3281b40e5'::uuid, 'mulheres', 'calcados', 'calcados-femininos', 'legacy-backfill-v1', 0.99, 'auto');

do $$
declare
  expected_count integer := 157;
  input_count integer;
  updated_count integer;
begin
  select count(*) into input_count
  from affiliate_classification_backfill_v1;

  if input_count <> expected_count then
    raise exception 'Backfill abortado: entrada com % linhas; esperado %.', input_count, expected_count;
  end if;

  update public.products as products
  set
    department_slug = backfill.department_slug,
    subcategory_slug = backfill.subcategory_slug,
    leaf_slug = backfill.leaf_slug,
    classification_source = backfill.classification_source,
    classification_confidence = backfill.classification_confidence,
    classification_review_status = backfill.classification_review_status
  from affiliate_classification_backfill_v1 as backfill
  where products.id = backfill.id;

  get diagnostics updated_count = row_count;

  if updated_count <> expected_count then
    raise exception 'Backfill abortado: % produtos encontrados/atualizados; esperado %.', updated_count, expected_count;
  end if;
end $$;

select
  count(*) as input_rows,
  count(products.id) as matched_products,
  count(*) filter (
    where products.department_slug = backfill.department_slug
      and products.subcategory_slug = backfill.subcategory_slug
      and products.leaf_slug = backfill.leaf_slug
      and products.classification_source = backfill.classification_source
      and products.classification_confidence = backfill.classification_confidence
      and products.classification_review_status = backfill.classification_review_status
  ) as matching_classifications
from affiliate_classification_backfill_v1 as backfill
left join public.products as products on products.id = backfill.id;

commit;
