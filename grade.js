// ============================================================
// Grade Interativa — Eng. de Computação UFC
// v2: optativas livres, semestres dinâmicos, mover obrigatórias,
//     CH/semestre, validação prereqs, compartilhar URL
// ============================================================

(function () {
  "use strict";

  // ------- Estado -------
  var estado = {
    concluidas: {},            // { id: true }
    optativasAlocadas: [],     // [{ optId: "CK0111", periodo: 5 }]
    posicoesCustom: {},        // { "CB0707": 4 }  (obrig movida)
    totalSemestres: 10         // dinâmico, 10-15
  };

  // ------- Helpers -------
  function salvar() {
    localStorage.setItem("grade-ec-ufc", JSON.stringify(estado));
  }

  function carregar() {
    // Prioridade: URL hash > localStorage
    if (carregarDeURL()) return;
    var raw = localStorage.getItem("grade-ec-ufc");
    if (raw) {
      try {
        var parsed = JSON.parse(raw);
        migrarEstado(parsed);
      } catch (e) { /* corrupted, ignore */ }
    }
  }

  function migrarEstado(parsed) {
    estado.concluidas = parsed.concluidas || {};
    estado.totalSemestres = parsed.totalSemestres || 10;
    estado.posicoesCustom = parsed.posicoesCustom || {};

    // Migrar formato antigo (optativaSlots) para novo (optativasAlocadas)
    if (parsed.optativasAlocadas) {
      estado.optativasAlocadas = parsed.optativasAlocadas;
    } else if (parsed.optativaSlots) {
      estado.optativasAlocadas = [];
      Object.keys(parsed.optativaSlots).forEach(function (slotId) {
        var parts = slotId.split("_");
        var periodo = parseInt(parts[1]) || 7;
        estado.optativasAlocadas.push({
          optId: parsed.optativaSlots[slotId],
          periodo: periodo
        });
      });
      // Migrar conclusões de slots antigos
      Object.keys(parsed.concluidas).forEach(function (key) {
        if (key.indexOf("OPT_") === 0) {
          var parts = key.split("_");
          var per = parseInt(parts[1]);
          var idx = parseInt(parts[2]) - 1;
          var count = 0;
          estado.optativasAlocadas.forEach(function (a) {
            if (a.periodo === per) {
              if (count === idx) {
                estado.concluidas[a.optId] = true;
              }
              count++;
            }
          });
          delete estado.concluidas[key];
        }
      });
    } else {
      estado.optativasAlocadas = [];
    }
  }

  // Mapa de id -> disciplina
  var mapDisc = {};
  obrigatorias.forEach(function (d) { mapDisc[d.id] = d; });
  optativas.forEach(function (d) { mapDisc[d.id] = d; });

  // Obter o período efetivo de uma obrigatória
  function periodoEfetivo(disc) {
    return estado.posicoesCustom[disc.id] || disc.periodo;
  }

  // Dependentes de cada disciplina
  var dependentesMap = {};
  function buildDependentesMap() {
    dependentesMap = {};
    obrigatorias.forEach(function (d) {
      d.prereqs.forEach(function (p) {
        if (!dependentesMap[p]) dependentesMap[p] = [];
        if (dependentesMap[p].indexOf(d.id) === -1) dependentesMap[p].push(d.id);
      });
    });
    estado.optativasAlocadas.forEach(function (a) {
      var opt = mapDisc[a.optId];
      if (opt && opt.prereqs) {
        opt.prereqs.forEach(function (p) {
          if (!dependentesMap[p]) dependentesMap[p] = [];
          if (dependentesMap[p].indexOf(a.optId) === -1) dependentesMap[p].push(a.optId);
        });
      }
    });
  }

  function isLiberada(disc) {
    if (!disc.prereqs || disc.prereqs.length === 0) return true;
    return disc.prereqs.every(function (p) { return estado.concluidas[p]; });
  }

  // Obter o período de um prereq (para validação)
  function periodoDeDisc(id) {
    var obr = mapDisc[id];
    if (obr && obr.periodo !== undefined) return periodoEfetivo(obr);
    // Pode ser optativa alocada
    for (var i = 0; i < estado.optativasAlocadas.length; i++) {
      if (estado.optativasAlocadas[i].optId === id) return estado.optativasAlocadas[i].periodo;
    }
    return 0;
  }

  // Validar se mover para destPeriodo causa conflito de prereqs
  function validarPrereqs(disc, destPeriodo) {
    var avisos = [];
    if (disc.prereqs) {
      disc.prereqs.forEach(function (pId) {
        var pPer = periodoDeDisc(pId);
        if (pPer >= destPeriodo) {
          var pDisc = mapDisc[pId];
          avisos.push((pDisc ? pDisc.nome : pId) + " está no " + pPer + "º período");
        }
      });
    }
    return avisos;
  }

  // CH de um semestre
  function chDoSemestre(sem) {
    var total = 0;
    obrigatorias.forEach(function (d) {
      if (periodoEfetivo(d) === sem) total += d.ch;
    });
    estado.optativasAlocadas.forEach(function (a) {
      if (a.periodo === sem) {
        var opt = mapDisc[a.optId];
        total += opt ? opt.ch : 64;
      }
    });
    return total;
  }

  // ------- Drag and Drop -------
  var dragData = null; // { tipo: 'obr'|'opt', id: '...', optIdx: N }

  function onDragStart(e, tipo, id, optIdx) {
    dragData = { tipo: tipo, id: id, optIdx: optIdx };
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    e.target.classList.add('dragging');
    // Highlight all drop zones
    setTimeout(function () {
      document.querySelectorAll('.periodo-coluna').forEach(function (col) {
        col.classList.add('drop-zone');
      });
    }, 0);
  }

  function onDragEnd(e) {
    e.target.classList.remove('dragging');
    dragData = null;
    document.querySelectorAll('.periodo-coluna').forEach(function (col) {
      col.classList.remove('drop-zone', 'drop-hover');
    });
  }

  function setupDropZone(coluna, sem) {
    coluna.addEventListener('dragover', function (e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      coluna.classList.add('drop-hover');
    });
    coluna.addEventListener('dragleave', function (e) {
      if (!coluna.contains(e.relatedTarget)) {
        coluna.classList.remove('drop-hover');
      }
    });
    coluna.addEventListener('drop', function (e) {
      e.preventDefault();
      coluna.classList.remove('drop-hover');
      if (!dragData) return;

      if (dragData.tipo === 'obr') {
        var disc = mapDisc[dragData.id];
        if (disc) {
          if (sem === disc.periodo) {
            delete estado.posicoesCustom[disc.id];
          } else {
            estado.posicoesCustom[disc.id] = sem;
          }
        }
      } else if (dragData.tipo === 'opt') {
        var idx = dragData.optIdx;
        if (idx !== undefined && estado.optativasAlocadas[idx]) {
          estado.optativasAlocadas[idx].periodo = sem;
        }
      }
      dragData = null;
      salvar();
      renderGrade();
    });
  }

  // ============================================================
  // RENDERIZAÇÃO
  // ============================================================
  function renderGrade() {
    buildDependentesMap();
    var container = document.getElementById("grade-container");
    container.innerHTML = "";

    for (var sem = 1; sem <= estado.totalSemestres; sem++) {
      container.appendChild(criarColunaSemestre(sem));
    }

    // Botão "+ Período"
    if (estado.totalSemestres < MAX_SEMESTRES) {
      var btnAdd = document.createElement("div");
      btnAdd.className = "btn-add-periodo";
      btnAdd.innerHTML = '<span>＋</span><span class="btn-add-label">Período</span>';
      btnAdd.addEventListener("click", adicionarPeriodo);
      container.appendChild(btnAdd);
    }

    renderAtividades();
    atualizarEstadoVisual();
    atualizarProgresso();
  }

  function criarColunaSemestre(sem) {
    var coluna = document.createElement("div");
    coluna.className = "periodo-coluna";
    coluna.dataset.periodo = sem;

    // Setup drag-and-drop zone
    setupDropZone(coluna, sem);

    // Header
    var header = document.createElement("div");
    header.className = "periodo-header";
    header.id = "periodo-header-" + sem;

    var chSem = chDoSemestre(sem);
    header.innerHTML = sem + "º Período" +
      '<span class="periodo-ch">' + chSem + 'h</span>';

    // Botão ✕ para períodos extras vazios
    if (sem > 10) {
      var btnRemover = document.createElement("button");
      btnRemover.className = "btn-remover-periodo";
      btnRemover.textContent = "✕";
      btnRemover.title = "Remover período";
      btnRemover.addEventListener("click", function (e) {
        e.stopPropagation();
        removerPeriodo(sem);
      });
      header.appendChild(btnRemover);
    }

    coluna.appendChild(header);

    // Obrigatórias neste semestre
    var discsDoSem = obrigatorias.filter(function (d) {
      return periodoEfetivo(d) === sem;
    });
    discsDoSem.forEach(function (disc) {
      coluna.appendChild(criarCardObrigatoria(disc));
    });

    // Optativas alocadas neste semestre
    estado.optativasAlocadas.forEach(function (a, idx) {
      if (a.periodo === sem) {
        coluna.appendChild(criarCardOptativaAlocada(a, idx));
      }
    });

    // Botão "+ Optativa"
    var btnOpt = document.createElement("div");
    btnOpt.className = "btn-add-opt";
    btnOpt.textContent = "＋ Optativa";
    btnOpt.addEventListener("click", function () {
      abrirModal(sem);
    });
    coluna.appendChild(btnOpt);

    return coluna;
  }

  // ------- Card obrigatória -------
  function criarCardObrigatoria(disc) {
    var card = document.createElement("div");
    card.className = "disciplina";
    card.id = "card-" + disc.id;
    card.dataset.id = disc.id;
    card.dataset.tipo = "obr";
    card.draggable = true;

    var foiMovida = estado.posicoesCustom[disc.id] !== undefined;
    var badgeHTML = foiMovida
      ? '<span class="badge-sugerido" title="Período sugerido pelo PPC">📌 ' + disc.periodo + 'º</span>'
      : '';

    card.innerHTML =
      '<span class="disc-nome">' + disc.nome + '</span>' +
      '<span class="disc-ch">' + disc.ch + 'h ' + badgeHTML + '</span>' +
      '<button class="btn-mover" title="Mover para outro período">⇄</button>';

    // Drag and drop
    card.addEventListener("dragstart", function (e) {
      onDragStart(e, 'obr', disc.id);
    });
    card.addEventListener("dragend", onDragEnd);

    card.querySelector(".btn-mover").addEventListener("click", function (e) {
      e.stopPropagation();
      abrirSeletorPeriodo(disc, card);
    });

    card.addEventListener("click", function () {
      toggleConclusao(disc.id);
    });
    card.addEventListener("mouseenter", function () {
      destacarDependencias(disc.id, disc.prereqs);
    });
    card.addEventListener("mouseleave", limparDestaques);

    return card;
  }

  // ------- Card optativa alocada -------
  function criarCardOptativaAlocada(alocacao, idx) {
    var opt = mapDisc[alocacao.optId];
    if (!opt) return document.createElement("div");

    var card = document.createElement("div");
    card.className = "disciplina optativa-slot preenchida";
    card.id = "card-opt-" + idx;
    card.dataset.id = alocacao.optId;
    card.dataset.tipo = "opt";
    card.draggable = true;

    card.innerHTML =
      '<span class="disc-nome">' + opt.nome + '</span>' +
      '<span class="disc-ch">' + opt.ch + 'h</span>' +
      '<button class="btn-remover-opt" title="Remover optativa">✕</button>' +
      '<button class="btn-mover" title="Mover para outro período">⇄</button>';

    // Drag and drop
    card.addEventListener("dragstart", function (e) {
      onDragStart(e, 'opt', alocacao.optId, idx);
    });
    card.addEventListener("dragend", onDragEnd);

    card.querySelector(".btn-remover-opt").addEventListener("click", function (e) {
      e.stopPropagation();
      removerOptativa(idx);
    });

    card.querySelector(".btn-mover").addEventListener("click", function (e) {
      e.stopPropagation();
      abrirSeletorPeriodoOpt(idx, card);
    });

    card.addEventListener("click", function () {
      toggleConclusao(alocacao.optId);
    });
    card.addEventListener("mouseenter", function () {
      destacarDependencias(alocacao.optId, opt.prereqs);
    });
    card.addEventListener("mouseleave", limparDestaques);

    return card;
  }

  // ------- Atividades -------
  function renderAtividades() {
    var container = document.getElementById("atividades-cards");
    container.innerHTML = "";
    atividades.forEach(function (ativ) {
      var card = document.createElement("div");
      card.className = "atividade-card";
      card.id = "card-" + ativ.id;
      card.dataset.id = ativ.id;
      card.innerHTML =
        '<span class="ativ-nome">' + ativ.nome + '</span>' +
        '<span class="ativ-ch">' + ativ.ch + 'h</span>' +
        '<span class="ativ-desc">' + ativ.descricao + '</span>';
      card.addEventListener("click", function () {
        toggleConclusao(ativ.id);
      });
      container.appendChild(card);
    });
  }

  // ============================================================
  // INTERAÇÕES
  // ============================================================

  // Toggle conclusão
  function toggleConclusao(id) {
    if (estado.concluidas[id]) {
      delete estado.concluidas[id];
    } else {
      estado.concluidas[id] = true;
    }
    salvar();
    atualizarEstadoVisual();
    atualizarProgresso();
  }

  // Adicionar/remover períodos
  function adicionarPeriodo() {
    if (estado.totalSemestres < MAX_SEMESTRES) {
      estado.totalSemestres++;
      salvar();
      renderGrade();
    }
  }

  function removerPeriodo(sem) {
    // Checar se vazio
    var temObr = obrigatorias.some(function (d) { return periodoEfetivo(d) === sem; });
    var temOpt = estado.optativasAlocadas.some(function (a) { return a.periodo === sem; });
    if (temObr || temOpt) {
      alert("Mova as disciplinas deste período antes de removê-lo.");
      return;
    }
    // Mover disciplinas de períodos posteriores
    if (sem < estado.totalSemestres) {
      // Ajustar posições customizadas
      Object.keys(estado.posicoesCustom).forEach(function (id) {
        if (estado.posicoesCustom[id] > sem) {
          estado.posicoesCustom[id]--;
        }
      });
      // Ajustar optativas alocadas
      estado.optativasAlocadas.forEach(function (a) {
        if (a.periodo > sem) a.periodo--;
      });
    }
    estado.totalSemestres--;
    salvar();
    renderGrade();
  }

  // Remover optativa
  function removerOptativa(idx) {
    var optId = estado.optativasAlocadas[idx].optId;
    delete estado.concluidas[optId];
    estado.optativasAlocadas.splice(idx, 1);
    salvar();
    renderGrade();
  }

  // ------- Seletor de período (mover obrigatórias) -------
  function abrirSeletorPeriodo(disc, cardEl) {
    fecharSeletores();
    var sel = document.createElement("div");
    sel.className = "seletor-periodo";

    for (var s = 1; s <= estado.totalSemestres; s++) {
      var btn = document.createElement("button");
      btn.textContent = s + "º";
      btn.dataset.per = s;
      var perAtual = periodoEfetivo(disc);
      if (s === perAtual) btn.classList.add("sel-atual");

      // Validar prereqs
      var avisos = validarPrereqs(disc, s);
      if (avisos.length > 0) {
        btn.classList.add("sel-aviso");
        btn.title = "⚠ Pré-requisito(s) no mesmo período ou posterior:\n" + avisos.join("\n");
      }

      (function (periodo) {
        btn.addEventListener("click", function (e) {
          e.stopPropagation();
          moverObrigatoria(disc, periodo);
        });
      })(s);
      sel.appendChild(btn);
    }

    // Botão restaurar
    if (estado.posicoesCustom[disc.id] !== undefined) {
      var btnReset = document.createElement("button");
      btnReset.textContent = "↩";
      btnReset.title = "Voltar ao período sugerido (" + disc.periodo + "º)";
      btnReset.classList.add("sel-reset");
      btnReset.addEventListener("click", function (e) {
        e.stopPropagation();
        delete estado.posicoesCustom[disc.id];
        salvar();
        renderGrade();
      });
      sel.appendChild(btnReset);
    }

    cardEl.appendChild(sel);

    // Fechar ao clicar fora
    setTimeout(function () {
      document.addEventListener("click", fecharSeletoresHandler);
    }, 10);
  }

  function abrirSeletorPeriodoOpt(idx, cardEl) {
    fecharSeletores();
    var sel = document.createElement("div");
    sel.className = "seletor-periodo";

    var a = estado.optativasAlocadas[idx];
    var opt = mapDisc[a.optId];

    for (var s = 1; s <= estado.totalSemestres; s++) {
      var btn = document.createElement("button");
      btn.textContent = s + "º";
      if (s === a.periodo) btn.classList.add("sel-atual");

      if (opt) {
        var avisos = validarPrereqs(opt, s);
        if (avisos.length > 0) {
          btn.classList.add("sel-aviso");
          btn.title = "⚠ Pré-requisito(s) no mesmo período ou posterior:\n" + avisos.join("\n");
        }
      }

      (function (periodo) {
        btn.addEventListener("click", function (e) {
          e.stopPropagation();
          estado.optativasAlocadas[idx].periodo = periodo;
          salvar();
          renderGrade();
        });
      })(s);
      sel.appendChild(btn);
    }

    cardEl.appendChild(sel);
    setTimeout(function () {
      document.addEventListener("click", fecharSeletoresHandler);
    }, 10);
  }

  function moverObrigatoria(disc, novoPeriodo) {
    if (novoPeriodo === disc.periodo) {
      delete estado.posicoesCustom[disc.id];
    } else {
      estado.posicoesCustom[disc.id] = novoPeriodo;
    }
    salvar();
    renderGrade();
  }

  function fecharSeletores() {
    document.querySelectorAll(".seletor-periodo").forEach(function (el) {
      el.remove();
    });
    document.removeEventListener("click", fecharSeletoresHandler);
  }

  function fecharSeletoresHandler() {
    fecharSeletores();
  }

  // ============================================================
  // VISUAL STATE
  // ============================================================
  function atualizarEstadoVisual() {
    // Obrigatórias
    obrigatorias.forEach(function (disc) {
      var card = document.getElementById("card-" + disc.id);
      if (!card) return;
      card.classList.toggle("concluida", !!estado.concluidas[disc.id]);
      if (!estado.concluidas[disc.id]) {
        card.classList.toggle("liberada", isLiberada(disc));
      } else {
        card.classList.remove("liberada");
      }
      // Aviso de prereq fora de ordem
      var per = periodoEfetivo(disc);
      var avisos = validarPrereqs(disc, per);
      card.classList.toggle("aviso-prereq", avisos.length > 0);
      if (avisos.length > 0) {
        card.title = "⚠ Pré-requisito(s) em período igual ou posterior:\n" + avisos.join("\n");
      } else {
        card.title = "";
      }
    });

    // Optativas alocadas
    estado.optativasAlocadas.forEach(function (a, idx) {
      var card = document.getElementById("card-opt-" + idx);
      if (!card) return;
      var opt = mapDisc[a.optId];
      card.classList.toggle("concluida", !!estado.concluidas[a.optId]);
      if (opt && !estado.concluidas[a.optId]) {
        card.classList.toggle("liberada", isLiberada(opt));
      } else {
        card.classList.remove("liberada");
      }
      // Aviso prereqs
      if (opt) {
        var avisos = validarPrereqs(opt, a.periodo);
        card.classList.toggle("aviso-prereq", avisos.length > 0);
        if (avisos.length > 0) {
          card.title = "⚠ " + avisos.join("; ");
        } else {
          card.title = "";
        }
      }
    });

    // Semestre headers
    for (var sem = 1; sem <= estado.totalSemestres; sem++) {
      var headerEl = document.getElementById("periodo-header-" + sem);
      if (!headerEl) continue;

      // Atualizar CH no header
      var chSem = chDoSemestre(sem);
      var chSpan = headerEl.querySelector(".periodo-ch");
      if (chSpan) chSpan.textContent = chSem + "h";

      var discsDoSem = obrigatorias.filter(function (d) { return periodoEfetivo(d) === sem; });
      var optsDoSem = estado.optativasAlocadas.filter(function (a) { return a.periodo === sem; });
      var todosConc = (discsDoSem.length + optsDoSem.length) > 0;
      discsDoSem.forEach(function (d) {
        if (!estado.concluidas[d.id]) todosConc = false;
      });
      optsDoSem.forEach(function (a) {
        if (!estado.concluidas[a.optId]) todosConc = false;
      });
      headerEl.classList.toggle("completo", todosConc);
    }

    // Atividades
    atividades.forEach(function (ativ) {
      var card = document.getElementById("card-" + ativ.id);
      if (card) card.classList.toggle("concluida", !!estado.concluidas[ativ.id]);
    });
  }

  // ------- Highlight de dependências -------
  function destacarDependencias(id, prereqs) {
    if (prereqs) {
      prereqs.forEach(function (pId) {
        var el = document.getElementById("card-" + pId);
        if (el) el.classList.add("highlight-prereq");
      });
    }
    var deps = dependentesMap[id];
    if (deps) {
      deps.forEach(function (dId) {
        // Pode ser obrigatória ou optativa
        var el = document.getElementById("card-" + dId);
        if (!el) {
          // Procurar em optativas alocadas
          estado.optativasAlocadas.forEach(function (a, idx) {
            if (a.optId === dId) {
              el = document.getElementById("card-opt-" + idx);
            }
          });
        }
        if (el) el.classList.add("highlight-dep");
      });
    }
  }

  function limparDestaques() {
    document.querySelectorAll(".highlight-prereq, .highlight-dep").forEach(function (el) {
      el.classList.remove("highlight-prereq", "highlight-dep");
    });
  }

  // ============================================================
  // PROGRESSO
  // ============================================================
  function atualizarProgresso() {
    var chConcluida = 0;

    // Obrigatórias concluídas
    obrigatorias.forEach(function (d) {
      if (estado.concluidas[d.id]) chConcluida += d.ch;
    });

    // Optativas concluídas
    estado.optativasAlocadas.forEach(function (a) {
      var opt = mapDisc[a.optId];
      if (opt && estado.concluidas[a.optId]) chConcluida += opt.ch;
    });

    // Atividades concluídas
    atividades.forEach(function (ativ) {
      if (estado.concluidas[ativ.id]) chConcluida += ativ.ch;
    });

    // CH total = fixo 3600h do PPC (não muda com optativas selecionadas)
    var chTotal = RESUMO.chTotal;

    document.getElementById("ch-concluida").textContent = chConcluida + " h";
    document.getElementById("ch-total").textContent = chTotal + " h";
    var pct = Math.round((chConcluida / chTotal) * 100);
    document.getElementById("progresso").textContent = pct + " %";

    // Info de optativas
    var chOpt = 0;
    estado.optativasAlocadas.forEach(function (a) {
      var opt = mapDisc[a.optId];
      if (opt && estado.concluidas[a.optId]) chOpt += opt.ch;
    });
    var optInfo = document.getElementById("opt-info");
    if (optInfo) {
      optInfo.textContent = chOpt + " / " + MIN_CH_OPTATIVAS + " h";
      optInfo.classList.toggle("opt-atingida", chOpt >= MIN_CH_OPTATIVAS);
    }
  }

  // ============================================================
  // MODAL DE OPTATIVA
  // ============================================================
  var modalPeriodoAtual = null;

  function abrirModal(periodo) {
    modalPeriodoAtual = periodo;
    var overlay = document.getElementById("modal-overlay");
    overlay.classList.remove("hidden");
    document.getElementById("modal-busca").value = "";
    popularListaOptativas("");
    document.getElementById("modal-busca").focus();
  }

  function fecharModal() {
    document.getElementById("modal-overlay").classList.add("hidden");
    modalPeriodoAtual = null;
  }

  function popularListaOptativas(filtro) {
    var lista = document.getElementById("modal-lista");
    lista.innerHTML = "";
    var lower = filtro.toLowerCase();

    // Optativas já alocadas
    var usadas = {};
    estado.optativasAlocadas.forEach(function (a) {
      usadas[a.optId] = true;
    });

    optativas.forEach(function (opt) {
      if (lower && opt.nome.toLowerCase().indexOf(lower) === -1 && opt.id.toLowerCase().indexOf(lower) === -1) {
        return;
      }
      var li = document.createElement("li");
      li.innerHTML = opt.nome + ' <span class="opt-ch">' + opt.ch + 'h</span>';

      if (usadas[opt.id]) {
        li.classList.add("disabled");
        li.title = "Já alocada na grade";
      } else {
        li.addEventListener("click", function () {
          selecionarOptativa(opt.id);
        });
      }
      lista.appendChild(li);
    });
  }

  function selecionarOptativa(optId) {
    estado.optativasAlocadas.push({ optId: optId, periodo: modalPeriodoAtual });
    salvar();
    fecharModal();
    renderGrade();
  }

  // ============================================================
  // LIMPAR PROGRESSO
  // ============================================================
  function limparProgresso() {
    document.getElementById("confirmar-overlay").classList.remove("hidden");
  }

  function confirmarLimpar() {
    estado = {
      concluidas: {},
      optativasAlocadas: [],
      posicoesCustom: {},
      totalSemestres: 10
    };
    salvar();
    // Limpar hash da URL
    if (window.location.hash) {
      history.replaceState(null, "", window.location.pathname);
    }
    document.getElementById("confirmar-overlay").classList.add("hidden");
    renderGrade();
  }

  function cancelarLimpar() {
    document.getElementById("confirmar-overlay").classList.add("hidden");
  }

  // ============================================================
  // COMPARTILHAR VIA URL
  // ============================================================
  function compartilhar() {
    try {
      var json = JSON.stringify(estado);
      var encoded = btoa(unescape(encodeURIComponent(json)));
      var url = window.location.origin + window.location.pathname + "#" + encoded;
      navigator.clipboard.writeText(url).then(function () {
        mostrarToast("Link copiado! 📋");
      }).catch(function () {
        // Fallback
        prompt("Copie o link:", url);
      });
    } catch (e) {
      alert("Erro ao gerar link.");
    }
  }

  function carregarDeURL() {
    var hash = window.location.hash;
    if (!hash || hash.length < 2) return false;
    try {
      var decoded = decodeURIComponent(escape(atob(hash.substring(1))));
      var parsed = JSON.parse(decoded);
      migrarEstado(parsed);
      // Limpar hash para não interferir com uso normal
      history.replaceState(null, "", window.location.pathname);
      return true;
    } catch (e) {
      return false;
    }
  }

  function mostrarToast(msg) {
    var toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(function () {
      toast.classList.remove("show");
    }, 2200);
  }

  // ============================================================
  // INIT
  // ============================================================
  function init() {
    carregar();
    renderGrade();

    document.getElementById("btn-limpar").addEventListener("click", limparProgresso);
    document.getElementById("confirmar-sim").addEventListener("click", confirmarLimpar);
    document.getElementById("confirmar-nao").addEventListener("click", cancelarLimpar);
    document.getElementById("modal-fechar").addEventListener("click", fecharModal);
    document.getElementById("modal-overlay").addEventListener("click", function (e) {
      if (e.target === this) fecharModal();
    });
    document.getElementById("modal-busca").addEventListener("input", function () {
      popularListaOptativas(this.value);
    });

    var btnCompartilhar = document.getElementById("btn-compartilhar");
    if (btnCompartilhar) {
      btnCompartilhar.addEventListener("click", compartilhar);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
