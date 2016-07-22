use TrabalhoBD;

#Drop existing functions
DROP FUNCTION IF EXISTS generatePhone;

#Create functions
CREATE FUNCTION generatePhone()
	RETURNS VARCHAR(13)
	RETURN CONCAT(
    '(',
    LPAD(FLOOR(RAND() * 99), 2, '0'),
    ')',
    LPAD(FLOOR(RAND() * 9999), 4, '0'),
    '-',
    LPAD(FLOOR(RAND() * 9999), 4, '0')
  );

#Drop tables
DROP TABLE IF EXISTS nota_unidade_saude;
DROP TABLE IF EXISTS telefones;
DROP TABLE IF EXISTS unidades_saude;
DROP TABLE IF EXISTS mantenedoras;
DROP TABLE IF EXISTS tipos_unidade;
DROP TABLE IF EXISTS tipos_gestao;
DROP TABLE IF EXISTS notas;
DROP TABLE IF EXISTS localizacoes;
DROP TABLE IF EXISTS coord_origens;
DROP TABLE IF EXISTS regioes;
DROP TABLE IF EXISTS ufs;
DROP TABLE IF EXISTS bairros;
DROP TABLE IF EXISTS municipios;
DROP TABLE IF EXISTS categorias_avaliacoes;

#Create new tables
CREATE TABLE unidades_saude(
	id INT UNSIGNED PRIMARY KEY,
  razao_social VARCHAR(255),
  nome_fantansia VARCHAR(255),
	mantenedora_id BINARY(16) NULL,
	localizacao_id BINARY(16) NULL,
	tipo_unidade_id BINARY(16) NULL,
	tipo_gestao_id BINARY(16) NULL
);
CREATE TABLE mantenedoras(
	id BINARY(16) PRIMARY KEY,
  cnpj VARCHAR(26),
  razao_social VARCHAR(255)
);
CREATE TABLE tipos_unidade(
	id BINARY(16) PRIMARY KEY,
  tipo VARCHAR(255)
);
CREATE TABLE tipos_gestao(
	id BINARY(16) PRIMARY KEY,
  descricao VARCHAR(255)
);
CREATE TABLE notas(
	id BINARY(16) PRIMARY KEY,
  descricao VARCHAR(255),
  valor INT
);
CREATE TABLE nota_unidade_saude(
	nota_id BINARY(16) NULL,
	unidade_saude_id INT UNSIGNED,
  categoria_id BINARY(16) NULL
);
CREATE TABLE coord_origens(
	id BINARY(16) PRIMARY KEY,
	nome VARCHAR(255) NULL
);
CREATE TABLE regioes(
	id BINARY(16) PRIMARY KEY,
	nome VARCHAR(255) NULL
);
CREATE TABLE ufs(
	id BINARY(16) PRIMARY KEY,
	sigla VARCHAR(255) NULL
);
CREATE TABLE bairros(
	id BINARY(16) PRIMARY KEY,
	nome VARCHAR(255) NULL
);
CREATE TABLE municipios(
	id BINARY(16) PRIMARY KEY,
	nome VARCHAR(255) NULL
);
CREATE TABLE localizacoes(
	id BINARY(16) PRIMARY KEY,
	coord_origem_id BINARY(16) NULL,
	latitude DECIMAL(10, 6) NULL,
	longitude DECIMAL(11,6) NULL,
	regiao_id BINARY(16) NULL,
	uf_id BINARY(16) NULL,
	bairro_id BINARY(16) NULL,
	municipio_id BINARY(16) NULL,
	cep VARCHAR(9) NULL,
	endereco VARCHAR(255) NULL,
	numero_endereco	VARCHAR(10) NULL
);
CREATE TABLE categorias_avaliacoes(
	id BINARY(16) PRIMARY KEY,
	nome VARCHAR(255) NULL
);
CREATE TABLE telefones(
	id INT AUTO_INCREMENT PRIMARY KEY,
	numero VARCHAR(13) NULL,
	unidade_saude_id INT UNSIGNED NULL
);

#Make table relations
ALTER TABLE unidades_saude 
	ADD CONSTRAINT unidades_saude_mantenedora_id_foreign
	FOREIGN KEY (mantenedora_id)
	REFERENCES mantenedoras(id);
ALTER TABLE unidades_saude 
	ADD CONSTRAINT unidades_saude_tipo_gestao_id_foreign
	FOREIGN KEY (tipo_gestao_id)
	REFERENCES tipos_gestao(id);
ALTER TABLE unidades_saude
	ADD CONSTRAINT unidades_saude_tipo_unidade_id_foreign
	FOREIGN KEY (tipo_unidade_id)
	REFERENCES tipos_unidade(id);
ALTER TABLE unidades_saude
	ADD CONSTRAINT unidades_saude_localizacao_id_foreign
	FOREIGN KEY (localizacao_id)
	REFERENCES localizacoes(id);
ALTER TABLE nota_unidade_saude
	ADD CONSTRAINT nota_unidade_saude_nota_id_foreign
	FOREIGN KEY (nota_id)
	REFERENCES notas(id);
ALTER TABLE nota_unidade_saude 
	ADD CONSTRAINT nota_unidade_unidade_saude_id_foreign
	FOREIGN KEY (unidade_saude_id)
	REFERENCES unidades_saude(id);
ALTER TABLE localizacoes 
	ADD CONSTRAINT localizacoes_coord_origem_id_foreign
	FOREIGN KEY (coord_origem_id)
	REFERENCES coord_origens(id);
ALTER TABLE localizacoes 
	ADD CONSTRAINT localizacoes_regiao_id_foreign
	FOREIGN KEY (regiao_id)
	REFERENCES regioes(id);
ALTER TABLE localizacoes 
	ADD CONSTRAINT localizacoes_uf_id_foreign
	FOREIGN KEY (uf_id)
	REFERENCES ufs(id);
ALTER TABLE localizacoes 
	ADD CONSTRAINT localizacoes_bairro_id_foreign
	FOREIGN KEY (bairro_id)
	REFERENCES bairros(id);			
ALTER TABLE localizacoes 
	ADD CONSTRAINT localizacoes_municipio_id_foreign
	FOREIGN KEY (municipio_id)
	REFERENCES municipios(id);	
ALTER TABLE nota_unidade_saude
	ADD CONSTRAINT nota_unidade_saude_categoria_id_foreign
	FOREIGN KEY (categoria_id)
	REFERENCES categorias_avaliacoes(id);
ALTER TABLE telefones
	ADD CONSTRAINT telefones_unidade_saude_id_foreign
	FOREIGN KEY (unidade_saude_id)
	REFERENCES unidades_saude(id);

#Add data
INSERT IGNORE INTO mantenedoras (id, cnpj, razao_social)
	SELECT DISTINCT
    UNHEX(MD5(cnes_ativos.nu_cnpj_mantenedora)) AS 'id',
		cnes_ativos.nu_cnpj_mantenedora AS 'cnpj',
        cnes_ativos.razao_social_mantenedora AS 'razao_social'
    FROM cnes_ativos
    WHERE
      cnes_ativos.nu_cnpj_mantenedora COLLATE utf8_unicode_ci <> '' COLLATE utf8_unicode_ci AND
      cnes_ativos.razao_social_mantenedora COLLATE utf8_unicode_ci <> '' COLLATE utf8_unicode_ci;
INSERT IGNORE INTO tipos_unidade (id, tipo)
	SELECT DISTINCT
    UNHEX(MD5(cnes_ativos.ds_tipo_unidade)) AS 'id',
		cnes_ativos.ds_tipo_unidade AS 'tipo'
    FROM cnes_ativos
    WHERE
      cnes_ativos.ds_tipo_unidade COLLATE utf8_unicode_ci <> '' COLLATE utf8_unicode_ci;
INSERT INTO tipos_gestao (id, descricao)
	VALUES
		(UNHEX(MD5('D')), 'Descentralizada'),
		(UNHEX(MD5('E')), 'Estadual'),
		(UNHEX(MD5('M')), 'Municipal');
INSERT INTO categorias_avaliacoes (id, nome)
	VALUES
		(UNHEX(MD5('Estrutura Física')), 'Estrutura Física'),
		(UNHEX(MD5('Acessibilidade')), 'Acessibilidade'),
		(UNHEX(MD5('Equipamentos')), 'Equipamentos'),
		(UNHEX(MD5('Medicamentos')), 'Medicamentos');
INSERT INTO notas (id, descricao, valor)
	VALUES
		(UNHEX(MD5('Desempenho muito acima da média')), 'Desempenho muito acima da média', 3),
		(UNHEX(MD5('Desempenho acima da média')), 'Desempenho acima da média', 2),
		(UNHEX(MD5('Desempenho mediano ou  um pouco abaixo da média')), 'Desempenho mediano ou  um pouco abaixo da média', 1);
INSERT IGNORE INTO coord_origens (id, nome)
	SELECT DISTINCT
    UNHEX(MD5(cnes_ativos.origem_coord)) AS 'id',
		cnes_ativos.origem_coord AS 'nome'
    FROM cnes_ativos
    WHERE
      cnes_ativos.origem_coord COLLATE utf8_unicode_ci <> '' COLLATE utf8_unicode_ci;
INSERT IGNORE INTO regioes (id, nome)
	SELECT DISTINCT
    UNHEX(MD5(cnes_ativos.regiao)) AS 'id',
		cnes_ativos.regiao AS 'nome'
    FROM cnes_ativos
    WHERE
      cnes_ativos.regiao COLLATE utf8_unicode_ci <> '' COLLATE utf8_unicode_ci;
INSERT IGNORE INTO ufs (id, sigla)
	SELECT DISTINCT
    UNHEX(MD5(cnes_ativos.uf)) AS 'id',
		cnes_ativos.uf AS 'sigla'
    FROM cnes_ativos
    WHERE
      cnes_ativos.uf COLLATE utf8_unicode_ci <> '' COLLATE utf8_unicode_ci;
INSERT IGNORE INTO bairros (id, nome)
	SELECT DISTINCT
    UNHEX(MD5(cnes_ativos.no_bairro)) AS 'id',
		cnes_ativos.no_bairro AS 'nome'
    FROM cnes_ativos
    WHERE
      cnes_ativos.no_bairro COLLATE utf8_unicode_ci <> '' COLLATE utf8_unicode_ci;
INSERT IGNORE INTO municipios (id, nome)
	SELECT DISTINCT
    UNHEX(MD5(cnes_ativos.municipio)) AS 'id',
		cnes_ativos.municipio AS 'nome'
    FROM cnes_ativos
    WHERE
      cnes_ativos.municipio COLLATE utf8_unicode_ci <> '' COLLATE utf8_unicode_ci;
INSERT IGNORE INTO localizacoes
	(
		id,
		latitude,
		longitude,
		cep,
		endereco,
		numero_endereco,
 		coord_origem_id,
 		regiao_id,
 		uf_id,
 		bairro_id,
 		municipio_id
	)
	SELECT
		UNHEX(MD5(cnes_ativos.co_cnes)) AS 'id',
		TRUNCATE(cnes_ativos.lat, 6) AS 'latitude',
		TRUNCATE(cnes_ativos.long, 6) AS 'longitude',
		cnes_ativos.co_cep AS 'cep',
		cnes_ativos.no_logradouro AS 'endereco',
		cnes_ativos.nu_endereco AS 'numero_endereco',
		IF(cnes_ativos.origem_coord <> '', UNHEX(MD5(cnes_ativos.origem_coord)), NULL) AS 'coord_origem_id',
		IF(cnes_ativos.regiao <> '', UNHEX(MD5(cnes_ativos.regiao)), NULL) AS 'regiao_id',
		IF(cnes_ativos.uf <> '', UNHEX(MD5(cnes_ativos.uf)), NULL) AS 'uf_id',
		IF(cnes_ativos.no_bairro <> '', UNHEX(MD5(cnes_ativos.no_bairro)), NULL) AS 'bairro_id',
		IF(cnes_ativos.municipio <> '', UNHEX(MD5(cnes_ativos.municipio)), NULL) AS 'municipio_id'
	FROM cnes_ativos;
INSERT IGNORE INTO unidades_saude
	(
		id, 
		razao_social, 
		nome_fantansia,
 		mantenedora_id,
 		tipo_unidade_id,
 		tipo_gestao_id,
 		localizacao_id
	)
	SELECT
		cnes_ativos.co_cnes AS 'id',
		cnes_ativos.no_razao_social AS 'razao_social',
		cnes_ativos.no_fantasia AS 'nome_fantansia',
 		IF(cnes_ativos.nu_cnpj_mantenedora <> '', UNHEX(MD5(cnes_ativos.nu_cnpj_mantenedora)), NULL) AS 'mantenedora_id',
 		IF(cnes_ativos.ds_tipo_unidade <> '', UNHEX(MD5(cnes_ativos.ds_tipo_unidade)), NULL) AS 'tipo_unidade_id',
 		IF(cnes_ativos.tp_gestao <> '', UNHEX(MD5(cnes_ativos.tp_gestao)), NULL) AS 'tipo_gestao_id',
 		UNHEX(MD5(cnes_ativos.co_cnes)) AS 'localizacao_id'
	FROM cnes_ativos;
INSERT IGNORE INTO nota_unidade_saude
	(
		nota_id,
		unidade_saude_id,
    categoria_id
	)
	SELECT
		IF(unidades_basicas_de_saude.dsc_estrut_fisic_ambiencia <> '', UNHEX(MD5(unidades_basicas_de_saude.dsc_estrut_fisic_ambiencia)), NULL) AS 'nota_id',
    unidades_basicas_de_saude.cod_cnes AS 'unidade_saude_id',
		UNHEX(MD5('Estrutura Física')) AS 'categoria_id'
  FROM
    unidades_basicas_de_saude;
INSERT IGNORE INTO nota_unidade_saude
	(
		nota_id,
		unidade_saude_id,
    categoria_id
	)
	SELECT
		IF(unidades_basicas_de_saude.dsc_adap_defic_fisic_idosos <> '', UNHEX(MD5(unidades_basicas_de_saude.dsc_adap_defic_fisic_idosos)), NULL) AS 'nota_id',
    unidades_basicas_de_saude.cod_cnes AS 'unidade_saude_id',
		UNHEX(MD5('Acessibilidade')) AS 'categoria_id'
  FROM
    unidades_basicas_de_saude;
INSERT IGNORE INTO nota_unidade_saude
	(
		nota_id,
		unidade_saude_id,
    categoria_id
	)
	SELECT
		IF(unidades_basicas_de_saude.dsc_equipamentos <> '', UNHEX(MD5(unidades_basicas_de_saude.dsc_equipamentos)), NULL) AS 'nota_id',
    unidades_basicas_de_saude.cod_cnes AS 'unidade_saude_id',
		UNHEX(MD5('Equipamentos')) AS 'categoria_id'
  FROM
    unidades_basicas_de_saude;
INSERT IGNORE INTO nota_unidade_saude
	(
		nota_id,
		unidade_saude_id,
    categoria_id
	)
	SELECT
		IF(unidades_basicas_de_saude.dsc_medicamentos <> '', UNHEX(MD5(unidades_basicas_de_saude.dsc_medicamentos)), NULL) AS 'nota_id',
    unidades_basicas_de_saude.cod_cnes AS 'unidade_saude_id',
		UNHEX(MD5('Medicamentos')) AS 'categoria_id'
  FROM
    unidades_basicas_de_saude;
INSERT IGNORE INTO telefones
	(
		numero,
    unidade_saude_id
	)
  SELECT
    dsc_telefone AS 'numero',
    cod_cnes AS 'unidade_saude_id'
	FROM unidades_basicas_de_saude
  WHERE dsc_telefone <> 'Não se aplica'
  UNION(
    SELECT
      generatePhone() AS 'numero',
      cod_cnes AS 'unidade_saude_id'
    FROM unidades_basicas_de_saude
    WHERE FLOOR(RAND()*10) >+3
  )UNION(
    SELECT
      generatePhone() AS 'numero',
      cod_cnes AS 'unidade_saude_id'
    FROM unidades_basicas_de_saude
    WHERE FLOOR(RAND()*10) >+3
  );