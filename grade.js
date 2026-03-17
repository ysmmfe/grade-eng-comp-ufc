// ============================================================
// Grade Interativa — Eng. de Computação UFC
// Lógica: renderização, toggle, highlight, localStorage, optativas
// ============================================================

(function () {
  "use strict";

  // ------- Estado -------
  var estado = {
    concluidas: {},      // { id: true }
    optativaSlots: {}    // { slotId: optativaId }
  };

  // ------- Helpers -------
  function salvar() {
    localStorage.setItem("grade-ec-ufc", JSON.stringify(estado));
  }
  function carregar() {
    var raw = localStorage.getItem("grade-ec-ufc");
    if (raw) {
      try {
        var parsed = JSON.parse(raw);
        estado.concluidas = parsed.concluidas || {};
        estado.optativaSlots = parsed.optativaSlots || {};
      } catch (e) { /* corrupted, ignore */ }
    }
  }

  // Mapa de id -> disciplina (inclui obrigatórias + optativas)
  var mapDisc = {};
  obrigatorias.forEach(function (d) { mapDisc[d.id] = d; });
  optativas.forEach(function (d) { mapDisc[d.id] = d; });

  // Calcular todos os dependentes de cada disciplina  (pós-requisitos diretos)
  var dependentesMap = {};  // { id: [ids] }
  function buildDependentesMap() {
    dependentesMap = {};
    obrigatorias.forEach(function (d) {
      d.prereqs.forEach(function (p) {
        if (!dependentesMap[p]) dependentesMap[p] = [];
        dependentesMap[p].push(d.id);
      });
    });
    // Incluir optativas selecionadas
    Object.keys(estado.optativaSlots).forEach(function(slotId) {
      var optId = estado.optativaSlots[slotId];
      var opt = mapDisc[optId];
      if (opt && opt.prereqs) {
        opt.prereqs.forEach(function(p) {
          if (!dependentesMap[p]) dependentesMap[p] = [];
          dependentesMap[p].push(slotId);
        });
      }
    });
  }

  // Checar se todos os prereqs de uma disciplina estão concluídos
  function isLiberada(disc) {
    if (!disc.prereqs || disc.prereqs.length === 0) return true;
    return disc.prereqs.every(function (p) { return estado.concluidas[p]; });
  }

  // ------- Renderização -------
  function renderGrade() {
    buildDependentesMap();
    var container = document.getElementById("grade-container");
    container.innerHTML = "";

    for (var sem = 1; sem <= TOTAL_SEMESTRES; sem++) {
      var coluna = document.createElement("div");
      coluna.className = "periodo-coluna";

      // Header do semestre
      var header = document.createElement("div");
      header.className = "periodo-header";
      header.id = "periodo-header-" + sem;
      header.textContent = sem + "º Período";
      coluna.appendChild(header);

      // Disciplinas obrigatórias deste semestre
      var discsDoSem = obrigatorias.filter(function (d) { return d.periodo === sem; });

      discsDoSem.forEach(function (disc) {
        coluna.appendChild(criarCardObrigatoria(disc));
      });

      // Slots de optativas
      var slotInfo = slotsOptativas.find(function (s) { return s.periodo === sem; });
      if (slotInfo) {
        for (var i = 0; i < slotInfo.quantidade; i++) {
          var slotId = "OPT_" + sem + "_" + (i + 1);
          coluna.appendChild(criarCardOptativa(slotId, sem));
        }
      }

      container.appendChild(coluna);
    }

    renderAtividades();
    atualizarEstadoVisual();
    atualizarProgresso();
  }

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

  function criarCardObrigatoria(disc) {
    var card = document.createElement("div");
    card.className = "disciplina";
    card.id = "card-" + disc.id;
    card.dataset.id = disc.id;
    card.dataset.tipo = "obr";

    card.innerHTML =
      '<span class="disc-nome">' + disc.nome + '</span>' +
      '<span class="disc-ch">' + disc.ch + 'h</span>';

    card.addEventListener("click", function () {
      toggleConclusao(disc.id);
    });
    card.addEventListener("mouseenter", function () {
      destacarDependencias(disc.id, disc.prereqs);
    });
    card.addEventListener("mouseleave", limparDestaques);

    return card;
  }

  function criarCardOptativa(slotId, sem) {
    var card = document.createElement("div");
    card.className = "disciplina optativa-slot";
    card.id = "card-" + slotId;
    card.dataset.id = slotId;
    card.dataset.tipo = "opt";
    card.dataset.periodo = sem;

    var optId = estado.optativaSlots[slotId];
    var opt = optId ? mapDisc[optId] : null;

    if (opt) {
      card.classList.add("preenchida");
      card.innerHTML =
        '<span class="disc-nome">' + opt.nome + '</span>' +
        '<span class="disc-ch">' + opt.ch + 'h</span>' +
        '<button class="optativa-trocar" title="Trocar optativa">✎</button>';

      card.querySelector(".optativa-trocar").addEventListener("click", function (e) {
        e.stopPropagation();
        abrirModal(slotId);
      });

      card.addEventListener("click", function () {
        toggleConclusao(slotId);
      });
      card.addEventListener("mouseenter", function () {
        destacarDependencias(slotId, opt.prereqs);
      });
      card.addEventListener("mouseleave", limparDestaques);
    } else {
      card.innerHTML =
        '<span class="disc-nome">Optativa</span>' +
        '<span class="disc-ch">Clique para escolher</span>';

      card.addEventListener("click", function () {
        abrirModal(slotId);
      });
    }

    return card;
  }

  // ------- Toggle conclusão -------
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

  // ------- Atualizar visual -------
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
    });

    // Optativas slots
    slotsOptativas.forEach(function (slotInfo) {
      for (var i = 0; i < slotInfo.quantidade; i++) {
        var slotId = "OPT_" + slotInfo.periodo + "_" + (i + 1);
        var card = document.getElementById("card-" + slotId);
        if (!card) continue;
        card.classList.toggle("concluida", !!estado.concluidas[slotId]);

        var optId = estado.optativaSlots[slotId];
        var opt = optId ? mapDisc[optId] : null;
        if (opt && !estado.concluidas[slotId]) {
          card.classList.toggle("liberada", isLiberada(opt));
        } else {
          card.classList.remove("liberada");
        }
      }
    });

    // Headers de semestre
    for (var sem = 1; sem <= TOTAL_SEMESTRES; sem++) {
      var headerEl = document.getElementById("periodo-header-" + sem);
      if (!headerEl) continue;
      var discsDoSem = obrigatorias.filter(function (d) { return d.periodo === sem; });
      var todosConc = discsDoSem.length > 0 && discsDoSem.every(function (d) {
        return estado.concluidas[d.id];
      });

      // Checar slots de optativa do semestre
      var slotInfo = slotsOptativas.find(function (s) { return s.periodo === sem; });
      if (slotInfo) {
        for (var i = 0; i < slotInfo.quantidade; i++) {
          var slotId = "OPT_" + sem + "_" + (i + 1);
          if (!estado.concluidas[slotId]) todosConc = false;
        }
      }

      headerEl.classList.toggle("completo", todosConc);
    }

    // Atividades
    atividades.forEach(function (ativ) {
      var card = document.getElementById("card-" + ativ.id);
      if (card) card.classList.toggle("concluida", !!estado.concluidas[ativ.id]);
    });
  }

  // ------- Highlight de dependências (hover) -------
  function destacarDependencias(id, prereqs) {
    // Pré-requisitos em vermelho
    if (prereqs) {
      prereqs.forEach(function (pId) {
        var el = document.getElementById("card-" + pId);
        if (el) el.classList.add("highlight-prereq");
      });
    }
    // Dependentes (pós-requisitos diretos) em verde
    var deps = dependentesMap[id];
    if (deps) {
      deps.forEach(function (dId) {
        var el = document.getElementById("card-" + dId);
        if (el) el.classList.add("highlight-dep");
      });
    }
  }

  function limparDestaques() {
    document.querySelectorAll(".highlight-prereq, .highlight-dep").forEach(function (el) {
      el.classList.remove("highlight-prereq", "highlight-dep");
    });
  }

  // ------- Progresso -------
  function atualizarProgresso() {
    var chConcluida = 0;
    var chTotal = 0;

    obrigatorias.forEach(function (d) {
      chTotal += d.ch;
      if (estado.concluidas[d.id]) chConcluida += d.ch;
    });

    // Optativas concluídas
    slotsOptativas.forEach(function (slotInfo) {
      for (var i = 0; i < slotInfo.quantidade; i++) {
        var slotId = "OPT_" + slotInfo.periodo + "_" + (i + 1);
        var optId = estado.optativaSlots[slotId];
        var opt = optId ? mapDisc[optId] : null;
        var ch = opt ? opt.ch : 64;
        chTotal += ch;
        if (estado.concluidas[slotId]) chConcluida += ch;
      }
    });

    // Atividades obrigatórias (Extensão + Ativ. Complementares)
    atividades.forEach(function (ativ) {
      chTotal += ativ.ch;
      if (estado.concluidas[ativ.id]) chConcluida += ativ.ch;
    });

    document.getElementById("ch-concluida").textContent = chConcluida + " h";
    document.getElementById("ch-total").textContent = chTotal + " h";
    var pct = chTotal > 0 ? Math.round((chConcluida / chTotal) * 100) : 0;
    document.getElementById("progresso").textContent = pct + " %";
  }

  // ------- Modal de optativa -------
  var modalSlotAtual = null;

  function abrirModal(slotId) {
    modalSlotAtual = slotId;
    var overlay = document.getElementById("modal-overlay");
    overlay.classList.remove("hidden");
    document.getElementById("modal-busca").value = "";
    popularListaOptativas("");
    document.getElementById("modal-busca").focus();
  }

  function fecharModal() {
    document.getElementById("modal-overlay").classList.add("hidden");
    modalSlotAtual = null;
  }

  function popularListaOptativas(filtro) {
    var lista = document.getElementById("modal-lista");
    lista.innerHTML = "";
    var lower = filtro.toLowerCase();

    // Optativas já alocadas em outros slots
    var usadas = {};
    Object.keys(estado.optativaSlots).forEach(function (sId) {
      if (sId !== modalSlotAtual) {
        usadas[estado.optativaSlots[sId]] = true;
      }
    });

    optativas.forEach(function (opt) {
      if (lower && opt.nome.toLowerCase().indexOf(lower) === -1 && opt.id.toLowerCase().indexOf(lower) === -1) {
        return;
      }
      var li = document.createElement("li");
      li.innerHTML = opt.nome + ' <span class="opt-ch">' + opt.ch + 'h</span>';

      if (usadas[opt.id]) {
        li.classList.add("disabled");
        li.title = "Já alocada em outro slot";
      } else {
        li.addEventListener("click", function () {
          selecionarOptativa(opt.id);
        });
      }
      lista.appendChild(li);
    });
  }

  function selecionarOptativa(optId) {
    estado.optativaSlots[modalSlotAtual] = optId;
    salvar();
    fecharModal();
    renderGrade();
  }

  // ------- Limpar progresso -------
  function limparProgresso() {
    var overlay = document.getElementById("confirmar-overlay");
    overlay.classList.remove("hidden");
  }

  function confirmarLimpar() {
    estado = { concluidas: {}, optativaSlots: {} };
    salvar();
    document.getElementById("confirmar-overlay").classList.add("hidden");
    renderGrade();
  }

  function cancelarLimpar() {
    document.getElementById("confirmar-overlay").classList.add("hidden");
  }

  // ------- Init -------
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
  }

  document.addEventListener("DOMContentLoaded", init);
})();
