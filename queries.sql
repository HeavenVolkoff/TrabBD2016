##
# This file holds all of this project's database queries
#
# The Pattern used to parse the queries is:
# $> -- QueryName
# $> Query
#
# Anything other than this will be ignored and have only informational value
# All # comments will also be ignored
#
# Also, we use parametrization in our queries, this technique is used to avoid sql injection
# an question markss "?" is used to indicate to node (javascript server) what
# should be escaped and replaced by the right parameters inside the parameter array
##

USE TrabalhoBD; # Ignored py parser, informational value only

-- getStates
SELECT ufs.sigla FROM ufs;

-- countLocalizationsPerState
SELECT ufs.sigla AS state, count(localizacoes.id) AS quantity
FROM localizacoes
	INNER JOIN ufs ON localizacoes.uf_id = ufs.id
WHERE ufs.sigla = ?
GROUP BY ufs.sigla;

-- countHealthUnitPerType
SELECT tipos_gestao.descricao AS type, COUNT(tipos_gestao.id) AS quantity
FROM tipos_gestao
	INNER JOIN (
							 SELECT unidades_saude.tipo_gestao_id
							 FROM unidades_saude
								 INNER JOIN (
															SELECT localizacoes.id, localizacoes.uf_id
															FROM localizacoes
																INNER JOIN ufs ON ufs.id = localizacoes.uf_id
															WHERE ufs.sigla = ?
														) AS loc_uf ON loc_uf.id = unidades_saude.localizacao_id
						 ) AS tipo_gestao_estado ON tipo_gestao_estado.tipo_gestao_id = tipos_gestao.id
GROUP BY tipos_gestao.descricao;

-- getHealthUnitPosition
SELECT GROUP_CONCAT(tipos_unidade.tipo) AS tipo, AVG(localizacoes.latitude) AS latitude, AVG(localizacoes.longitude) AS longitude
FROM localizacoes
	RIGHT JOIN (
							 SELECT ufs.id
							 FROM ufs
							 WHERE ufs.sigla = ?
						 ) AS ufs_state ON ufs_state.id = localizacoes.uf_id
	LEFT JOIN unidades_saude ON unidades_saude.localizacao_id = localizacoes.id
	LEFT JOIN tipos_unidade ON unidades_saude.tipo_unidade_id = tipos_unidade.id
	GROUP BY unidades_saude.razao_social;

SELECT * FROM tipos_unidade;