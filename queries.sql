##
# This file holds all of this project's database queries
#
# The Pattern used to parse the queries is:
# $> -- QueryName
# $> Query (till it finds another `--` or EOF)
#
# Anything other than this will be ignored and have only informational value
# All # comments will also be ignored
#
# Also, we use parametrization. This technique helps avoid sql injection such that
# any question marks "?" inside our queries indicates to node.js (javascript server)
# what should be escaped and replaced by the right sanitized input parameters
##

USE TrabalhoBD; # Ignored py parser, informational value only

-- getStates
SELECT
  ufs.sigla AS acronym,
  ufs.nome  AS name
FROM ufs;

-- healthUnitsPerState
SELECT
  ufs.sigla              AS stateName,
  count(localizacoes.id) AS healthUnitQuantity
FROM localizacoes
  INNER JOIN ufs ON localizacoes.uf_id = ufs.id
GROUP BY ufs.sigla;

-- countHealthUnitPerType
SELECT
  ufs.sigla AS acronym,
  GROUP_CONCAT(type SEPARATOR '$$')     AS type,
  GROUP_CONCAT(quantity SEPARATOR '$$') AS quantity
FROM ufs
  INNER JOIN (
               SELECT
                 uf_id,
                 tipos_gestao.descricao AS type,
                 COUNT(tipos_gestao.id) AS quantity
               FROM tipos_gestao
                  INNER JOIN unidades_saude ON tipos_gestao.id = unidades_saude.tipo_gestao_id
                  INNER JOIN localizacoes ON unidades_saude.localizacao_id = localizacoes.id
               GROUP BY uf_id, tipos_gestao.descricao
) AS results ON ufs.id = results.uf_id
GROUP BY ufs.sigla;

-- getHealthUnitPosition
SELECT
  unidades_saude.id      AS id,
  tipos_unidade.tipo     AS type,
  localizacoes.latitude  AS lat,
  localizacoes.longitude AS lng
FROM localizacoes
  INNER JOIN (
               SELECT ufs.id
               FROM ufs
               WHERE ufs.sigla = ?
             ) AS ufs_state ON ufs_state.id = localizacoes.uf_id
  INNER JOIN unidades_saude ON unidades_saude.localizacao_id = localizacoes.id
  LEFT JOIN tipos_unidade ON unidades_saude.tipo_unidade_id = tipos_unidade.id;

-- getUnitsPerRegion
SELECT
  regioes.nome             AS regionName,
  COUNT(unidades_saude.id) AS quantity
FROM unidades_saude
  INNER JOIN localizacoes ON localizacoes.id = unidades_saude.localizacao_id
  INNER JOIN regioes ON localizacoes.regiao_id = regioes.id
GROUP BY regioes.nome;

-- getRegionScoreByCategory
SELECT
  regioes.nome                                            AS regionName,
  GROUP_CONCAT(notasPorCatId.notas SEPARATOR '$$')        AS score,
  GROUP_CONCAT(categorias_avaliacoes.nome SEPARATOR '$$') AS categories
FROM (
       SELECT
         regiao_id,
         categoria_id,
         (AVG(valor) / 3) * 10 AS notas
       FROM unidades_saude
         INNER JOIN localizacoes ON localizacoes.id = unidades_saude.localizacao_id
         INNER JOIN nota_unidade_saude ON unidades_saude.id = nota_unidade_saude.unidade_saude_id
         INNER JOIN notas ON nota_unidade_saude.nota_id = notas.id
       GROUP BY localizacoes.regiao_id, nota_unidade_saude.categoria_id
       HAVING regiao_id IS NOT NULL
     ) AS notasPorCatId
  INNER JOIN regioes ON regiao_id = regioes.id
  INNER JOIN categorias_avaliacoes ON categoria_id = categorias_avaliacoes.id
GROUP BY regionName;

-- getGovernmentControlledUnits
SELECT
  total.count   AS total,
  governo.count AS quantity
FROM (
       SELECT COUNT(unidades_saude.id) AS count
       FROM unidades_saude
         INNER JOIN tipos_gestao ON unidades_saude.tipo_gestao_id = tipos_gestao.id
       WHERE tipos_gestao.descricao = 'Estadual' OR tipos_gestao.descricao = 'Municipal'
     ) AS governo, (
                     SELECT COUNT(unidades_saude.id) AS count
                     FROM unidades_saude
                   ) AS total;

-- getUnityQuantity
SELECT COUNT(unidades_saude.id) AS quantity
FROM unidades_saude;

-- healthUnityInfo
SELECT
  unidade.razao_social      AS razao_social,
  unidade.nome_fantansia    AS nome_fantasia,
  mantenedoras.razao_social AS razao_social_mantenedora,
  mantenedoras.cnpj         AS cnpj_mantenedora,
  bairros.nome              AS bairro,
  municipios.nome           AS municipio
FROM (
       SELECT *
       FROM unidades_saude
       WHERE unidades_saude.id = ?
     ) AS unidade
  LEFT JOIN mantenedoras ON unidade.mantenedora_id = mantenedoras.id
  LEFT JOIN localizacoes ON unidade.localizacao_id = localizacoes.id
  LEFT JOIN bairros ON localizacoes.bairro_id = bairros.id
  LEFT JOIN municipios ON localizacoes.municipio_id = municipios.id;

-- healthUnityTelephones
SELECT telefones.numero
FROM (
       SELECT *
       FROM unidades_saude
       WHERE unidades_saude.id = ?
     ) AS unidade
  LEFT JOIN telefones ON TrabalhoBD.telefones.unidade_saude_id = unidade.id;

-- healthUnityScores
SELECT
  categorias_avaliacoes.nome AS categoria,
  notas.descricao            AS avaliacao,
  notas.valor                AS valor
FROM (
       SELECT *
       FROM unidades_saude
       WHERE unidades_saude.id = ?
     ) AS unidade
  LEFT JOIN nota_unidade_saude ON nota_unidade_saude.unidade_saude_id = unidade.id
  INNER JOIN categorias_avaliacoes ON nota_unidade_saude.categoria_id = categorias_avaliacoes.id
  INNER JOIN notas ON nota_unidade_saude.nota_id = notas.id;

-- stateUnitsScoreAvg
SELECT
  sigla                                  AS acronyms,
  GROUP_CONCAT(nota SEPARATOR '$$')      AS score,
  GROUP_CONCAT(categoria SEPARATOR '$$') AS category
FROM ufs
  INNER JOIN (
    SELECT
      localizacoes.uf_id         AS uf_id,
      AVG(notas.valor) / 3 * 10  AS nota,
      categorias_avaliacoes.nome AS categoria
    FROM localizacoes
      INNER JOIN unidades_saude ON unidades_saude.localizacao_id = localizacoes.id
      INNER JOIN nota_unidade_saude ON nota_unidade_saude.unidade_saude_id = unidades_saude.id
      INNER JOIN categorias_avaliacoes ON nota_unidade_saude.categoria_id = categorias_avaliacoes.id
      INNER JOIN notas ON nota_unidade_saude.nota_id = notas.id
    GROUP BY categoria, uf_id
    ) AS result ON ufs.id = result.uf_id
GROUP BY acronyms;

-- StateUnitsTypeDistribution
SELECT
  tipos_unidade.tipo AS tipo,
  COUNT(unidades.id) AS quantidade
FROM (
       SELECT
         unidades_saude.id              AS id,
         unidades_saude.tipo_unidade_id AS tipo_unidade_id
       FROM unidades_saude
         INNER JOIN localizacoes ON unidades_saude.localizacao_id = localizacoes.id
         INNER JOIN ufs ON localizacoes.uf_id = ufs.id
       WHERE ufs.sigla = ?
     ) AS unidades
  INNER JOIN tipos_unidade ON tipos_unidade.id = unidades.tipo_unidade_id
GROUP BY tipos_unidade.tipo;

-- SearchBar
SET @param = ? COLLATE utf8_unicode_ci;
SELECT *
FROM (
       SELECT
         'Location' AS tipo,
         ufs.sigla  AS id,
         ufs.nome   AS nome,
         ''         AS other
       FROM ufs
       WHERE ufs.sigla LIKE @param OR ufs.nome LIKE @param
       LIMIT 2
     ) AS locations
UNION
SELECT *
FROM (
       SELECT
         'Unit-nome'                   AS tipo,
         unidades_saude.id             AS id,
         unidades_saude.nome_fantansia AS nome,
         ''                            AS other
       FROM unidades_saude
       WHERE
         unidades_saude.nome_fantansia LIKE @param
       LIMIT 3
     ) AS unit_nome
UNION
SELECT *
FROM (
       SELECT
         'Unit-razao-social'           AS tipo,
         unidades_saude.id             AS id,
         unidades_saude.nome_fantansia AS nome,
         unidades_saude.razao_social   AS other
       FROM unidades_saude
       WHERE
         unidades_saude.razao_social LIKE @param
       LIMIT
     ) AS unit_nome
UNION
SELECT *
FROM (
       SELECT
         'Unit-telefone'               AS tipo,
         unidades_saude.id             AS id,
         unidades_saude.nome_fantansia AS nome,
         telefones.numero              AS other
       FROM unidades_saude
         INNER JOIN telefones ON unidades_saude.id = telefones.unidade_saude_id
       WHERE
         telefones.numero LIKE @param
       LIMIT 3
     ) AS unit_nome