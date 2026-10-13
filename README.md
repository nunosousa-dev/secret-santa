# Amigo Secreto

Espaço de Natal para a família: perfis públicos com desejos e preferências, com sorteio físico de cartões. Interface em português de Portugal, desenhada primeiro para telemóveis.

## Estado atual

Página pública da família, pesquisa por nome/interesse, perfis individuais e edição de preferências. Os dados e avatares são guardados em SQLite, com schema Drizzle, migrações versionadas e backups consistentes.

A administração em `/admin` permite criar, renomear, arquivar e restaurar membros, carregar avatares, editar preferências e definições da família, e emitir/substituir/revogar ligações privadas. Está bloqueada até configurar uma palavra-passe. Os cartões com avatar, nome e QR estão em `/admin/cartoes`. O sorteio continua físico.

A imagem Docker e o chart Helm estão preparados e verificados localmente para o homelab. A integração Argo CD, publicação da imagem e exposição do endereço final ainda não foram executadas. Consultar [deploy/README.md](deploy/README.md).

## Executar localmente

Requisitos: Node.js 22 ou superior e npm.

```sh
npm ci
npm run db:migrate
npm run admin:setup
npm run dev
```

`admin:setup` pede e confirma uma palavra-passe sem a mostrar no terminal. Escreve apenas o hash scrypt em `.env.local` (ignorado pelo Git, permissões 0600). Não há palavra-passe predefinida. Reexecutar o comando e reiniciar o servidor permite recuperar o acesso e invalida sessões de administração anteriores.

Uma base de dados nova começa sem membros. Para experimentar com seis perfis fictícios, executar `npm run db:seed` antes de acrescentar pessoas reais. Este comando recusa alterar uma família que já tenha membros. A indicação de pré-visualização aparece apenas nas bases de dados com dados fictícios. A pasta local deste projeto já foi preparada com esses exemplos.

Abrir http://localhost:3000 e visitar `/admin` para entrar. O servidor de desenvolvimento escuta em `0.0.0.0`. Para testar num telemóvel na mesma rede, definir `APP_URL=http://<IP-local-do-computador>:3000` em `.env.local`, reiniciar e usar esse mesmo endereço no computador e no telemóvel. `APP_URL` define a origem autorizada para guardar formulários e emitir ligações. Não usar o servidor de desenvolvimento como serviço de produção exposto à Internet.

## Configuração e acesso

Consultar `.env.example`:

- `APP_URL`: origem canónica do site. Em produção, configurar o endereço HTTPS final.
- `DATABASE_PATH`: ficheiro SQLite; por omissão `./data/family.sqlite`. O arranque standalone resolve o caminho antes de mudar de diretório.
- `ADMIN_PASSWORD_HASH`: hash gerado por `admin:setup`; nunca a palavra-passe em texto simples. Em Kubernetes, usar um Secret.

A consulta dos perfis é pública. A edição requer uma sessão do organizador ou uma ligação privada para esse membro. O organizador pode copiar uma ligação recém-criada; mais tarde só pode substituí-la, porque o token original não é persistido.

As ligações têm o formato `/editar/<id>#token=<token-aleatório>`. O fragmento não é enviado em pedidos HTTP. A pessoa carrega em “Abrir a minha edição”; o fragmento é removido do endereço e o token é trocado por uma sessão. Apenas hashes SHA-256 de tokens de 32 bytes aleatórios ficam na base de dados.

- Sessões de administração: 12 horas; sessões de membros: 7 dias.
- Ligações privadas: reutilizáveis até revogação/substituição. Essa ação invalida também as sessões associadas.
- Cookies HttpOnly e SameSite=Lax; Secure quando `APP_URL` usa HTTPS.
- Todos os pedidos de alteração validam a origem e o acesso no servidor; não basta esconder botões.
- O login do organizador tem um limite global de 20 tentativas por 15 minutos, persistido na base de dados. Não depende de cabeçalhos de IP enviados pelo cliente.
- Guardar um formulário desatualizado devolve um conflito em vez de substituir alterações mais recentes.

## Base de dados e backup

```sh
npm run db:migrate
npm run db:backup
```

As migrações são aplicadas automaticamente ao abrir a base de dados; o comando permite executá-las antecipadamente. O backup usa a API SQLite e, por omissão, cria `data/backups/family-<timestamp>.sqlite`. Pode ser indicado outro destino com `npm run db:backup -- /caminho/backup.sqlite`.

O backup inclui preferências, avatares, definições e registos de acesso. Para restaurar, parar o servidor, preservar o estado anterior e copiar o snapshot para uma pasta gravável, configurando `DATABASE_PATH` para essa cópia antes de reiniciar. Não reutilizar ficheiros `-wal`/`-shm` da base anterior. Não executar diretamente sobre o snapshot de backup montado só para leitura.

O homelab usa uma única réplica, estratégia Recreate e volume RWO `truenas-iscsi-retain` para o SQLite. O NFS `truenas-nfs-retain` serve apenas para snapshots de backup. A tarefa diária opcional está desativada por omissão e não elimina backups antigos. Os testes verificam a recuperação de perfis e avatares numa cópia gravável e num volume Docker novo. As pastas `data/` e `uploads/` estão ignoradas pelo Git.

## Avatares, membros e cartões

Só o organizador pode carregar avatares: PNG, JPEG ou WebP sem animação, até 5 MB e 25 megapíxeis. O servidor valida o conteúdo, corrige a orientação, recorta ao centro para 512 × 512 e guarda WebP sem metadados. Sem upload, aparece um avatar de substituição.

Renomear um membro mantém o endereço público e o QR. Arquivar oculta o membro e torna o perfil e avatar indisponíveis, revogando ligações e sessões de edição. Restaurar recupera o mesmo perfil; é necessário emitir uma nova ligação privada.

Em `/admin/cartoes`, cada folha A4 contém até seis cartões de 88 × 84 mm com contorno de corte e linhas horizontal e vertical de dobra. O avatar fica no quadrante superior esquerdo e o nome no superior direito. O QR de 30 mm fica no quadrante inferior direito, afastado cerca de 6 mm da dobra horizontal e 7 mm da vertical. Dobrar ao meio em cada direção, com o conteúdo para dentro, e abrir o cartão para ler o QR. Cada cartão contém apenas avatar, nome e QR do perfil público. Definir primeiro o `APP_URL` definitivo. Usar impressão a 100%, papel A4 e desativar cabeçalhos/rodapés do browser; “Guardar como PDF” usa o mesmo percurso. A descodificação dos QR é verificada automaticamente; falta imprimir uma amostra e testar a leitura num telemóvel.

## Verificar e compilar

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run smoke:auth
npm start
```

Com o servidor a correr, `npm run smoke` verifica respostas HTTP da página inicial, stylesheet, todos os perfis ligados, páginas inexistentes e entrada protegida da administração. Para outro endereço, definir `BASE_URL`.

`npm test` verifica credenciais, isolamento de membros, revogação, expiração, conflitos de escrita, imagens, migrações, backups, QR e limitação de tentativas. `smoke:auth` inicia servidores de produção temporários com uma base de dados isolada e credenciais de teste, verificando administração, edição, avatares, cartões e persistência após reinícios. Não altera os perfis nem a palavra-passe locais.

O build configura a saída `standalone` e copia os assets estáticos necessários; `npm start` executa esse servidor. Com Docker Desktop ativo:

```sh
docker build --platform linux/amd64 -t amigo-secreto:local .
npm run smoke:container
```

O teste usa volumes e credenciais próprios, removidos no fim. Verifica o runtime sem root, sistema de ficheiros de raiz só de leitura, imagens nativas, persistência após reinício, backup com o serviço ativo e recuperação num volume novo. A imagem `amigo-secreto:local` fica disponível. `/health/live` verifica o processo; `/health/ready` exige SQLite acessível e um hash de administração válido.

## Estrutura

- `src/app`: rotas, layout e estilos das páginas.
- `src/components`: avatares, diretório pesquisável, formulários e administração.
- `src/lib/types.ts`: contratos de família, membro e desejo; sem dependência de um motor de base de dados.
- `src/lib/db`: schema Drizzle, migrações e operações SQLite.
- `src/lib/auth.ts`, `security.ts`, `http.ts`: sessões, credenciais e proteção de alterações.
- `src/lib/sample-data.ts`: dados fictícios para seed e formatação de datas/valores.
- `scripts/`: configuração, migrações, backup e verificações HTTP/container.
- `tests/`: verificações de acesso, administração, imagens, QR e persistência.
- `deploy/`: chart Helm, Application Argo CD e instruções para o homelab.
- `.github/workflows/image.yaml`: verificações e publicação GHCR por commit, quando o projeto estiver num repositório GitHub.
- `IMPLEMENTATION_PLAN.md`: requisitos, fases e decisões pendentes.

## Percursos de verificação

- Abrir `/`, pesquisar `Ines` e confirmar que aparece Inês; limpar a pesquisa.
- Pesquisar um termo inexistente e usar “Ver toda a família”.
- Abrir os seis perfis; Tomás demonstra a lista vazia e Inês demonstra tamanhos omitidos.
- Abrir `/p/desconhecido` e confirmar a página 404 em português.
- Entrar em `/admin`, criar uma ligação privada e abri-la numa janela sem sessão de administração.
- Editar preferências, guardar e confirmar as alterações no perfil público noutro dispositivo.
- Substituir/revogar a ligação e confirmar que a sessão de edição anterior deixa de poder guardar.
- Carregar um avatar, alterar o nome e confirmar que o QR anterior continua a abrir o mesmo perfil.
- Arquivar/restaurar um membro e emitir uma nova ligação de edição.
- Rever as definições da família, pré-visualizar a impressão A4 e ler os QR de uma folha impressa.
- Verificar navegação por teclado e layouts de 320, 390 e 430 px, além de desktop.

Não são carregadas fontes nem imagens de serviços externos. `noindex` está ativo para a pré-visualização; as páginas continuam públicas e acessíveis pelo URL.

## Limitações de verificação

- Lint, TypeScript e build de produção são verificados separadamente dos testes visuais.
- A ferramenta de browser não recebeu permissão para abrir o servidor local nesta sessão. Pesquisa interativa, layouts e utilização real em iOS/Android aguardam verificação visual.
- Na instalação inicial, `npm audit --omit=dev` não encontrou vulnerabilidades nas dependências de produção. O audit completo identificou cinco entradas de severidade alta na cadeia de desenvolvimento `eslint-config-next → fast-glob → micromatch → braces`. A versão publicada mais recente de `braces` continua afetada; não foi aplicada uma alteração forçada de major do framework para contornar o aviso. Rever esta cadeia quando existir uma correção compatível.
