[Google Dive BD Folder]: https://drive.google.com/folderview?id=0BygRea4d-xCdeF9zTkFxVXMza2s&usp=sharing

# TrabBD2016
Trabalho de Banco de Dados 2016.1

## Requisitos:
+ Node.js (Versão 6.X)
+ NPM (Versão 3.X, Instalado com Node.js)
+ MySQL (Versão 5.7)

## Configurações:
### Banco de Dados:
> Devido a limitações de espaço do Github todos os arquivos relacionados ao BD se encontram em uma pasta do Google Drive

[Arquivos do Banco de Dados][Google Dive BD Folder]
+ Faça download do arquivo `DataBase > Exported > NewBDs.sql` no link acima
+ Cria uma Schema com o nome `TrabalhoBD` e Collation `utf8`
+ Execute o arquivo previamente salvo na Schema criada no passo anterior 

### Bibliotecas externas NPM:
No terminal faca `cd` na pasta raiz do projeto e execute:
```bash
npm install
```

## Estrututra do Projeto:
```
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
