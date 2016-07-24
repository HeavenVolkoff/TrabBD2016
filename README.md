[Database]: ./db
[dadosgov]: http://dados.gov.br
[DatabaseDownload]: https://github.com/HeavenVolkoff/TrabBD2016/raw/master/db/source/generated.zip

[dom4]: https://github.com/WebReflection/dom4#dom4
[json3]: https://bestiejs.github.io/json3/
[debug]: https://github.com/visionmedia/debug
[fastJS]: https://github.com/codemix/fast.js/tree/master
[es5Shim]: https://github.com/es-shims/es5-shim
[leaflet]: http://leafletjs.com/reference.html#map-fitboundsoptions
[connect]: https://github.com/senchalabs/connect
[mapIcons]: http://map-icons.com/
[bluebird]: https://github.com/petkaantonov/bluebird
[normalize]: https://necolas.github.io/normalize.css/
[requireJS]: requirejs.org
[node-sql2]: https://github.com/sidorares/node-mysql2
[socket.io]: http://socket.io
[serve-static]: https://github.com/expressjs/serve-static

# TrabBD2016
Trabalho de Banco de Dados 2016.1

## Proposta:
Analise dos dados disponíveis no [Portal Brasileiro de Dados Abertos][dadosgov] relacionados à qualidade dos estabelecimentos públicos de saúde por região e diversos outro fatores oferecendo uma fácil visualização desses dados através de uma plataforma Web contendo gráficos e mapas, e permitindo buscas específicas por unidade e propriedades de cada uma.

## Datasets utilizados:
- [Cadastro Nacional de Estabelecimentos de Saúde (CNES) - Ativos](http://dados.gov.br/dataset/cnes_ativo)
- [Unidades Básicas de Saúde - UBS](http://dados.gov.br/dataset/unidades-basicas-de-saude-ubs)

## Integrantes
| Aluno                              | DRE       |
|:----------------------------------:|:---------:|
| Raphael de Carvalho Almeida        | 114063859 |
| Thales de Freitas Magalhães        | 114058472 |
| Flávio Ribeiro Teixeira Neto       | 114023697 |
| Vítor Augusto da Silva Vasconcellos| 114025039 |

## Requisitos
+ Node.js (Versão 6.X)
+ NPM (Versão 3.X, Instalado com Node.js)
+ MySQL (Versão 5.7)

## Configuração do Projeto
### [Banco de Dados][Database]:
>Todas as configurações abaixo podem ser modificadas em `localConfiguration.json`
+ Faça download desse [script SQL][DatabaseDownload] ([mirror](#TODO)).
+ Cria uma Schema com o nome `TrabalhoBD` e Collation `utf8`.
+ Crie um usuário com nome `trabalhoBDAdmin` e senha `trabalhoBD2016!`, com acesso ao banco de dados anteriormente criado.
+ Execute o arquivo previamente salvo na Schema criada no passo anterior.

### Bibliotecas externas NPM:
No terminal faça `cd` na pasta raiz do projeto e execute:
```bash
$> npm install
```

### Execução:
No terminal faça `cd` na pasta raiz do projeto e execute:
```bash
$> node main
```
>Linux e Mac podem necessitar de `sudo` devido ao uso da porta `80` e `443`
><br>Programas que podem impossibilitar a execução do servidor `Skype`, `ISS Server(Windows)`, `Apache`

## Estrutura do Projeto
```
|+ db
||=> Nesta Pasta estão os arquivos de descriminação da estrutura e scripts de criação do banco de dados
|
|+ public
||=> Nessa pasta residem todos os arquivos relacionados à página web que sera disponibilizada pelo servidor Node.js
|    ATENÇÃO: Todos os arquivos dessa pasta estarão acessíveis ao público
|  
|+ util
||=> Nessa pasta residem os scripts utilitários à construção do servidor Node, Socket.IO e da conexão Banco de Dados
|  
|- configuration.json
||=> Arquivo com as configurações padrão do servidor Node, Socket.IO e da conexão Banco de Dados
|    ATENÇÃO: Não modificar esse arquivo para configurações pessoais
|  
|- localConfiguration.json
||=> Arquivo de configurações pessoais do desenvolvedor, criado na execução do npm install
|  
|- main.js
||=> Script de inicialização do seridor
|
|- queries.sql
||=> Arquivo onde todas as queries do sistema residem (internamente convertido para um json)
|
|- listeners.js
||=> Script responsável pela lógica de comunicação com os clientes (Socket.IO listeners)
```

## Dependências
+ Bibliotecas Back-End (Node.js):
    + [debug][debug]
    + [connect][connect]
    + [bluebird][bluebird]
    + [node-sql2][node-sql2]
    + [serve-static][serve-static]
    + [socket.io (Server)][socket.io]

+ Bibliotecas Front-End (Navegador):
    + [json3][json3]
    + [dom4][dom4]
    + [fast.js][fastJS]
    + [leaflet][leaflet]
    + [bluebird][bluebird]
    + [es5-shim][es5Shim]
    + [require.js][requireJS]
    + [map-icons][mapIcons]
    + [normalize.css][normalize]
    + [socket.io (Client)][socket.io]
