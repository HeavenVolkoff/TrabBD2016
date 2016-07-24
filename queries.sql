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
SELECT ufs.sigla
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
  tipos_gestao.descricao AS type,
  COUNT(tipos_gestao.id) AS quantity
FROM tipos_gestao
  INNER JOIN (
               SELECT unidades_saude.tipo_gestao_id
               FROM unidades_saude
                 INNER JOIN (
                              SELECT
                                localizacoes.id,
                                localizacoes.uf_id
                              FROM localizacoes
                                INNER JOIN ufs ON ufs.id = localizacoes.uf_id
                              WHERE ufs.sigla = ?
                            ) AS loc_uf ON loc_uf.id = unidades_saude.localizacao_id
             ) AS tipo_gestao_estado ON tipo_gestao_estado.tipo_gestao_id = tipos_gestao.id
GROUP BY tipos_gestao.descricao;

-- getHealthUnitPosition
SELECT
  tipos_unidade.tipo AS tipo,
  localizacoes.latitude       AS latitude,
  localizacoes.longitude      AS longitude
FROM localizacoes
  RIGHT JOIN (
               SELECT ufs.id
               FROM ufs
               WHERE ufs.sigla = ?
             ) AS ufs_state ON ufs_state.id = localizacoes.uf_id
  RIGHT JOIN unidades_saude ON unidades_saude.localizacao_id = localizacoes.id
  LEFT JOIN tipos_unidade ON unidades_saude.tipo_unidade_id = tipos_unidade.id;

-- unityTelephones
SELECT telefones.numero
  FROM
    telefones
  LEFT JOIN unidades_saude ON unidades_saude.id = telefones.unidade_saude_id
  WHERE unidades_saude.id = ?;

-- getRegionUnitsDistribution
SELECT regioes.nome AS regiao, COUNT(unidades_saude.id) AS numero_unidades
  FROM unidades_saude
  INNER JOIN localizacoes ON localizacoes.id = unidades_saude.localizacao_id
  INNER JOIN regioes ON localizacoes.regiao_id = regioes.id
  GROUP BY regioes.nome;

-- getRegionScoreByCategory
SELECT porCategoria.regiao, porCategoria.categorias, porCategoria.notas, geral.total
  FROM (
    SELECT
      regioes.nome                AS regiao,
      categorias_avaliacoes.nome  AS categorias,
      (AVG(notas.valor) / 3) * 10 AS notas
    FROM unidades_saude
      INNER JOIN localizacoes ON localizacoes.id = unidades_saude.localizacao_id
      INNER JOIN regioes ON localizacoes.regiao_id = regioes.id
      INNER JOIN nota_unidade_saude ON unidades_saude.id = nota_unidade_saude.unidade_saude_id
      INNER JOIN notas ON nota_unidade_saude.nota_id = notas.id
      INNER JOIN categorias_avaliacoes ON nota_unidade_saude.categoria_id = categorias_avaliacoes.id
    GROUP BY regioes.nome, categorias_avaliacoes.nome
  ) AS porCategoria
  INNER JOIN (
    SELECT
      regioes.nome                AS regiao,
      (AVG(notas.valor) / 3) * 10 AS total
    FROM unidades_saude
      INNER JOIN localizacoes ON localizacoes.id = unidades_saude.localizacao_id
      INNER JOIN regioes ON localizacoes.regiao_id = regioes.id
      INNER JOIN nota_unidade_saude ON unidades_saude.id = nota_unidade_saude.unidade_saude_id
      INNER JOIN notas ON nota_unidade_saude.nota_id = notas.id
      INNER JOIN categorias_avaliacoes ON nota_unidade_saude.categoria_id = categorias_avaliacoes.id
    GROUP BY regioes.nome
  ) AS geral  ON geral.regiao = porCategoria.regiao;

-- getRegionDistributionByType
SELECT regioes.nome AS regiao, tipos_unidade.tipo AS tipo, COUNT(unidades_saude.id) AS numero_unidades
  FROM unidades_saude
  INNER JOIN localizacoes ON localizacoes.id = unidades_saude.localizacao_id
  INNER JOIN regioes ON localizacoes.regiao_id = regioes.id
  INNER JOIN tipos_unidade ON unidades_saude.tipo_unidade_id = tipos_unidade.id
  GROUP BY regioes.nome, tipos_unidade.tipo;

-- getGovernmentControlledUnits
SELECT governo.count AS Governo, total.count AS Total
  FROM (
      SELECT COUNT(unidades_saude.id) as count
      FROM unidades_saude
      INNER JOIN tipos_gestao ON unidades_saude.tipo_gestao_id = tipos_gestao.id
      WHERE tipos_gestao.descricao = 'Estadual' OR tipos_gestao.descricao = 'Municipal'
    ) AS governo, (
    SELECT COUNT(unidades_saude.id) as count
      FROM unidades_saude
    ) AS total;

-- getAvgUnitCountByOwner
SELECT AVG(unidades_mantenedora.count) AS Count
  FROM (
    SELECT unidades_saude.mantenedora_id AS id, COUNT(unidades_saude.id) AS count
    FROM unidades_saude
    GROUP BY unidades_saude.mantenedora_id
  ) AS unidades_mantenedora
  GROUP BY NULL;

-- healthUnityInfo
SELECT
  unidade.razao_social AS razao_social,
  unidade.nome_fantansia AS nome_fantasia,
  mantenedoras.razao_social AS razao_social_mantenedora,
  mantenedoras.cnpj AS cnpj_mantenedora,
  bairros.nome AS bairro,
  municipios.nome AS municipio
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
SELECT
  telefones.numero
FROM (
      SELECT *
      FROM unidades_saude
      WHERE unidades_saude.id = ?
     ) AS unidade
LEFT JOIN telefones ON TrabalhoBD.telefones.unidade_saude_id = unidade.id;

-- healthUnityScores
SELECT
  categorias_avaliacoes.nome AS categoria,
  notas.descricao AS avaliacao,
  notas.valor AS valor
FROM (
      SELECT *
      FROM unidades_saude
      WHERE unidades_saude.id = ?
     ) AS unidade
LEFT JOIN nota_unidade_saude ON nota_unidade_saude.unidade_saude_id = unidade.id
INNER JOIN categorias_avaliacoes ON nota_unidade_saude.categoria_id = categorias_avaliacoes.id
INNER JOIN notas ON nota_unidade_saude.nota_id = notas.id;

-- StateUnitsScoreAvg
SELECT categorias_avaliacoes.nome AS categoria, (AVG(notas.valor)/3)*10 AS nota
FROM (
  SELECT unidades_saude.id AS id
  FROM unidades_saude
  INNER JOIN localizacoes ON unidades_saude.localizacao_id = localizacoes.id
  INNER JOIN ufs ON localizacoes.uf_id = ufs.id
  WHERE ufs.sigla = ?
) AS unidades
INNER JOIN nota_unidade_saude ON nota_unidade_saude.unidade_saude_id = unidades.id
INNER JOIN categorias_avaliacoes ON nota_unidade_saude.categoria_id = categorias_avaliacoes.id
INNER JOIN notas ON nota_unidade_saude.nota_id = notas.id
GROUP BY categorias_avaliacoes.nome;

-- StateUnitsTypeDistribution
SELECT tipos_unidade.tipo AS tipo, COUNT(unidades.id) AS quantidade
FROM (
  SELECT unidades_saude.id AS id, unidades_saude.tipo_unidade_id AS tipo_unidade_id
  FROM unidades_saude
  INNER JOIN localizacoes ON unidades_saude.localizacao_id = localizacoes.id
  INNER JOIN ufs ON localizacoes.uf_id = ufs.id
  WHERE ufs.sigla = ?
) AS unidades
INNER JOIN tipos_unidade ON tipos_unidade.id = unidades.tipo_unidade_id
GROUP BY tipos_unidade.tipo;

-- SearchBar
SELECT *
FROM (
  SELECT 'Location' AS tipo, ufs.sigla
  FROM ufs
  WHERE ufs.sigla LIKE ?
  LIMIT 1
)AS locations
UNION
SELECT *
FROM (
  SELECT 'Unity-nome' AS tipo, unidades_saude.id AS id
  FROM unidades_saude
  WHERE
    unidades_saude.nome_fantansia LIKE ?
  LIMIT 1
)AS unit_nome
UNION
SELECT *
FROM (
  SELECT 'Unity-razao-social' AS tipo, unidades_saude.id AS id
  FROM unidades_saude
  WHERE
    unidades_saude.razao_social LIKE ?
  LIMIT 1
)AS unit_nome
UNION
SELECT *
FROM (
  SELECT 'Unity-telefone' AS tipo, unidades_saude.id AS id
  FROM unidades_saude
  INNER JOIN telefones ON unidades_saude.id = telefones.unidade_saude_id
  WHERE
    telefones.numero LIKE ?
  LIMIT 1
)AS unit_nome