# Deploy no homelab

Os ficheiros estão preparados para a infraestrutura observada em `/Users/CTW01805/Personal/Projects/nunosousa-dev/homelab`. Esse repositório não foi alterado e não foi feito deploy no cluster.

## Configuração preparada

- Talos/Proxmox, nós `amd64` com `homelab/node-type: vm`.
- Argo CD com charts locais em `kubernetes/apps/<app>` e Application em `kubernetes/apps/<app>.yaml`.
- Gateway Traefik `homelab`, namespace `traefik`, listener `web`.
- HTTPS público termina no Cloudflare; o túnel encaminha HTTP para `http://traefik.traefik.svc.cluster.local:80`.
- SQLite e avatares no PVC RWO `truenas-iscsi-retain`, uma réplica e rollout Recreate.
- Backups opcionais no PVC RWX `truenas-nfs-retain`; nunca usar esse NFS para a base de dados ativa.
- Runtime UID/GID 1001, sem privilégios, raiz só de leitura e `/tmp` temporário.

O hostname **proposto** é `amigo-secreto.nunosousa.dev`. Confirmar antes de criar DNS, configurar o túnel ou imprimir cartões. O certificado do listener `websecure` existente cobre o domínio local; a rota pública preparada usa `web`, seguindo os outros serviços públicos do homelab.

## Construir e verificar

Na raiz da aplicação, com Docker Desktop ativo:

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm run smoke:auth
docker build --platform linux/amd64 -t amigo-secreto:local .
npm run smoke:container
```

O teste de container cria e remove apenas os seus containers, volumes e credenciais temporárias. Verifica a arquitetura, UID, raiz só de leitura, criação/edição de membros, avatares, cartões, persistência, backup online e recuperação completa num volume novo. Não usa `.env.local` nem os dados reais.

Com Helm disponível, validar as duas configurações:

```sh
helm lint deploy/helm/amigo-secreto --strict --set image.tag=test
helm lint deploy/helm/amigo-secreto --strict --set image.tag=test --set backup.enabled=true
helm template amigo-secreto deploy/helm/amigo-secreto --namespace amigo-secreto --set image.tag=test --set backup.enabled=true
```

`test` serve apenas para renderizar. O chart exige uma tag explícita; não tem uma tag predefinida que possa ser instalada por engano.

## Publicar a imagem

O código da aplicação está em [nunosousa-dev/secret-santa](https://github.com/nunosousa-dev/secret-santa), com o remoto SSH `git@github.com:nunosousa-dev/secret-santa.git`. `.github/workflows/image.yaml` verifica o código e publica `ghcr.io/nunosousa-dev/secret-santa:sha-<commit-completo>` em pushes para `main` e execuções manuais. Pull requests compilam sem publicar. Confirmar o sucesso do workflow antes de configurar a tag no homelab.

O chart usa `ghcr.io/nunosousa-dev/secret-santa`. Usar a tag do commit verificado em `image.tag`. A imagem deve ser pública ou o namespace deve ter um Secret de acesso ao GHCR referenciado em `imagePullSecrets`.

## Preparar o Secret de administração

O Deployment espera `amigo-secreto-admin`, no namespace `amigo-secreto`, com a chave `ADMIN_PASSWORD_HASH`. Não guardar a palavra-passe nem um Secret Kubernetes em texto simples no Git. `npm run admin:setup` prepara o hash em `.env.local`; reexecutar altera a credencial local.

O exemplo abaixo lê esse hash em memória e passa o Secret diretamente ao `kubeseal`. Executar na raiz da aplicação, depois de instalar `kubeseal` e selecionar o contexto correto. Guarda apenas o resultado cifrado num ficheiro temporário; não o aplica ao cluster:

```sh
node --env-file=.env.local --input-type=module - <<'NODE' | kubeseal --controller-name sealed-secrets-controller --controller-namespace kube-system --format yaml > /tmp/amigo-secreto-admin-sealed.yaml
const hash = process.env.ADMIN_PASSWORD_HASH;
if (!hash) throw new Error("Configurar ADMIN_PASSWORD_HASH primeiro.");
process.stdout.write(JSON.stringify({
  apiVersion: "v1",
  kind: "Secret",
  metadata: { name: "amigo-secreto-admin", namespace: "amigo-secreto" },
  type: "Opaque",
  data: { ADMIN_PASSWORD_HASH: Buffer.from(hash).toString("base64") }
}));
NODE
```

Confirmar que o comando terminou com sucesso e que o ficheiro contém um `SealedSecret` com `encryptedData.ADMIN_PASSWORD_HASH` antes de o copiar para os templates do chart. A cifra fica associada ao nome e namespace indicados. O readiness devolve 503 se o hash estiver ausente ou inválido. Alterar o hash e reiniciar a aplicação invalida as sessões de administração anteriores.

## Integrar com o repositório homelab

Preparar uma alteração para revisão no homelab:

1. Copiar `deploy/helm/amigo-secreto/` para `kubernetes/apps/amigo-secreto/`.
2. Definir a imagem/tag publicada e confirmar o hostname em `values.yaml`.
3. Copiar o SealedSecret validado para `kubernetes/apps/amigo-secreto/templates/admin-sealedsecret.yaml`.
4. Copiar `deploy/argocd/application.yaml` para `kubernetes/apps/amigo-secreto.yaml`, seguindo o mecanismo existente de descoberta de Applications.
5. Acrescentar o hostname em `kubernetes/bootstrap/cloudflared/templates/config.yaml`, antes da regra final 404, com o serviço `http://traefik.traefik.svc.cluster.local:80`.
6. Criar o registo DNS Cloudflare para o túnel existente, seguindo os outros hostnames públicos. Não inventar um identificador de túnel.
7. Rever os manifests renderizados e só depois publicar/sincronizar a alteração através do fluxo GitOps habitual.

A Application usa sincronização automática. Publicar esses ficheiros no branch acompanhado pelo Argo CD pode iniciar o deploy. Os PVCs têm retenção Helm e `Prune=false` para evitar a sua remoção automática.

## Backup e recuperação

Ativar `backup.enabled: true` depois de verificar permissões de escrita para UID/GID 1001 no NFS. A tarefa corre diariamente às 03:00, fuso `Europe/Lisbon`, com `concurrencyPolicy: Forbid`. É agendada no mesmo nó da aplicação para partilhar o volume RWO; se a aplicação não estiver agendada, o backup pode ficar pendente. Monitorizar o sucesso e o espaço disponível. Não existe eliminação automática de snapshots nem uma cópia externa ao homelab.

O script `node scripts/backup.mjs`, incluído na imagem, usa a API de backup SQLite sobre a base ativa montada só para leitura e escreve um snapshot consistente em `/backups`. Inclui dados WAL já confirmados e avatares. Não executa migrações. Não copiar cegamente o ficheiro ativo.

Para restaurar:

1. Suspender a sincronização automática/reconciliação enquanto decorrer a manutenção, para que o Argo CD não volte a criar a réplica.
2. Suspender o CronJob e parar a aplicação; preservar o volume anterior para recuperação.
3. Copiar o snapshot escolhido para um volume iSCSI gravável, com propriedade UID/GID 1001, no caminho `/data/family.sqlite`. Não misturar ficheiros WAL/SHM anteriores com esse snapshot, nem executar a aplicação diretamente no volume NFS de backups.
4. Iniciar a imagem compatível com esse schema, apontando para o volume restaurado.
5. Confirmar readiness, login, perfis e avatares; retomar backups e reconciliação.

Os snapshots incluem hashes de edição e sessões; proteger o acesso aos backups. Uma recuperação pode reintroduzir acessos que existiam no momento do snapshot. Rodar ligações/credenciais quando necessário.

## Atualizações e primeira utilização

Antes de atualizar, criar e verificar um backup. Rever as migrações e atualizar a tag imutável no homelab. As migrações correm no arranque; Recreate impede a sobreposição das réplicas da aplicação e implica uma breve indisponibilidade. Reverter apenas a imagem só é seguro se a versão anterior aceitar o schema atual; caso contrário, restaurar também o snapshot correspondente.

Depois do primeiro deploy, verificar HTTPS a partir de uma rede móvel, login e edição, upload de avatar, persistência após substituição do pod e execução/recuperação de um backup no armazenamento real. A recuperação já foi verificada em volumes Docker; o CSI/NFS do cluster ainda precisa deste teste.

Criar a família real em `/admin`, remover a indicação de demonstração nas definições e distribuir manualmente as ligações privadas. Imprimir uma folha de `/admin/cartoes` e testar os QR num telemóvel antes de imprimir todos os cartões. Não há seed automático de dados fictícios no container.
