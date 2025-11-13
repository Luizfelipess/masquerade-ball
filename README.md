Baile de Máscaras — Estrutura do projeto

Arquivos e pastas criados:
- `index.html` — página inicial (landing)
- `css/styles.css` — estilos principais (visual ornamentado, tipografia e animações leves)
- `js/main.js` — funcionalidades: RSVP (mock), preview de imagem, validação básica de CPF, liberação de votação por data, admin export CSV
- `pages/` — páginas separadas: `convite.html`, `codigo-vestes.html`, `premio.html`, `votacao.html`, `confirmacao.html`, `tributos.html`, `admin.html`
- `images/` — ilustrações SVG (ornamentos, máscara ornamentada, favicon)

Como testar localmente:
1. Abrir `index.html` no navegador (ou servir com um servidor estático, por exemplo `python -m http.server` no diretório do projeto).
2. Navegar entre as páginas usando o menu.

Como iremos acessar confirmações e votos (opções):

- Solução atual (implementada): os dados são armazenados no `localStorage` do navegador do organizador. Há uma página administrativa (`/pages/admin.html`) que permite visualizar e exportar (CSV) as confirmações e votos localmente. Esta é uma solução "mock" e funciona quando os organizadores acessam o site no mesmo computador/ navegador onde os dados foram gravados.

- Soluções recomendadas para produção (para ter acesso centralizado e seguro):
	1. Google Forms → Google Sheets: rápido de integrar; aceita uploads (imagens) e centraliza respostas numa planilha. Não garante validação por CPF sem etapa extra.
	2. Firebase (Authentication + Firestore / Storage): permite validação (por exemplo, exigir login por número de telefone ou e-mail), armazenamento de imagens e regras de segurança. Recomendado para votação pública com controle.
	3. Serverless (Vercel / Netlify Functions) + banco (Supabase / Postgres): você cria endpoints que validam CPF server-side, armazenam imagens em object storage e impedem votos duplicados. Melhor para controle absoluto e auditoria.

Observações e limitações da implementação atual:
- A validação de CPF aqui é feita no cliente e é apenas uma proteção mínima; não confie apenas nela para impedir fraudes.
- Os uploads de imagem não são persistidos no servidor nesta versão (somente preview local). Para persistência, é necessário integrar Storage (Firebase Storage, S3, ou endpoint).

Próximos passos possíveis (posso implementar):
- Integrar o RSVP e a votação com Google Forms / Sheets (rápido).
- Integrar com Firebase (autenticação + Firestore + Storage) para votação pública com prevenção efetiva de duplicatas.
- Configurar funções serverless no Vercel para validação server-side de CPF + upload seguro.

Se quiser, implemento a integração que preferir (diga qual: Google Forms, Firebase ou Vercel/Netlify + Supabase) e eu faço a configuração inicial e os ajustes no front-end para apontar ao backend.
