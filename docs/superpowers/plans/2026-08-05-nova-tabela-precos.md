# Nova Tabela de Preços + Vale-Refeição — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Atualizar preços dos kits (vigência 03/08/26) e anunciar Alelo/Sodexo Refeição na landing e no cardápio, com fonte única de preços no pedido.html.

**Architecture:** Site estático servido pela Netlify a partir da `main` de `JBMCOINS/SALVIA` (auto-deploy no push). `pedido.html` embute um app React via CDN (Babel inline); a precificação passa a viver num único array `PRICING_TIERS` que alimenta a cobrança (`calculatePricing`) e a tabela exibida. `index.html` é HTML puro estilizado por `style.css`.

**Tech Stack:** HTML estático, React 18 via CDN + Babel inline, Tailwind CDN (pedido.html), CSS próprio (index.html), GSAP. Sem framework de teste — verificação por script Node (`scripts/verify-pricing.mjs`) + greps.

**Spec:** `docs/superpowers/specs/2026-08-05-nova-tabela-precos-design.md` (aprovado)

## Global Constraints

- Repo: `C:\Projetos\salvia`, branch `main` (workflow do projeto é commit direto na main; a main local está à frente da origin com o commit do spec — isso é esperado).
- **NÃO fazer `git push` antes da Task 6.** Push dispara deploy em produção (salviamarmitas.com).
- Preços novos, copiar verbatim: faixas 1-4 → 29,00 · 5-9 → 27,00 · 10-14 → 24,00 · 15-19 → 23,50 · 20+ → 23,00. Kits: 10 → R$ 240,00 · 15 → R$ 352,50 · 20 → R$ 460,00.
- Texto do vale-refeição, verbatim: "Aceitamos Alelo Refeição e Sodexo Refeição" (precedido do emoji 💳).
- Não alterar: mínimo de 2 un. por sabor (3 pontos de clamp), controles +/-, mensagem do WhatsApp, animações GSAP.
- Não tocar em nada fora de `C:\Projetos\salvia` (a pasta `scratch\salvia` do Antigravity está fora do escopo).
- Todo texto voltado ao usuário em PT-BR.
- Comandos abaixo são PowerShell (Windows).

---

### Task 1: pedido.html — fonte única de preços (PRICING_TIERS)

**Files:**

- Create: `scripts/verify-pricing.mjs`
- Modify: `pedido.html:115-121` (calculatePricing), `pedido.html:130-131` (kitGoal morto), `pedido.html:268-273` (array da tabela visual)

**Interfaces:**

- Produces: array global `PRICING_TIERS` (objetos `{ min: number, label: string, price: number, elite?: boolean }`, ordenado do maior `min` para o menor) e `calculatePricing(totalQty: number): number` — Task 2 insere JSX adjacente à tabela que renderiza esse array.

- [ ] **Step 1: Criar o script de verificação (teste que deve falhar antes da mudança)**

Criar `scripts/verify-pricing.mjs` com este conteúdo exato:

```js
// Verifica a precificação REAL embutida em pedido.html.
// Uso: node scripts/verify-pricing.mjs  (a partir da raiz do repo)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const html = readFileSync(join(root, 'pedido.html'), 'utf8');

const tiersMatch = html.match(/const PRICING_TIERS = \[[\s\S]*?\];/);
const fnMatch = html.match(/const calculatePricing = [\s\S]*?\.price;/);
if (!tiersMatch || !fnMatch) {
  console.error('FAIL: PRICING_TIERS ou calculatePricing nao encontrados em pedido.html');
  process.exit(1);
}
const calculatePricing = new Function(`${tiersMatch[0]}\n${fnMatch[0]}\nreturn calculatePricing;`)();

// [quantidade total, preco unitario esperado]
const unitCases = [[0, 29], [1, 29], [2, 29], [4, 29], [5, 27], [9, 27], [10, 24], [14, 24], [15, 23.5], [19, 23.5], [20, 23], [25, 23], [100, 23]];
// [quantidade total, total esperado em R$]
const totalCases = [[2, 58], [7, 189], [12, 288], [17, 399.5], [20, 460], [25, 575]];

let fails = 0;
for (const [q, exp] of unitCases) {
  const got = calculatePricing(q);
  if (got !== exp) { console.error(`FAIL unitario q=${q}: esperado ${exp}, obtido ${got}`); fails++; }
}
for (const [q, exp] of totalCases) {
  const got = q * calculatePricing(q);
  if (Math.abs(got - exp) > 1e-9) { console.error(`FAIL total q=${q}: esperado ${exp}, obtido ${got}`); fails++; }
}
if (fails > 0) process.exit(1);
console.log(`PASS: ${unitCases.length + totalCases.length} casos ok`);
```

- [ ] **Step 2: Rodar e confirmar que FALHA (código novo ainda não existe)**

Run: `node C:\Projetos\salvia\scripts\verify-pricing.mjs`
Expected: exit 1 com `FAIL: PRICING_TIERS ou calculatePricing nao encontrados em pedido.html`

- [ ] **Step 3: Substituir calculatePricing pela fonte única**

Em `pedido.html`, substituir exatamente este bloco (linhas 115-121):

```js
    const calculatePricing = (totalQty) => {
      if (totalQty === 0) return 27.0;
      if (totalQty >= 15) return 21.5;
      if (totalQty >= 10) return 22.0;
      if (totalQty >= 5) return 25.0;
      return 27.0;
    };
```

por:

```js
    // Fonte unica de precos (vigencia 03/08/26): alimenta a cobranca E a tabela exibida.
    // Ordenado da maior faixa para a menor — find() pega a primeira faixa cujo min cabe na qtd.
    const PRICING_TIERS = [
      { min: 20, label: '20 ou mais', price: 23.0, elite: true },
      { min: 15, label: '15 a 19',    price: 23.5 },
      { min: 10, label: '10 a 14',    price: 24.0 },
      { min: 5,  label: '5 a 9',      price: 27.0 },
      { min: 1,  label: 'Até 4',      price: 29.0 },
    ];
    const calculatePricing = (totalQty) =>
      (PRICING_TIERS.find(t => totalQty >= t.min) ?? PRICING_TIERS[PRICING_TIERS.length - 1]).price;
```

(`totalQty = 0` cai no fallback 29,00; o total segue R$ 0,00 pois multiplica pela quantidade.)

- [ ] **Step 4: Remover a linha morta kitGoal**

Em `pedido.html` (linhas 130-131), substituir:

```js
      const params = new URLSearchParams(window.location.search);
      const kitGoal = parseInt(params.get('kit') || '0');
```

por (remove as duas linhas — `params` só existia para o `kitGoal`, que não é usado em nenhum outro lugar desde o commit 84dc1bac; os links `?kit=` da landing continuam válidos, o parâmetro é apenas ignorado):

```js
```

Resultado esperado: entre `const containerRef = useRef(null);` e `const getInitialMinQty = () => 2;` sobra exatamente uma linha em branco (a que já existia antes do bloco removido) — nenhum ajuste extra necessário.

- [ ] **Step 5: Renderizar a tabela visual a partir do MESMO array**

Em `pedido.html` (linhas 268-273, dentro da "Tabela de Preços Dinâmica"), substituir:

```jsx
                  {[
                    { qty: 'Até 4', price: '27,00' },
                    { qty: '5 a 9', price: '25,00' },
                    { qty: '10 a 14', price: '22,00' },
                    { qty: '15+', price: '21,50', elite: true }
                  ].map(p => (
                    <div key={p.qty} className={`p-4 rounded-3xl border text-center transition-all ${p.elite ? 'bg-salvia-cream border-salvia/30 text-salvia' : 'bg-white border-slate-100 hover:border-salvia/20'}`}>
                      <p className="font-black text-xl outfit leading-none mb-1">R$ {p.price}</p>
                      <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">{p.qty} Unidades</p>
                    </div>
                  ))}
```

por (ordem crescente para exibição; célula elite ocupa a linha inteira na grade de 2 colunas):

```jsx
                  {[...PRICING_TIERS].reverse().map(p => (
                    <div key={p.label} className={`p-4 rounded-3xl border text-center transition-all ${p.elite ? 'col-span-2 bg-salvia-cream border-salvia/30 text-salvia' : 'bg-white border-slate-100 hover:border-salvia/20'}`}>
                      <p className="font-black text-xl outfit leading-none mb-1">R$ {p.price.toFixed(2).replace('.', ',')}</p>
                      <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">{p.label} Unidades</p>
                    </div>
                  ))}
```

- [ ] **Step 6: Rodar a verificação e confirmar PASS**

Run: `node C:\Projetos\salvia\scripts\verify-pricing.mjs`
Expected: `PASS: 19 casos ok`

- [ ] **Step 7: Confirmar que valores antigos sumiram e não sobrou referência a kitGoal**

Run: `Select-String -Path C:\Projetos\salvia\pedido.html -Pattern '21,50|25,00|22,00|21\.5|22\.0|25\.0|kitGoal'`
Expected: nenhuma linha (sem saída)

Run: `Select-String -Path C:\Projetos\salvia\pedido.html -Pattern 'PRICING_TIERS' | Measure-Object | Select-Object -ExpandProperty Count`
Expected: `3` linhas — a definição (`const PRICING_TIERS = [`), a linha do corpo do `calculatePricing` e a linha do render da tabela (`{[...PRICING_TIERS].reverse().map`)

- [ ] **Step 8: Commit**

```powershell
git -C C:\Projetos\salvia add pedido.html scripts/verify-pricing.mjs
git -C C:\Projetos\salvia commit -m "feat: nova tabela de precos por faixa com fonte unica PRICING_TIERS (vigencia 03/08/26)"
```

---

### Task 2: pedido.html — vale-refeição (tabela + resumo)

**Files:**

- Modify: `pedido.html` — logo após o fechamento da tabela de preços (o `</div>` da grade que a Task 1 reescreveu, originalmente linha 279) e dentro do box de total do resumo (originalmente linhas 433-442)

**Interfaces:**

- Consumes: a grade da tabela renderizada de `PRICING_TIERS` (Task 1) — a nota entra como irmã imediatamente após o `</div>` dessa grade.

- [ ] **Step 1: Nota de vale-refeição sob a tabela de preços**

Em `pedido.html`, localizar o fechamento da grade da tabela (após a mudança da Task 1):

```jsx
                  ))}
                </div>
              </div>
            )}

            {view === 'building' && (
```

e inserir a nota entre o `</div>` da grade e o `</div>` seguinte:

```jsx
                  ))}
                </div>

                {/* Vale-refeicao aceito */}
                <div className="reveal mt-1 p-4 rounded-3xl bg-white border border-slate-100 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    💳 Aceitamos <span className="text-salvia">Alelo Refeição</span> e <span className="text-salvia">Sodexo Refeição</span>
                  </p>
                </div>
              </div>
            )}

            {view === 'building' && (
```

- [ ] **Step 2: Mesma nota no resumo final, dentro do box de total**

Em `pedido.html`, substituir o box (originalmente linhas 433-442):

```jsx
                  <div className="bg-salvia-cream p-8 rounded-[2rem] border-2 border-salvia/20 space-y-2">
                    <div className="flex justify-between text-[11px] font-black text-salvia/60 uppercase tracking-widest">
                      <span>Preço p/ unidade:</span>
                      <span>R$ {pricePerUnit.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div className="flex justify-between font-black text-3xl text-salvia pt-4 border-t border-salvia/10 outfit">
                      <span>TOTAL:</span>
                      <span>R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>
```

por:

```jsx
                  <div className="bg-salvia-cream p-8 rounded-[2rem] border-2 border-salvia/20 space-y-2">
                    <div className="flex justify-between text-[11px] font-black text-salvia/60 uppercase tracking-widest">
                      <span>Preço p/ unidade:</span>
                      <span>R$ {pricePerUnit.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div className="flex justify-between font-black text-3xl text-salvia pt-4 border-t border-salvia/10 outfit">
                      <span>TOTAL:</span>
                      <span>R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <p className="text-[10px] font-bold text-salvia/60 uppercase tracking-widest text-center pt-2">
                      💳 Aceitamos Alelo Refeição e Sodexo Refeição
                    </p>
                  </div>
```

- [ ] **Step 3: Verificar as duas ocorrências e que o script de preços segue passando**

Run: `(Select-String -Path C:\Projetos\salvia\pedido.html -Pattern 'Alelo Refeição' -AllMatches).Matches.Count`
Expected: `2`

Run: `node C:\Projetos\salvia\scripts\verify-pricing.mjs`
Expected: `PASS: 19 casos ok`

- [ ] **Step 4: Commit**

```powershell
git -C C:\Projetos\salvia add pedido.html
git -C C:\Projetos\salvia commit -m "feat: anuncia Alelo/Sodexo Refeicao na tabela de precos e no resumo do pedido"
```

---

### Task 3: index.html — cards de plano (sai 5, entram valores novos + card 20+)

**Files:**

- Modify: `index.html:187-239` (grade de planos), `style.css` (nova regra `.preco-obs` após `.plano-preco .valor`, originalmente linhas 532-535)

**Interfaces:**

- Produces: classe CSS `.preco-obs` (sublinha de preço). A Task 4 insere HTML logo após o `</div>` que fecha `.planos-grid`.

- [ ] **Step 1: Remover o card "Iniciante" (kit 5)**

Em `index.html`, remover exatamente este bloco (linhas 188-204, incluindo a linha em branco final):

```html
                <!-- Kit Teste -->
                <div class="plano-card reveal-card">
                    <div class="plano-header">
                        <h3>Iniciante</h3>
                        <p>5 Marmitas (Teste)</p>
                    </div>
                    <div class="plano-preco">
                        <span class="valor">R$ 125</span><span class="centavo">,00</span>
                    </div>
                    <ul class="plano-features">
                        <li>Cardápio Livre</li>
                        <li>Proteínas de Alta Qualidade</li>
                        <li>Ideal para uma semana</li>
                    </ul>
                    <a href="pedido.html?kit=5" class="btn btn-secondary btn-full">Começar agora</a>
                </div>

```

- [ ] **Step 2: Atualizar preço do card "Dedicado" (kit 10)**

Substituir:

```html
                        <span class="valor">R$ 220</span><span class="centavo">,00</span>
```

por:

```html
                        <span class="valor">R$ 240</span><span class="centavo">,00</span>
```

- [ ] **Step 3: Atualizar preço do card "Transformação" (kit 15)**

Substituir:

```html
                        <span class="valor">R$ 322</span><span class="centavo">,50</span>
```

por:

```html
                        <span class="valor">R$ 352</span><span class="centavo">,50</span>
```

- [ ] **Step 4: Adicionar o card "Estilo de Vida" (20+) após o card Transformação**

Localizar o fechamento do card Transformação + fechamento da grade:

```html
                    <a href="pedido.html?kit=15" class="btn btn-primary btn-full">Garantir transformação</a>
                </div>
            </div>
```

e substituir por:

```html
                    <a href="pedido.html?kit=15" class="btn btn-primary btn-full">Garantir transformação</a>
                </div>

                <!-- Kit 20+ (Melhor preço) -->
                <div class="plano-card reveal-card">
                    <div class="plano-header">
                        <h3>Estilo de Vida</h3>
                        <p>20+ Marmitas (Rotina completa)</p>
                    </div>
                    <div class="plano-preco">
                        <span class="valor">R$ 460</span><span class="centavo">,00</span>
                        <p class="preco-obs">R$ 23,00/un acima de 20 unidades</p>
                    </div>
                    <ul class="plano-features">
                        <li><strong>O melhor preço por unidade</strong></li>
                        <li>Rotina completa do mês</li>
                        <li>Pedido livre acima de 20</li>
                    </ul>
                    <a href="pedido.html?kit=20" class="btn btn-secondary btn-full">Garantir o melhor preço</a>
                </div>
            </div>
```

- [ ] **Step 5: Estilo da sublinha de preço em style.css**

Em `style.css`, localizar:

```css
.plano-preco .valor {
  font-size: 4rem;
  font-family: 'Outfit';
}
```

e substituir por:

```css
.plano-preco .valor {
  font-size: 4rem;
  font-family: 'Outfit';
}

.preco-obs {
  font-size: 0.85rem;
  color: var(--text-light);
  margin-top: 0.25rem;
}
```

- [ ] **Step 6: Verificar valores novos presentes, antigos ausentes, grade com 3 cards**

Run: `Select-String -Path C:\Projetos\salvia\index.html -Pattern 'R\$ 125|R\$ 220|R\$ 322|kit=5"'`
Expected: nenhuma linha

Run: `Select-String -Path C:\Projetos\salvia\index.html -Pattern 'R\$ 240|R\$ 352|R\$ 460|kit=20' | Measure-Object | Select-Object -ExpandProperty Count`
Expected: `4`

Run: `(Select-String -Path C:\Projetos\salvia\index.html -Pattern 'plano-card' -AllMatches).Matches.Count`
Expected: `3` — um por card: Dedicado (`plano-card reveal-card`), Transformação (`plano-card destaque reveal-card`) e Estilo de Vida (`plano-card reveal-card`)

- [ ] **Step 7: Conferência visual local**

Run: `Start-Process C:\Projetos\salvia\index.html`
Expected: seção Planos com 3 cards (240,00 · 352,50 destaque · 460,00 com sublinha "R$ 23,00/un acima de 20 unidades"), grade alinhada em 3 colunas.

- [ ] **Step 8: Commit**

```powershell
git -C C:\Projetos\salvia add index.html style.css
git -C C:\Projetos\salvia commit -m "feat: planos da landing com precos novos - sai kit 5, entra card 20+ (R$ 460)"
```

---

### Task 4: index.html — faixa de vale-refeição na seção Planos

**Files:**

- Modify: `index.html` (após o `</div>` que fecha `.planos-grid`, dentro do `.container` da seção `#planos`), `style.css` (nova regra `.pagamento-info` após `.preco-obs`)

**Interfaces:**

- Consumes: posição do fechamento da grade conforme deixado pela Task 3; regra `.preco-obs` em `style.css` (âncora de inserção).

- [ ] **Step 1: Inserir a faixa após a grade de planos**

Em `index.html`, localizar o final da seção de planos (após a Task 3):

```html
                    <a href="pedido.html?kit=20" class="btn btn-secondary btn-full">Garantir o melhor preço</a>
                </div>
            </div>
        </div>
    </section>
```

e substituir por:

```html
                    <a href="pedido.html?kit=20" class="btn btn-secondary btn-full">Garantir o melhor preço</a>
                </div>
            </div>

            <div class="pagamento-info">
                💳 Aceitamos <strong>Alelo Refeição</strong> e <strong>Sodexo Refeição</strong>
            </div>
        </div>
    </section>
```

- [ ] **Step 2: Estilo da faixa em style.css**

Em `style.css`, localizar a regra criada na Task 3:

```css
.preco-obs {
  font-size: 0.85rem;
  color: var(--text-light);
  margin-top: 0.25rem;
}
```

e substituir por:

```css
.preco-obs {
  font-size: 0.85rem;
  color: var(--text-light);
  margin-top: 0.25rem;
}

.pagamento-info {
  width: fit-content;
  margin: 3rem auto 0;
  padding: 1rem 2.5rem;
  background: var(--secondary-light);
  border-radius: 50px;
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
  color: var(--primary);
  text-align: center;
}
```

- [ ] **Step 3: Verificar**

Run: `(Select-String -Path C:\Projetos\salvia\index.html -Pattern 'Alelo Refeição' -AllMatches).Matches.Count`
Expected: `1`

Run: `Start-Process C:\Projetos\salvia\index.html`
Expected: pílula centralizada verde-clara com "💳 Aceitamos Alelo Refeição e Sodexo Refeição" logo abaixo dos 3 cards.

- [ ] **Step 4: Commit**

```powershell
git -C C:\Projetos\salvia add index.html style.css
git -C C:\Projetos\salvia commit -m "feat: faixa de vale-refeicao (Alelo/Sodexo) na secao de planos"
```

---

### Task 5: Code review (gate antes do push)

**Files:**

- Nenhuma criação prevista; correções pontuais em `pedido.html` / `index.html` / `style.css` se a revisão apontar problemas.

**Interfaces:**

- Consumes: todos os commits das Tasks 1-4. Base estável para o diff: commit `3ccf329` (último commit antes deste trabalho).

- [ ] **Step 1: Gerar o diff completo do trabalho**

Run: `git -C C:\Projetos\salvia diff 3ccf329..HEAD -- pedido.html index.html style.css scripts/`

- [ ] **Step 2: Revisão contra o spec (superpowers:requesting-code-review)**

Despachar um subagente revisor (code-reviewer) com o diff acima e o spec `docs/superpowers/specs/2026-08-05-nova-tabela-precos-design.md`. Pontos obrigatórios do checklist do revisor:

1. Matemática das faixas confere com a tabela do spec (inclusive limites 4/5, 9/10, 14/15, 19/20).
2. Nenhum resquício de preço antigo (21,50 / 22,00 / 25,00 / R$ 125 / R$ 220 / R$ 322) nos três arquivos.
3. `PRICING_TIERS` é a única definição de preço em `pedido.html` (tabela visual não tem números hardcoded).
4. Regras preservadas: mínimo 2 por sabor (3 clamps), `updateQuantity` com `Math.max(2, ...)`, mensagem WhatsApp intacta.
5. JSX válido (balanceamento de tags nas inserções — a página quebra em tela branca se o Babel falhar; ver histórico do commit 3ccf329).
6. Links dos cards: `?kit=10`, `?kit=15`, `?kit=20`; nenhum `?kit=5` restante.
7. CSS novo usa variáveis existentes (`--text-light`, `--secondary-light`, `--primary`).

- [ ] **Step 3: Aplicar correções apontadas (se houver) e commitar**

```powershell
git -C C:\Projetos\salvia add -A
git -C C:\Projetos\salvia commit -m "fix: ajustes do code review da nova tabela de precos"
```

(Pular este commit se a revisão não apontar nada.)

- [ ] **Step 4: Re-rodar a verificação completa pós-correções**

Run: `node C:\Projetos\salvia\scripts\verify-pricing.mjs`
Expected: `PASS: 19 casos ok`

---

### Task 6: Push + verificação em produção

**Files:**

- Nenhum. Publica e confere.

**Interfaces:**

- Consumes: main local com Tasks 1-5 commitadas e revisadas.

- [ ] **Step 1: Push (dispara o deploy Netlify)**

```powershell
git -C C:\Projetos\salvia push origin main
```

- [ ] **Step 2: Aguardar o deploy e conferir a landing em produção**

Aguardar ~60s após o push e rodar (se algum valor vier `False`, aguardar mais 60s e repetir — máximo 3 tentativas; o cache da Netlify invalida no deploy):

```powershell
$nc = Get-Random
$r = Invoke-WebRequest "https://salviamarmitas.com/?nc=$nc" -UseBasicParsing
"R$ 240   presente: " + $r.Content.Contains('R$ 240')
"R$ 352   presente: " + $r.Content.Contains('R$ 352')
"R$ 460   presente: " + $r.Content.Contains('R$ 460')
"Alelo    presente: " + $r.Content.Contains('Alelo Refei')
"R$ 125   ausente : " + (-not $r.Content.Contains('R$ 125'))
"R$ 220   ausente : " + (-not $r.Content.Contains('R$ 220'))
```

Expected: todas as linhas `True`.

- [ ] **Step 3: Conferir o cardápio em produção (valores estão no script inline — visíveis no fonte)**

```powershell
$p = Invoke-WebRequest "https://salviamarmitas.com/pedido.html?nc=$nc" -UseBasicParsing
"PRICING_TIERS presente: " + $p.Content.Contains('PRICING_TIERS')
"29.0 presente: " + $p.Content.Contains('29.0')
"23.5 presente: " + $p.Content.Contains('23.5')
"Alelo presente: " + $p.Content.Contains('Alelo Refei')
"21.5 ausente : " + (-not $p.Content.Contains('21.5'))
"kitGoal ausente: " + (-not $p.Content.Contains('kitGoal'))
```

Expected: todas as linhas `True`.

- [ ] **Step 4: Smoke test funcional no site vivo**

Abrir `https://salviamarmitas.com/pedido.html`, montar um pedido de teste com 2 sabores × 6 unidades (total 12) e conferir no floater/resumo: preço unitário R$ 24,00, total R$ 288,00. Não enviar o WhatsApp.

- [ ] **Step 5: Reportar ao usuário**

Resumo final com: commits publicados, confirmação dos valores em produção e lembrete de que a pasta do Antigravity segue intocada.
