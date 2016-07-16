[Database]: ./db

[Database Download]: https://github.com/HeavenVolkoff/TrabBD2016/raw/master/db/source/generated.zip
[node-sql2]: https://github.com/sidorares/node-mysql2
[socket.io]: http://socket.io
[bluebird]: https://github.com/petkaantonov/bluebird
[connect]: https://github.com/senchalabs/connect
[debug]: https://github.com/visionmedia/debug
[serve-static]: https://github.com/expressjs/serve-static

# TrabBD2016
Trabalho de Banco de Dados 2016.1

### Integrantes
| Aluno                              | DRE       |
|:----------------------------------:|:---------:|
| Vítor Augusto da Silva Vasconcellos| 114025039 |
| Raphael de Carvalho Almeida        | 114063859 |
| Thales de Freitas Magalhães        | --------- |
| Flávio Ribeiro Teixeira Neto       | 114023697 |

## Requisitos
+ Node.js (Versão 6.X)
+ NPM (Versão 3.X, Instalado com Node.js)
+ MySQL (Versão 5.7)

## Configuração do Projeto
### [Banco de Dados][Database]:
+ Faça download desse [script SQL][Database Download] ([mirror](#TODO))
+ Cria uma Schema com o nome `TrabalhoBD` e Collation `utf8`
+ Execute o arquivo previamente salvo na Schema criada no passo anterior 

### Bibliotecas externas NPM:
No terminal faca `cd` na pasta raiz do projeto e execute:
```bash
npm install
```

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
|- listeners.js
||=> Script responsável pela lógica de comunicação com os clientes (Socket.IO listeners)
```

## Dependências
+ Bibliotecas Back-End (Node.js):
    + [bluebird][bluebird]
    + [connect][connect]
    + [debug][debug]
    + [node-sql2][node-sql2]
    + [serve-static][serve-static]
    + [socket.io (Server)][socket.io]

+ Bibliotecas Front-End (Navegador):
    + [socket.io (Client)][socket.io]